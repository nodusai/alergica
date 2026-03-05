INSERT INTO public.user_roles (user_id, role)
VALUES ('2f0ef488-c999-42eb-8eff-1a62582100a2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;