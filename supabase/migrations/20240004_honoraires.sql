-- ── honoraires_templates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS honoraires_templates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users ON DELETE CASCADE,
  phases               jsonb    DEFAULT '[]'::jsonb,
  tva_taux             numeric  DEFAULT 10,
  texte_intro          text     DEFAULT '',
  texte_mission_defaut text     DEFAULT '',
  bareme               jsonb    DEFAULT '[]'::jsonb,
  clauses_speciales    text     DEFAULT '',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE honoraires_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns honoraires_templates" ON honoraires_templates;
CREATE POLICY "user owns honoraires_templates" ON honoraires_templates
  FOR ALL USING (auth.uid() = user_id);

-- ── devis_honoraires ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devis_honoraires (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users ON DELETE CASCADE,
  numero               text    NOT NULL,
  statut               text    DEFAULT 'Brouillon',
  client_nom           text    DEFAULT '',
  client_adresse       text    DEFAULT '',
  date_devis           date,
  description_mission  text    DEFAULT '',
  budget_travaux       numeric,
  phases               jsonb   DEFAULT '[]'::jsonb,
  tva_taux             numeric DEFAULT 10,
  total_ht             numeric DEFAULT 0,
  clauses_speciales    text    DEFAULT '',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE devis_honoraires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns devis_honoraires" ON devis_honoraires;
CREATE POLICY "user owns devis_honoraires" ON devis_honoraires
  FOR ALL USING (auth.uid() = user_id);
