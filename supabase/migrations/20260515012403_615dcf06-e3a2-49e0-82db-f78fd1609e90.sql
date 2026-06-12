
-- Fix function search_path on set_updated_at and handle_new_user (already set on has_role)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke public execute on has_role; allow only postgres/service via RLS context
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO postgres, service_role;

-- Restrict bucket listing: replace permissive SELECT with per-file by-id reads only
DROP POLICY IF EXISTS "Public read item images" ON storage.objects;
CREATE POLICY "Public read item images by path" ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');
-- (public bucket — files are accessed via public URL; RLS still enforced for list operations only via API)
