CREATE TABLE IF NOT EXISTS locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS locks_no_public_access ON locks;
CREATE POLICY locks_no_public_access ON locks FOR ALL USING (false) WITH CHECK (false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS designs_public_read ON storage.objects;
CREATE POLICY designs_public_read ON storage.objects FOR SELECT
USING (bucket_id = 'designs');

DROP POLICY IF EXISTS designs_owner_write ON storage.objects;
CREATE POLICY designs_owner_write ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'designs'
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('owner','admin'))
);