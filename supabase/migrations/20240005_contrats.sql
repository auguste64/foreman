-- ── contrats ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contrats (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users ON DELETE CASCADE,
  nom_moe           text    DEFAULT '',
  nom_client        text    DEFAULT '',
  adresse_chantier  text    DEFAULT '',
  budget_estimatif  numeric DEFAULT 0,
  date_contrat      date,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns contrats" ON contrats;
CREATE POLICY "user owns contrats" ON contrats
  FOR ALL USING (auth.uid() = user_id);
