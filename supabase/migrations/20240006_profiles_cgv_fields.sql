-- Ajout des champs métier au profil utilisateur (CGV, identification, assurance)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS societe text,
  ADD COLUMN IF NOT EXISTS siret text,
  ADD COLUMN IF NOT EXISTS tva_intracom text,
  ADD COLUMN IF NOT EXISTS code_ape text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS assurance_nom text,
  ADD COLUMN IF NOT EXISTS assurance_contrat text,
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS code_postal text;
