\c grottoce;

-- =============================================================================
-- #1883: accept GLB and glTF 3D models as document files
-- MIME types are the IANA registered ones (model/gltf-binary, model/gltf+json).
-- =============================================================================

INSERT INTO public.t_file_format (extension, mime_type)
SELECT 'glb', 'model/gltf-binary'
WHERE NOT EXISTS (SELECT 1 FROM public.t_file_format WHERE extension = 'glb');

INSERT INTO public.t_file_format (extension, mime_type)
SELECT 'gltf', 'model/gltf+json'
WHERE NOT EXISTS (SELECT 1 FROM public.t_file_format WHERE extension = 'gltf');
