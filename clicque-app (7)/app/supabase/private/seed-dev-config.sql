-- PRIVATE: contains your NVIDIA API key. Do not share this file or put it in a public repository.
-- Run it once in the Supabase SQL editor (after supabase/schema.sql). It stores the key in the private table dev_config.
-- To change the key later, use the Developer screen in the game (open the game address followed by #dev, then Settings > Developer).
insert into public.dev_config (id, data)
values ('ai', jsonb_build_object(
  'provider', 'nvidia',
  'model', 'meta/llama-3.1-70b-instruct',
  'key', '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'
))
on conflict (id) do update set data = excluded.data, updated_at = now();
