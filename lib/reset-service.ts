import { File } from 'expo-file-system';
import { ensureAnonymousSession, supabase } from '@/lib/supabase';
import { ResetGoal, ResetPlan } from '@/lib/reset-ai';

type AnalyzeResponse = { plan: ResetPlan; sessionId: string; model: string };

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
    if (error) throw new Error(error.message || 'The AI could not analyze this photo.');
    if (!data?.plan) throw new Error('The AI returned no reset plan.');
    return data;
  } catch (cause) {
    await supabase.from('reset_sessions').update({ status: 'failed' }).eq('id', session.id);
    throw cause;
  }
}
