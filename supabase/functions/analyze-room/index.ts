import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.6-luna';
const SYSTEM_PROMPT = `You are Reset, a calm room-reset coach. Analyze one room photo and create a short plan that maximizes visible or functional improvement within the user's exact time budget.

Rules:
- Prefer obvious, high-impact actions: trash, dishes, laundry, clearing a main surface, making a bed, opening a walkway.
- Do not invent objects that are not clearly visible.
- Do not identify people, infer sensitive traits, judge cleanliness, or use shaming language.
- Keep each task concrete, physically safe, and completable in one uninterrupted burst.
- Task estimates must sum to no more than 90% of the time budget, leaving transition time.
- Return 2-3 tasks for 5 minutes, 3-5 for 10 minutes, and 4-7 for 20 minutes.
- Mention a safety note only for a clearly visible hazard; otherwise return null.`;

const schema = {
  type: 'object', additionalProperties: false,
  required: ['title', 'summary', 'roomType', 'requestedMinutes', 'estimatedMinutes', 'goal', 'tasks', 'safetyNote'],
  properties: {
    title: { type: 'string' }, summary: { type: 'string' }, roomType: { type: 'string' }, requestedMinutes: { type: 'number' }, estimatedMinutes: { type: 'number' },
    goal: { type: 'string', enum: ['quick', 'guest', 'calm', 'function'] },
    tasks: { type: 'array', minItems: 2, maxItems: 7, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'title', 'instruction', 'area', 'estimatedSeconds', 'impact', 'whyItMatters'],
      properties: { id: { type: 'string' }, title: { type: 'string' }, instruction: { type: 'string' }, area: { type: 'string' }, estimatedSeconds: { type: 'number' }, impact: { type: 'string', enum: ['high', 'medium'] }, whyItMatters: { type: 'string' } },
    } },
    safetyNote: { type: ['string', 'null'] },
  },
};

type ResetPlan = {
  title: string; summary: string; roomType: string; requestedMinutes: number; estimatedMinutes: number;
  goal: 'quick' | 'guest' | 'calm' | 'function'; safetyNote: string | null;
  tasks: { id: string; title: string; instruction: string; area: string; estimatedSeconds: number; impact: 'high' | 'medium'; whyItMatters: string }[];
};

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function extractOutputText(response: { output?: { content?: { type?: string; text?: string }[] }[] }) {
  for (const item of response.output ?? []) for (const content of item.content ?? []) if (content.type === 'output_text' && content.text) return content.text;
  return null;
}

function validatePlan(value: unknown, minutes: number, goal: string): asserts value is ResetPlan {
  if (!value || typeof value !== 'object') throw new Error('AI returned an invalid plan.');
  const plan = value as ResetPlan;
  if (plan.requestedMinutes !== minutes || plan.goal !== goal || !Array.isArray(plan.tasks)) throw new Error('AI plan does not match the request.');
  const limits = minutes === 5 ? [2, 3] : minutes === 10 ? [3, 5] : [4, 7];
  if (plan.tasks.length < limits[0] || plan.tasks.length > limits[1]) throw new Error('AI returned the wrong number of tasks.');
  const totalSeconds = plan.tasks.reduce((sum, task) => sum + Number(task.estimatedSeconds), 0);
  if (!Number.isFinite(totalSeconds) || totalSeconds > minutes * 60 * 0.9) throw new Error('AI plan exceeds the time budget.');
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!authHeader || !supabaseUrl || !supabaseKey) return Response.json({ error: 'Backend authentication is unavailable.' }, { status: 401, headers: corsHeaders });
  if (!openaiKey) return Response.json({ error: 'OpenAI is not configured yet.' }, { status: 503, headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return Response.json({ error: 'Your session is not valid.' }, { status: 401, headers: corsHeaders });

  let sessionId: string | undefined;
  try {
    ({ sessionId } = await req.json());
    if (!sessionId) throw new Error('A session ID is required.');
    const { data: session, error: sessionError } = await supabase.from('reset_sessions').select('id,user_id,goal,requested_minutes,photo_path').eq('id', sessionId).single();
    if (sessionError || !session || session.user_id !== user.id || !session.photo_path) throw new Error('Reset session or photo was not found.');

    const { data: photo, error: photoError } = await supabase.storage.from('room-photos').download(session.photo_path);
    if (photoError || !photo) throw new Error('The room photo could not be downloaded.');
    const mime = photo.type || 'image/jpeg';
    const imageUrl = `data:${mime};base64,${toBase64(await photo.arrayBuffer())}`;
    const prompt = `Create a ${session.requested_minutes}-minute reset plan. The user's goal is ${session.goal}. Rank tasks by visible improvement per minute and stay within ${Math.floor(session.requested_minutes * 0.9)} working minutes.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
          { role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: imageUrl, detail: 'low' }] },
        ],
        text: { format: { type: 'json_schema', name: 'reset_plan', strict: true, schema } },
        max_output_tokens: 1800,
      }),
    });
    const raw = await openaiResponse.json();
    if (!openaiResponse.ok) throw new Error(raw?.error?.message ?? 'OpenAI could not analyze the room.');
    const outputText = extractOutputText(raw);
    if (!outputText) throw new Error('OpenAI returned no plan.');
    const plan: unknown = JSON.parse(outputText);
    validatePlan(plan, session.requested_minutes, session.goal);

    const { error: updateError } = await supabase.from('reset_sessions').update({ status: 'ready', plan, room_type: plan.roomType, estimated_minutes: plan.estimatedMinutes }).eq('id', session.id);
    if (updateError) throw updateError;
    const taskRows = plan.tasks.map((task, index) => ({ session_id: session.id, user_id: user.id, position: index + 1, title: task.title, instruction: task.instruction, area: task.area, estimated_seconds: task.estimatedSeconds, impact: task.impact, why_it_matters: task.whyItMatters }));
    const { error: taskError } = await supabase.from('reset_tasks').insert(taskRows);
    if (taskError) throw taskError;

    const usage = raw?.usage ?? {};
    const { error: metricError } = await supabase.from('ai_runs').insert({
      user_id: user.id,
      session_id: session.id,
      model: MODEL,
      status: 'succeeded',
      latency_ms: Date.now() - startedAt,
      input_tokens: usage.input_tokens ?? null,
      output_tokens: usage.output_tokens ?? null,
      total_tokens: usage.total_tokens ?? null,
      provider_request_id: raw?.id ?? null,
    });
    if (metricError) console.error('AI success metric was not saved:', metricError.message);

    return Response.json({ plan, sessionId: session.id, model: MODEL }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (cause) {
    if (sessionId) await supabase.from('reset_sessions').update({ status: 'failed' }).eq('id', sessionId);
    const message = cause instanceof Error ? cause.message : 'Room analysis failed.';
    if (sessionId) {
      const { error: metricError } = await supabase.from('ai_runs').insert({ user_id: user.id, session_id: sessionId, model: MODEL, status: 'failed', latency_ms: Date.now() - startedAt, error_code: message.slice(0, 120) });
      if (metricError) console.error('AI failure metric was not saved:', metricError.message);
    }
    console.error('analyze-room failed:', message);
    return Response.json({ error: message }, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
