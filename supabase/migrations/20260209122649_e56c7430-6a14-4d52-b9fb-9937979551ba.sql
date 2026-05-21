-- Fix: Admin RLS policy on profiles should scope to same organization
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view org profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Fix: Admin RLS policy on user_roles should scope to same organization  
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view org roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

-- Fix: Admin ALL policy on user_roles should also scope to org
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage org roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);