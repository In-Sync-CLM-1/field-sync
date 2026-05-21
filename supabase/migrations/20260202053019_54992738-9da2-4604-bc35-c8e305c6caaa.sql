-- Add INSERT policy for organizations table to allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure users have an INSERT policy for user_roles to assign themselves admin role
CREATE POLICY "Users can insert their own initial role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);