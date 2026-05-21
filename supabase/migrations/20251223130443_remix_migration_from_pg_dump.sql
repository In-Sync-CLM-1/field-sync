CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'field_agent',
    'manager',
    'super_admin',
    'sales_manager',
    'sales_agent',
    'support_manager',
    'support_agent',
    'analyst',
    'platform_admin'
);


--
-- Name: assign_platform_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_platform_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if email ends with @in-sync.co.in
  IF NEW.email LIKE '%@in-sync.co.in' THEN
    -- Assign platform_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'platform_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: get_user_organization_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_organization_id(user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT organization_id FROM public.profiles WHERE id = user_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Create profile with email from auth
  INSERT INTO public.profiles (
    id, 
    full_name, 
    first_name, 
    last_name,
    email,
    is_active
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    true
  );
  
  -- Assign default role (field_agent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'field_agent');
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    city text,
    state text,
    postal_code text,
    country text,
    territory text,
    status text DEFAULT 'active'::text NOT NULL,
    customer_type text,
    company_name text,
    industry text,
    notes text,
    tags text[],
    latitude numeric(10,8),
    longitude numeric(11,8),
    last_visit_date timestamp with time zone,
    assigned_user_id uuid,
    crm_customer_id text,
    last_synced_from_crm timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'prospect'::text])))
);


--
-- Name: dispositions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispositions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    code text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    schema jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text,
    logo_url text,
    primary_color text,
    settings jsonb DEFAULT '{}'::jsonb,
    usage_limits jsonb DEFAULT '{}'::jsonb,
    subscription_active boolean DEFAULT true,
    services_enabled jsonb DEFAULT '{}'::jsonb,
    max_automation_emails_per_day integer,
    apollo_config jsonb
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    crm_user_id text,
    crm_role text,
    last_synced_from_crm timestamp with time zone,
    organization_id uuid,
    reporting_manager_id uuid,
    email text,
    first_name text,
    last_name text,
    designation_id text,
    is_active boolean DEFAULT true NOT NULL,
    is_platform_admin boolean DEFAULT false NOT NULL,
    calling_enabled boolean DEFAULT false NOT NULL,
    email_enabled boolean DEFAULT false NOT NULL,
    whatsapp_enabled boolean DEFAULT false NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    onboarding_completed boolean DEFAULT false NOT NULL
);


--
-- Name: sub_dispositions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_dispositions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    disposition_id uuid NOT NULL,
    name text NOT NULL,
    code text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    last_accessed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    check_in_time timestamp with time zone DEFAULT now() NOT NULL,
    check_out_time timestamp with time zone,
    check_in_latitude numeric(10,8),
    check_in_longitude numeric(11,8),
    check_out_latitude numeric(10,8),
    check_out_longitude numeric(11,8),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: dispositions dispositions_organization_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositions
    ADD CONSTRAINT dispositions_organization_id_code_key UNIQUE (organization_id, code);


--
-- Name: dispositions dispositions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositions
    ADD CONSTRAINT dispositions_pkey PRIMARY KEY (id);


--
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_code_key UNIQUE (code);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sub_dispositions sub_dispositions_organization_id_disposition_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_dispositions
    ADD CONSTRAINT sub_dispositions_organization_id_disposition_id_code_key UNIQUE (organization_id, disposition_id, code);


--
-- Name: sub_dispositions sub_dispositions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_dispositions
    ADD CONSTRAINT sub_dispositions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_key UNIQUE (user_id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_customers_assigned_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_assigned_user ON public.customers USING btree (assigned_user_id);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_location ON public.customers USING btree (latitude, longitude);


--
-- Name: idx_customers_organization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_organization ON public.customers USING btree (organization_id);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_customers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_status ON public.customers USING btree (status);


--
-- Name: idx_customers_territory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_territory ON public.customers USING btree (territory);


--
-- Name: idx_organizations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);


--
-- Name: idx_organizations_subscription_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_subscription_active ON public.organizations USING btree (subscription_active);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);


--
-- Name: idx_visits_check_in_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_check_in_time ON public.visits USING btree (check_in_time);


--
-- Name: idx_visits_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_location ON public.visits USING btree (check_in_latitude, check_in_longitude);


--
-- Name: idx_visits_organization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_organization ON public.visits USING btree (organization_id);


--
-- Name: idx_visits_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_user ON public.visits USING btree (user_id);


--
-- Name: customers set_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: visits set_visits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dispositions update_dispositions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dispositions_updated_at BEFORE UPDATE ON public.dispositions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_templates update_form_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sub_dispositions update_sub_dispositions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sub_dispositions_updated_at BEFORE UPDATE ON public.sub_dispositions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers customers_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: customers customers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: dispositions dispositions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositions
    ADD CONSTRAINT dispositions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: form_templates form_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: profiles profiles_reporting_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_reporting_manager_id_fkey FOREIGN KEY (reporting_manager_id) REFERENCES public.profiles(id);


--
-- Name: sub_dispositions sub_dispositions_disposition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_dispositions
    ADD CONSTRAINT sub_dispositions_disposition_id_fkey FOREIGN KEY (disposition_id) REFERENCES public.dispositions(id) ON DELETE CASCADE;


--
-- Name: sub_dispositions sub_dispositions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_dispositions
    ADD CONSTRAINT sub_dispositions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: visits visits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: visits visits_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: visits visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: dispositions Admins can manage dispositions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage dispositions" ON public.dispositions USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: form_templates Admins can manage form_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage form_templates" ON public.form_templates USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: organizations Admins can manage organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage organizations" ON public.organizations USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sub_dispositions Admins can manage sub_dispositions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sub_dispositions" ON public.sub_dispositions USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: organizations Anyone can view active organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active organizations" ON public.organizations FOR SELECT USING ((is_active = true));


--
-- Name: profiles Platform admins can manage all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Platform admins can manage all profiles" ON public.profiles USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));


--
-- Name: user_roles Platform admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Platform admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));


--
-- Name: profiles Platform admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Platform admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));


--
-- Name: customers Users can create customers in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create customers in their organization" ON public.customers FOR INSERT WITH CHECK ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: visits Users can create their own visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own visits" ON public.visits FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: customers Users can delete customers in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete customers in their organization" ON public.customers FOR DELETE USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: user_sessions Users can delete their own session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own session" ON public.user_sessions FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: visits Users can delete their own visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own visits" ON public.visits FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: user_sessions Users can insert their own session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own session" ON public.user_sessions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: customers Users can update customers in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update customers in their organization" ON public.customers FOR UPDATE USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_sessions Users can update their own session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own session" ON public.user_sessions FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: visits Users can update their own visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own visits" ON public.visits FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: customers Users can view customers in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view customers in their organization" ON public.customers FOR SELECT USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: dispositions Users can view dispositions in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view dispositions in their organization" ON public.dispositions FOR SELECT USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: form_templates Users can view form_templates in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view form_templates in their organization" ON public.form_templates FOR SELECT USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: profiles Users can view profiles in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles in their organization" ON public.profiles FOR SELECT USING (((organization_id = public.get_user_organization_id(auth.uid())) OR (auth.uid() = id)));


--
-- Name: sub_dispositions Users can view sub_dispositions in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view sub_dispositions in their organization" ON public.sub_dispositions FOR SELECT USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: organizations Users can view their organization details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their organization details" ON public.organizations FOR SELECT USING (((auth.uid() IS NOT NULL) AND (id = public.get_user_organization_id(auth.uid()))));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_sessions Users can view their own session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own session" ON public.user_sessions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: visits Users can view visits in their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view visits in their organization" ON public.visits FOR SELECT USING ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: dispositions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dispositions ENABLE ROW LEVEL SECURITY;

--
-- Name: form_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sub_dispositions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sub_dispositions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;