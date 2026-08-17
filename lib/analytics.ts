import { ensureAnonymousSession, supabase } from '@/lib/supabase';

export type AnalyticsEventName =
  | 'app_opened'
  | 'photo_captured'
  | 'plan_generated'
  | 'reset_started'
  | 'task_completed'
  | 'task_skipped'
  | 'reset_completed'
  | 'after_photo_saved'
  | 'share_opened'
  | 'paywall_opened'
  | 'subscription_purchased'
  | 'purchase_restored';

export function trackEvent(eventName: AnalyticsEventName, properties: Record<string, string | number | boolean | null> = {}, sessionId?: string) {
  void ensureAnonymousSession().then((session) => supabase.from('analytics_events').insert({
    user_id: session.user.id,
    session_id: sessionId ?? null,
    event_name: eventName,
    properties,
  })).then(({ error }) => { if (error && __DEV__) console.warn('Analytics event was not saved:', error.message); }).catch(() => {});
}

export function reportError(source: string, cause: unknown) {
  const message = cause instanceof Error ? cause.message : 'Unknown application error';
  void ensureAnonymousSession().then((session) => supabase.from('app_errors').insert({ user_id: session.user.id, source, message: message.slice(0, 300) })).catch(() => {});
}

export type HealthMetrics = { events: number; aiRuns: number; aiSuccessRate: number; averageLatencyMs: number; totalTokens: number; appErrors: number };

export async function getHealthMetrics(): Promise<HealthMetrics> {
  await ensureAnonymousSession();
  const [{ count: events }, { data: runs, error }, { count: appErrors }] = await Promise.all([
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }),
    supabase.from('ai_runs').select('status, latency_ms, total_tokens'),
    supabase.from('app_errors').select('id', { count: 'exact', head: true }),
  ]);
  if (error) throw new Error(error.message);
  const aiRuns = runs?.length ?? 0;
  const successes = runs?.filter((run) => run.status === 'succeeded').length ?? 0;
  return {
    events: events ?? 0,
    aiRuns,
    aiSuccessRate: aiRuns ? Math.round((successes / aiRuns) * 100) : 0,
    averageLatencyMs: aiRuns ? Math.round((runs ?? []).reduce((sum, run) => sum + run.latency_ms, 0) / aiRuns) : 0,
    totalTokens: (runs ?? []).reduce((sum, run) => sum + (run.total_tokens ?? 0), 0),
    appErrors: appErrors ?? 0,
  };
}
