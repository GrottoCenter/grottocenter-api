\c grottoce;

-- Note: The massif IDs and titles used here (e.g., 4 and 490, "Bois de Monnié") purposefully diverge from the 
-- test fixtures (`test/fixtures/tguideline.json`, which uses IDs 1 and 2, "Vercors Massif"). 
-- This is expected since test fixtures and development seed data operate independently.

-- Disable triggers temporarily during mock seeding to prevent AFTER INSERT trigger on t_guideline from duplicating rows into h_guideline
ALTER TABLE public.t_guideline DISABLE TRIGGER ALL;

INSERT INTO public.t_guideline (id, title, description, id_author, id_reviewer, id_language, date_inscription, date_reviewed, is_deleted) VALUES
(1, 'French National Caving Guideline', 'Guidelines for caving in France: respect private property.', 3, 2, 'fra', '2026-01-01 10:00:00', '2026-01-02 12:00:00', false),
(2, 'Spanish Access Rules', 'Ensure you have permission from local authorities in Spain.', 3, NULL, 'fra', '2026-02-01 10:00:00', NULL, false),
(3, 'Auvergne-Rhône-Alpes Regional Rules', 'Specific access requirements for ARA region.', 3, 2, 'fra', '2026-03-01 10:00:00', '2026-03-02 12:00:00', false),
(4, 'Bois de Monnié Access Restrictions', 'Access to massif 4 is restricted during nesting season.', 3, 2, 'fra', '2026-04-01 10:00:00', '2026-04-02 12:00:00', false),
(5, 'Chablais Massif General Rules', 'Guidelines for massif 490.', 3, NULL, 'fra', '2026-05-01 10:00:00', NULL, false);

INSERT INTO public.h_guideline (id, title, description, id_author, id_reviewer, id_language, date_inscription, date_reviewed, is_deleted) VALUES
(1, 'French National Caving Guideline Draft', 'Draft guidelines.', 3, NULL, 'fra', '2026-01-01 10:00:00', '2026-01-02 12:00:00', false),
(3, 'Auvergne-Rhône-Alpes Regional Rules Draft', 'Initial draft for regional rules.', 3, NULL, 'fra', '2026-03-01 10:00:00', '2026-03-02 12:00:00', false),
(4, 'Bois de Monnié Draft', 'Initial draft for Bois de Monnié massif.', 3, NULL, 'fra', '2026-04-01 10:00:00', '2026-04-02 12:00:00', false);

-- Seed join tables
INSERT INTO public.j_guideline_country (id_guideline, id_country) VALUES
(1, 'FR'),
(2, 'ES');

INSERT INTO public.j_guideline_region (id_guideline, id_region) VALUES
(3, 'FR-01');

INSERT INTO public.j_guideline_massif (id_guideline, id_massif) VALUES
(4, 4),
(5, 490);

-- Re-enable triggers
ALTER TABLE public.t_guideline ENABLE TRIGGER ALL;

-- Set primary key sequence for t_guideline
SELECT SETVAL('public.t_guideline_id_seq', 5);

