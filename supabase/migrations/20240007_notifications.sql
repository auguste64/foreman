-- ── notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE,
  type       text NOT NULL,
  titre      text NOT NULL DEFAULT '',
  message    text NOT NULL DEFAULT '',
  lien       text,
  lu         boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns notifications" ON notifications;
CREATE POLICY "user owns notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
