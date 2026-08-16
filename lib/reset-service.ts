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
  latest: { id: string; title: string; roomType: string; completedAt: string; minutes: number } | null;
};

export async function getResetProgress(): Promise<ResetProgress> {
  await ensureAnonymousSession();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const { data, error } = await supabase
    .from('reset_sessions')
    .select('id, room_type, plan, estimated_minutes, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', weekStart.toISOString())
    .order('completed_at', { ascending: false });
  if (error) throw new Error(error.message);
  const sessions = data ?? [];
  const latest = sessions[0];
  return {
    completedResets: sessions.length,
    completedMinutes: sessions.reduce((sum, item) => sum + (item.estimated_minutes ?? 0), 0),
    latest: latest ? { id: latest.id, title: (latest.plan as ResetPlan | null)?.title ?? 'Completed reset', roomType: latest.room_type ?? 'Room', completedAt: latest.completed_at!, minutes: latest.estimated_minutes ?? 0 } : null,
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
