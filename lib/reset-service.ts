import { File } from 'expo-file-system';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';
import { ResetGoal, ResetPlan } from '@/lib/reset-ai';

type AnalyzeResponse = { plan: ResetPlan; sessionId: string; model: string };

export async function startResetSession(sessionId: string) {
  const { error } = await supabase.from('reset_sessions').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', sessionId);
  if (error) throw new Error(error.message);
}

export async function completeResetTask(sessionId: string, position: number) {
  const { error } = await supabase.from('reset_tasks').update({ completed_at: new Date().toISOString() }).eq('session_id', sessionId).eq('position', position);
  if (error) throw new Error(error.message);
}

export async function completeResetSession(sessionId: string) {
  const { error } = await supabase.from('reset_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId);
  if (error) throw new Error(error.message);
}

export type ResetProgress = {
  completedResets: number;
  completedMinutes: number;
  history: ResetHistoryItem[];
};

export type ResetHistoryItem = {
  id: string;
  title: string;
  roomType: string;
  completedAt: string;
  minutes: number;
  beforeUrl: string | null;
  afterUrl: string | null;
};

export async function saveAfterPhoto(sessionId: string, photoUri: string) {
  const authSession = await ensureAnonymousSession();
  const path = `${authSession.user.id}/${sessionId}/after.jpg`;
  const image = new File(photoUri);
  const bytes = await image.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('room-photos').upload(path, bytes, { contentType: image.type || 'image/jpeg', upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const { error } = await supabase.from('reset_sessions').update({ after_photo_path: path }).eq('id', sessionId);
  if (error) throw new Error(error.message);
  return path;
}

async function signedPhotoUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('room-photos').createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

export async function getResetProgress(): Promise<ResetProgress> {
  await ensureAnonymousSession();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const { data, error } = await supabase
    .from('reset_sessions')
    .select('id, room_type, plan, estimated_minutes, completed_at, photo_path, after_photo_path')
    .eq('status', 'completed')
    .gte('completed_at', weekStart.toISOString())
    .order('completed_at', { ascending: false });
  if (error) throw new Error(error.message);
  const sessions = data ?? [];
  const history = await Promise.all(sessions.map(async (item) => ({
    id: item.id,
    title: (item.plan as ResetPlan | null)?.title ?? 'Completed reset',
    roomType: item.room_type ?? 'Room',
    completedAt: item.completed_at!,
    minutes: item.estimated_minutes ?? 0,
    beforeUrl: await signedPhotoUrl(item.photo_path),
    afterUrl: await signedPhotoUrl(item.after_photo_path),
  })));
  return {
    completedResets: sessions.length,
    completedMinutes: sessions.reduce((sum, item) => sum + (item.estimated_minutes ?? 0), 0),
    history,
  };
}

export async function analyzeRoomPhoto(photoUri: string, minutes: number, goal: ResetGoal): Promise<AnalyzeResponse> {
  const authSession = await ensureAnonymousSession();
  const { data: session, error: createError } = await supabase
    .from('reset_sessions')
    .insert({ user_id: authSession.user.id, goal, requested_minutes: minutes, status: 'draft' })
    .select('id')
    .single();
  if (createError || !session) throw new Error(createError?.message ?? 'Could not start a reset session.');

  const path = `${authSession.user.id}/${session.id}/before.jpg`;
  try {
    const image = new File(photoUri);
    const bytes = await image.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from('room-photos').upload(path, bytes, { contentType: image.type || 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabase.from('reset_sessions').update({ photo_path: path, status: 'analyzing' }).eq('id', session.id);
    if (updateError) throw updateError;

    const { data, error } = await supabase.functions.invoke<AnalyzeResponse>('analyze-room', { body: { sessionId: session.id } });
    if (error) {
      let message = error.message || 'The AI could not analyze this photo.';
      const context = 'context' in error ? error.context : null;
      if (context instanceof Response) {
        try { const body = await context.json(); if (body?.error) message = body.error; } catch { /* Keep the safe fallback message. */ }
      }
      throw new Error(message);
    }
    if (!data?.plan) throw new Error('The AI returned no reset plan.');
    return data;
  } catch (cause) {
    await supabase.from('reset_sessions').update({ status: 'failed' }).eq('id', session.id);
    throw cause;
  }
}
