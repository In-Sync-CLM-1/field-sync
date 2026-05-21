-- Allow users to delete their own roles (needed during registration when replacing sales_officer with admin)
CREATE POLICY "Users can delete their own roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
