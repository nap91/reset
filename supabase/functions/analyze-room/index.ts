// The authenticated AI endpoint is implemented in Step 8.
// Its OpenAI key will be supplied through Supabase secrets, never the app bundle.
Deno.serve(() => Response.json({ error: 'AI connection is not configured yet.' }, { status: 501 }));
