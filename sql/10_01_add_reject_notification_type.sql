\c grottoce;

INSERT INTO public.t_notification_type (id, "name") VALUES (7, 'REJECT') ON CONFLICT (id) DO NOTHING;
