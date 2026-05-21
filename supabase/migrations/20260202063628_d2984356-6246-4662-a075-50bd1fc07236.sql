-- Create branches table for physical office locations
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create policies for branch access
CREATE POLICY "Users can view branches in their organization" 
ON public.branches 
FOR SELECT 
USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can create branches" 
ON public.branches 
FOR INSERT 
WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'platform_admin')
  )
);

CREATE POLICY "Admins can update branches" 
ON public.branches 
FOR UPDATE 
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'platform_admin')
  )
);

CREATE POLICY "Admins can delete branches" 
ON public.branches 
FOR DELETE 
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'platform_admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_branches_organization ON public.branches(organization_id);
CREATE INDEX idx_branches_manager ON public.branches(manager_id);

-- Add branch_id to profiles table so users can be assigned to a branch
ALTER TABLE public.profiles ADD COLUMN branch_id UUID REFERENCES public.branches(id);