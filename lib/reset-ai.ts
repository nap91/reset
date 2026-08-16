export type ResetGoal = 'quick' | 'guest' | 'calm' | 'function';

export type ResetTask = {
  id: string;
  title: string;
  instruction: string;
  area: string;
  estimatedSeconds: number;
  impact: 'high' | 'medium';
  whyItMatters: string;
};

export type ResetPlan = {
  title: string;
  summary: string;
  roomType: string;
  requestedMinutes: number;
  estimatedMinutes: number;
  goal: ResetGoal;
  tasks: ResetTask[];
  safetyNote: string | null;
};

export const RESET_MODEL = 'gpt-5.6-luna';

export const RESET_SYSTEM_PROMPT = `You are Reset, a calm room-reset coach. Analyze one room photo and create a short plan that maximizes visible or functional improvement within the user's exact time budget.

Rules:
- Prefer obvious, high-impact actions: trash, dishes, laundry, clearing a main surface, making a bed, opening a walkway.
- Do not invent objects that are not clearly visible.
- Do not identify people, infer sensitive traits, judge cleanliness, or use shaming language.
- Keep each task concrete, physically safe, and completable in one uninterrupted burst.
- Task estimates must sum to no more than 90% of the time budget, leaving transition time.
- Return 2-3 tasks for 5 minutes, 3-5 for 10 minutes, and 4-7 for 20 minutes.
- Mention a safety note only for a clearly visible hazard; otherwise return null.
- Return only data matching the supplied JSON schema.`;

export const resetPlanJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'roomType', 'requestedMinutes', 'estimatedMinutes', 'goal', 'tasks', 'safetyNote'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    roomType: { type: 'string' },
    requestedMinutes: { type: 'number' },
    estimatedMinutes: { type: 'number' },
    goal: { type: 'string', enum: ['quick', 'guest', 'calm', 'function'] },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'instruction', 'area', 'estimatedSeconds', 'impact', 'whyItMatters'],
        properties: {
          id: { type: 'string' }, title: { type: 'string' }, instruction: { type: 'string' }, area: { type: 'string' },
          estimatedSeconds: { type: 'number' }, impact: { type: 'string', enum: ['high', 'medium'] }, whyItMatters: { type: 'string' },
        },
      },
    },
    safetyNote: { type: ['string', 'null'] },
  },
} as const;

export function buildResetRequest(minutes: number, goal: ResetGoal) {
  return `Create a ${minutes}-minute reset plan. The user's goal is ${goal}. Rank tasks by visible improvement per minute and stay within ${Math.floor(minutes * 0.9)} working minutes.`;
}

const candidates: ResetTask[] = [
  { id: 'floor', title: 'Clear the floor', instruction: 'Put loose clothes into one laundry basket and place shoes together by the wall.', area: 'Main floor', estimatedSeconds: 120, impact: 'high', whyItMatters: 'An open walkway makes the whole room feel calmer.' },
  { id: 'desk', title: 'Reset the desk', instruction: 'Remove cups, wrappers, and anything that belongs in another room.', area: 'Desk', estimatedSeconds: 120, impact: 'high', whyItMatters: 'One clear work surface restores function quickly.' },
  { id: 'bed', title: 'Straighten the largest surface', instruction: 'Smooth the bedding or fold the throw so the main surface looks intentional.', area: 'Bed or seating', estimatedSeconds: 90, impact: 'high', whyItMatters: 'The largest surface drives the room’s visual impression.' },
  { id: 'trash', title: 'Collect visible trash', instruction: 'Make one pass with a bag for wrappers, receipts, and empty containers.', area: 'Whole room', estimatedSeconds: 150, impact: 'high', whyItMatters: 'Removing visual noise creates an immediate reset.' },
  { id: 'group', title: 'Group the remaining loose items', instruction: 'Place similar items together in one temporary sorting zone.', area: 'Open surfaces', estimatedSeconds: 180, impact: 'medium', whyItMatters: 'Simple grouping makes clutter look controlled without over-sorting.' },
  { id: 'finish', title: 'Do a final visual sweep', instruction: 'Return one obvious out-of-place item and straighten chairs or cushions.', area: 'Whole room', estimatedSeconds: 120, impact: 'medium', whyItMatters: 'A quick finishing pass makes the reset feel complete.' },
  { id: 'surfaces', title: 'Finish the open surfaces', instruction: 'Wipe or straighten the surfaces you just cleared, without starting a deeper organization project.', area: 'Desk and tables', estimatedSeconds: 180, impact: 'medium', whyItMatters: 'Clean visual lines make the room feel intentionally reset.' },
];

export function createMockResetPlan(minutes: number, goal: ResetGoal): ResetPlan {
  const workingSeconds = Math.floor(minutes * 60 * 0.9);
  const tasks: ResetTask[] = [];
  let used = 0;
  for (const task of candidates) {
    if (used + task.estimatedSeconds <= workingSeconds) { tasks.push(task); used += task.estimatedSeconds; }
  }
  return {
    title: `${minutes}-Minute ${goal === 'guest' ? 'Guest-Ready' : goal === 'function' ? 'Functional' : goal === 'calm' ? 'Calm' : 'Quick'} Reset`,
    summary: 'Start with the largest visual wins. You do not need to finish the whole room.',
    roomType: 'Multi-purpose room', requestedMinutes: minutes, estimatedMinutes: Math.ceil(used / 60), goal, tasks,
    safetyNote: null,
  };
}
