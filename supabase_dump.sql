--
-- PostgreSQL database dump
--

\restrict MlHkKEY72fCPtO9gGUP9THfdUhKdjH2LO7btN2LLp4QiKfU7MGYfbXUONEzQpwt

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

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    name text DEFAULT 'Default Key'::text NOT NULL,
    scopes text[] DEFAULT ARRAY['scan:create'::text, 'scan:read'::text],
    rate_limit_per_minute integer DEFAULT 60,
    rate_limit_per_day integer DEFAULT 1000,
    is_active boolean DEFAULT true,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: key_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_usage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_key_id uuid NOT NULL,
    endpoint text NOT NULL,
    method text DEFAULT 'POST'::text NOT NULL,
    status_code integer DEFAULT 200 NOT NULL,
    response_time_ms integer,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: license_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_code text NOT NULL,
    plan_id uuid NOT NULL,
    duration_days integer DEFAULT 30 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    generated_by uuid NOT NULL,
    claimed_by uuid,
    reseller_id uuid,
    batch_id text,
    claimed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT license_keys_status_check CHECK ((status = ANY (ARRAY['available'::text, 'claimed'::text, 'expired'::text, 'revoked'::text])))
);


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    key text NOT NULL,
    plan_id uuid NOT NULL,
    max_users integer DEFAULT 100,
    duration_months integer DEFAULT 12,
    status text DEFAULT 'active'::text,
    assigned_to uuid,
    expires_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT licenses_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text])))
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    price_monthly numeric(10,2) DEFAULT 0 NOT NULL,
    price_yearly numeric(10,2),
    scans_per_month integer DEFAULT 5 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reseller_price_monthly numeric(10,2),
    reseller_price_yearly numeric(10,2),
    reseller_discount_percent integer DEFAULT 20
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    institution text,
    role text DEFAULT 'user'::text,
    avatar_url text,
    two_factor_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    report_logo text,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'reseller'::text, 'admin'::text])))
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    reseller_id uuid NOT NULL,
    referred_user_id uuid NOT NULL,
    subscription_id uuid,
    revenue_generated numeric(10,2) DEFAULT 0,
    commission_earned numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    scan_id uuid NOT NULL,
    user_id uuid NOT NULL,
    overall_score numeric(5,2),
    human_score numeric(5,2),
    paragraph_analysis jsonb DEFAULT '[]'::jsonb,
    detection_models jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reseller_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    client_user_id uuid,
    client_email text NOT NULL,
    client_name text NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    retail_price numeric(10,2) NOT NULL,
    reseller_cost numeric(10,2) NOT NULL,
    profit numeric(10,2) NOT NULL,
    billing_cycle text DEFAULT 'monthly'::text,
    activated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    last_renewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reseller_clients_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT reseller_clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'pending'::text])))
);


--
-- Name: reseller_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_name text,
    credit_balance numeric(10,2) DEFAULT 0.00,
    total_purchased numeric(10,2) DEFAULT 0.00,
    total_spent numeric(10,2) DEFAULT 0.00,
    commission_earned numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reseller_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reseller_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    balance_after numeric(10,2) NOT NULL,
    description text,
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reseller_transactions_type_check CHECK ((type = ANY (ARRAY['credit_purchase'::text, 'client_activation'::text, 'client_renewal'::text, 'refund'::text, 'adjustment'::text])))
);


--
-- Name: resellers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resellers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_name text,
    referral_code text NOT NULL,
    commission_rate numeric(5,2) DEFAULT 30.00,
    total_clients integer DEFAULT 0,
    total_revenue numeric(12,2) DEFAULT 0,
    total_commission numeric(12,2) DEFAULT 0,
    pending_payout numeric(12,2) DEFAULT 0,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    credit_balance numeric(12,2) DEFAULT 0,
    CONSTRAINT resellers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text])))
);


--
-- Name: scan_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scan_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scan_id uuid NOT NULL,
    input_text text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    account_id uuid,
    result jsonb,
    error text,
    created_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    retry_count integer DEFAULT 0,
    CONSTRAINT scan_queue_status_check CHECK ((status = ANY (ARRAY['waiting'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: scans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scans (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    file_type text,
    ai_score numeric(5,2),
    word_count integer,
    paragraph_count integer,
    status text DEFAULT 'processing'::text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    file_path text,
    report_path text,
    zerogpt_result jsonb,
    CONSTRAINT scans_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    key text NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text,
    current_period_start timestamp with time zone DEFAULT now(),
    current_period_end timestamp with time zone,
    scans_used integer DEFAULT 0,
    stripe_subscription_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'trial'::text])))
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'open'::text,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])))
);


--
-- Name: zerogpt_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zerogpt_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text DEFAULT 'Account'::text NOT NULL,
    bearer_token text NOT NULL,
    is_active boolean DEFAULT true,
    max_concurrent integer DEFAULT 2,
    current_active integer DEFAULT 0,
    total_requests integer DEFAULT 0,
    failed_requests integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    max_retries integer DEFAULT 3
);


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (id, reseller_id, key_hash, key_prefix, name, scopes, rate_limit_per_minute, rate_limit_per_day, is_active, last_used_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: key_usage_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.key_usage_logs (id, api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: license_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_keys (id, key_code, plan_id, duration_days, status, generated_by, claimed_by, reseller_id, batch_id, claimed_at, expires_at, created_at, updated_at) FROM stdin;
670d46d5-8ad5-44a5-b15d-14722a48e175	SL-TEST1-CLAIM-WORKS-GREAT	e1eacc09-d366-4084-81e2-1dc2636c4dd0	30	claimed	b781fc4f-900e-49a2-a33a-c3d98d29cd80	83b6fa09-7111-4a00-a780-f8f6dd87ff95	\N	test-batch-001	2026-02-07 21:21:57.459+00	2026-03-09 21:21:57.459+00	2026-02-07 21:14:27.383796+00	2026-02-07 21:21:57.459+00
c075ef79-0d3f-459c-8107-95f2e21c2a7e	SL-TEST2-CLAIM-FIXED-TODAY	e1eacc09-d366-4084-81e2-1dc2636c4dd0	30	claimed	b781fc4f-900e-49a2-a33a-c3d98d29cd80	83b6fa09-7111-4a00-a780-f8f6dd87ff95	\N	test-batch-002	2026-02-07 21:30:25.149+00	2026-03-09 21:30:25.149+00	2026-02-07 21:28:38.607531+00	2026-02-07 21:30:25.149+00
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, key, plan_id, max_users, duration_months, status, assigned_to, expires_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plans (id, name, slug, price_monthly, price_yearly, scans_per_month, features, is_active, created_at, updated_at, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) FROM stdin;
077d1f39-0ec9-45f8-ab6a-d7083b298652	Free	free	0.00	0.00	1	{"PDF & DOCX support": true, "1 AI scan per month": true, "Standard report summary": true, "Basic plagiarism detection": true}	t	2026-02-03 06:06:32.758718+00	2026-02-07 12:39:35.49+00	0.00	0.00	20
e1eacc09-d366-4084-81e2-1dc2636c4dd0	Starter	starter	12.00	114.00	15	{"Email support": true, "15 AI scans per month": true, "Detailed originality reports": true, "Advanced plagiarism detection": true, "Multi-format support (PDF, DOCX, TXT)": true}	t	2026-02-07 12:23:39.117211+00	2026-02-07 12:39:51.216+00	8.40	79.80	30
85a02cbb-9d01-4e9b-857a-f8671081a0e3	Professional	professional	17.00	161.00	25	{"25 AI scans per month": true, "Deep content analysis": true, "Priority email support": true, "Export detailed PDF reports": true, "Sentence-level AI highlighting": true}	t	2026-02-07 12:25:22.841808+00	2026-02-07 12:43:01.28+00	11.90	112.70	30
d2b3e055-7aef-4cd2-9918-f83d6b7ef852	Institution	institution	59.00	559.00	100	{"100 AI scans per month": true, "Dedicated account manager": true, "Bulk upload & batch processing": true, "Full content integrity analysis": true}	t	2026-02-07 12:29:45.627881+00	2026-02-07 12:43:38.238+00	41.30	391.30	30
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, email, first_name, last_name, institution, role, avatar_url, two_factor_enabled, created_at, updated_at, report_logo) FROM stdin;
b781fc4f-900e-49a2-a33a-c3d98d29cd80	technicalanees@gmail.com	Admin	\N	\N	admin	\N	f	2026-02-07 11:59:04.790447+00	2026-02-07 11:59:04.790447+00	\N
b66a2507-8cb1-4f7d-b595-fc2a181cf260	testuser_scopelens_v3@gmail.com	\N	\N	\N	user	\N	f	2026-02-07 13:04:25.433677+00	2026-02-07 13:04:25.433677+00	\N
83b6fa09-7111-4a00-a780-f8f6dd87ff95	demo@scopelens.com	Demo Updated	Tester	ScopeLens University	user	\N	f	2026-02-07 13:26:46.298724+00	2026-02-07 13:58:30.113+00	\N
db0006ea-9f7c-4b23-aae9-6c99300ad0d4	test@scopelens.com	\N	\N	\N	reseller	\N	f	2026-02-07 20:45:47.711123+00	2026-02-07 20:45:47.711123+00	\N
d536fe7f-8910-4e45-a9c1-0f2ee6c7c544	test2@scopelens.com	\N	\N	\N	user	\N	f	2026-02-08 10:06:24.235481+00	2026-02-08 10:06:24.235481+00	\N
9faff593-cf6e-4733-abee-ae04d1ad806c	reseller@test.com	\N	\N	\N	reseller	\N	f	2026-02-08 11:36:01.172626+00	2026-02-08 11:36:01.172626+00	\N
da23142a-c35e-4994-a103-a97c3e7ee312	newreseller@test.com	\N	\N	\N	reseller	\N	f	2026-02-08 11:49:51.808305+00	2026-02-08 11:49:51.808305+00	\N
bc32cfcf-bf0d-4e59-9648-51507872eede	reseller2@test.com	\N	\N	\N	reseller	\N	f	2026-02-08 12:59:35.608186+00	2026-02-08 12:59:35.608186+00	\N
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (id, reseller_id, referred_user_id, subscription_id, revenue_generated, commission_earned, created_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, scan_id, user_id, overall_score, human_score, paragraph_analysis, detection_models, created_at) FROM stdin;
\.


--
-- Data for Name: reseller_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_clients (id, reseller_id, client_user_id, client_email, client_name, plan_id, status, retail_price, reseller_cost, profit, billing_cycle, activated_at, expires_at, last_renewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reseller_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_profiles (id, user_id, company_name, credit_balance, total_purchased, total_spent, commission_earned, is_active, created_at, updated_at) FROM stdin;
21b42ee3-3535-4d5c-88ed-bc4385f40bc2	db0006ea-9f7c-4b23-aae9-6c99300ad0d4	Test Reseller Co	50.00	100.00	50.00	10.00	t	2026-02-08 07:20:32.782057+00	2026-02-08 07:20:32.782057+00
\.


--
-- Data for Name: reseller_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_transactions (id, reseller_id, type, amount, balance_after, description, reference_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: resellers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resellers (id, user_id, company_name, referral_code, commission_rate, total_clients, total_revenue, total_commission, pending_payout, status, created_at, updated_at, credit_balance) FROM stdin;
78c1f971-fb4c-4aec-aa4c-81dcf7657916	db0006ea-9f7c-4b23-aae9-6c99300ad0d4	Test Reseller Co	TEST-RES-001	30.00	0	0.00	0.00	0.00	active	2026-02-08 08:03:05.23027+00	2026-02-08 08:03:05.23027+00	100.00
\.


--
-- Data for Name: scan_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scan_queue (id, scan_id, input_text, status, account_id, result, error, created_at, started_at, completed_at, retry_count) FROM stdin;
26e2f188-9e16-425f-8fc7-81f54156ebe1	4d88a16b-7219-4274-bdab-53190fc0449f	Earning money online is no longer a side hustle that consists of teenagers who are tech-savvy. Earning money online has become a viable career option of just about anyone as long as you have a laptop and a reasonable Wi-Fi connection. However, when you have spent five minutes looking on how to do it, you must have been bombarded by so-called gurus who promise you millions. We need not mince words and the get rich quick schemes. Earning money online and earning money offline are no different.	completed	f92e8049-c969-4c77-9076-961f2aae26b6	{"code": 200, "data": {"h": [], "hi": [], "id": 43979318, "aiWords": 0, "isHuman": 100, "feedback": "Your Text is Human Written", "sentences": [], "textWords": 87, "input_text": "Earning money online is no longer a side hustle that consists of teenagers who are tech-savvy. Earning money online has become a viable career option of just about anyone as long as you have a laptop and a reasonable Wi-Fi connection. However, when you have spent five minutes looking on how to do it, you must have been bombarded by so-called gurus who promise you millions. We need not mince words and the get rich quick schemes. Earning money online and earning money offline are no different.", "fakePercentage": 0, "specialIndexes": [], "specialSentences": [], "originalParagraph": "2026/2/7/9f18f2c8-b5ae-4aa9-a314-ac8626169ed4", "additional_feedback": ""}, "message": "Detection complete", "success": true}	\N	2026-02-07 15:57:33.318836+00	2026-02-07 15:57:48.124+00	2026-02-07 15:57:49.356+00	0
b91f76b6-1494-4eec-a594-f29ca77c0d8a	e35ebf2a-4b36-433d-8f36-6ba6b90c5150	This is a test scan content for AI detection. It should be long enough to be processed correctly by the system. Word count check: one two three four five six seven eight nine ten.	completed	f92e8049-c969-4c77-9076-961f2aae26b6	{"code": 200, "data": {"h": ["It should be long enough to be processed correctly by the system.", "Word count check: one two three four five six seven eight nine ten."], "hi": [], "id": 43979887, "aiWords": 25, "isHuman": 75, "feedback": "Your Text is Most Likely Human written, may include parts generated by AI/GPT", "sentences": [], "textWords": 34, "input_text": "This is a test scan content for AI detection. It should be long enough to be processed correctly by the system. Word count check: one two three four five six seven eight nine ten.", "fakePercentage": 35.24, "specialIndexes": [], "specialSentences": [], "originalParagraph": "2026/2/7/99a1990e-a60a-4da7-ab21-ad13e9e69189", "additional_feedback": "Please input more text for a more accurate result"}, "message": "Detection complete", "success": true}	\N	2026-02-07 16:18:13.220918+00	2026-02-07 16:18:55.544+00	2026-02-07 16:18:57.168+00	0
fc35ae26-a37c-465f-8a58-5a695307a52f	561e8a5b-50c0-4c1f-bbf8-7ae443083b6c	[File: The Digital Frontier_ A Comprehensive Guide to Making Money Online.docx]	completed	f92e8049-c969-4c77-9076-961f2aae26b6	{"code": 200, "data": {"h": [], "hi": [], "id": 43985496, "aiWords": 0, "isHuman": 100, "feedback": "Your Text is Human Written", "sentences": [], "textWords": 11, "input_text": "[File: The Digital Frontier_ A Comprehensive Guide to Making Money Online.docx]", "fakePercentage": 0, "specialIndexes": [], "specialSentences": [], "originalParagraph": "2026/2/7/7474106f-8b58-4b36-9be2-e27c54fd344b", "additional_feedback": "Please input more text for a more accurate result"}, "message": "Detection complete", "success": true}	Retry 1/3: Oh Oh, an error occurred, Please try again in 1 second	2026-02-07 19:35:55.741581+00	2026-02-07 19:37:24.905+00	2026-02-07 19:37:26.159+00	1
b3120602-12b7-40b2-800f-7ec71677a64a	46c54a87-71db-4cf0-b972-95433ab18e4a	The Digital Frontier: A Comprehensive Guide to Making Money Online\n\nI. Introduction: The New Economic Landscape\n\nThe internet has fundamentally reshaped the global economy, transitioning from a localized, brick-and-mortar system to a vast, interconnected digital frontier. This shift has unlocked unprecedented opportunities for individuals to earn income independent of traditional employment structures, geographical constraints, or set working hours. Making money online is no longer a niche pursuit but a mainstream aspiration, offering flexibility, scalability, and the potential for true financial independence. This comprehensive guide will explore the multifaceted world of online income generation, detailing viable strategies, necessary skills, common pitfalls, and the mindset required to thrive in the digital economy. While a 2000-word essay cannot cover every single permutation of online earning, it will provide a robust framework across key high-potential domains.\n\nII. The Foundation: Mindset and Digital Infrastructure\n\nBefore diving into specific monetization methods, it is crucial to establish the correct foundation. Online success is a marathon, not a sprint, and requires a professional, dedicated approach.\n\nA. The Entrepreneurial Mindset\n\nMaking money online demands an entrepreneurial spirit. This involves:\n\nPatience and Persistence: Initial income streams often take months to develop. Quitters rarely succeed.\n\nContinuous Learning: The digital landscape evolves rapidly. Successful online earners are perpetual students, adapting to new platforms, algorithms, and technologies.\n\nRisk Management: Every online venture involves some degree of risk, whether of time or capital. A successful strategy involves calculated risk and the ability to pivot quickly when a path proves non-viable.\n\nSelf-Discipline: Without a manager or a fixed schedule, self-motivation is paramount. Setting clear goals, tracking progress, and maintaining a strict work ethic are essential.\n\nB. Essential Digital Infrastructure\n\nA professional online operation requires reliable tools:\n\nHigh-Speed Internet and Reliable Hardware: The basic tools of the trade. Downtime is lost income.\n\nProfessional Online Presence: This includes a clean, dedicated workspace, a professional email address, and a central website or portfolio (even a simple one) to showcase work or products.\n\nFinancial Tracking Tools: Separate business and personal finances. Use accounting software to track income, expenses, and taxes from day one.\n\nIII. Monetizing Skills and Services: The Gig Economy and Freelancing\n\nOne of the quickest paths to online income is leveraging existing professional skills through freelancing platforms or direct client outreach.\n\nA. Freelancing Platforms\n\nPlatforms like Upwork, Fiverr, and Freelancer act as marketplaces connecting skilled professionals with clients globally. High-demand skills include:\n\nWriting and Editing: Content writing, copywriting, technical writing, and proofreading.\n\nGraphic Design: Branding, logo creation, social media graphics, and web design elements.\n\nWeb Development and Programming: Building and maintaining websites, custom software, and mobile applications. This is consistently a high-earning category.\n\nDigital Marketing: SEO (Search Engine Optimization), social media management, paid advertising (PPC), and email marketing.\n\nStrategy for Freelancing Success:\n\nNiche Down: Instead of offering &quot;writing,&quot; offer &quot;SEO-optimized blog content for FinTech startups.&quot; Specialization allows for higher rates.\n\nBuild an Impressive Portfolio: Use a file placeholder for samples of work in a dedicated, professional Fileportfolio document.\n\nMaster Proposal Writing: Clients pay for solutions, not just skills. Proposals must clearly articulate how your service solves their specific problem.\n\nB. Virtual Assistance (VA) and Administrative Services\n\nMany businesses need help with administrative, technical, or creative tasks but do not require a full-time employee. Virtual Assistants step in to fill this gap.\n\nTasks: Scheduling meetings, managing inboxes, data entry, social media scheduling, basic bookkeeping.\n\nEarning Potential: Starts moderately but increases significantly with specialized skills (e.g., expertise in a specific CRM or project management software).\n\nIV. The Creator Economy: Content, Audience, and Influence\n\nThe Creator Economy centers on building an audience around a specific topic and monetizing that attention through various streams.\n\nA. Blogging and Affiliate Marketing\n\nThe Model: Create high-quality, valuable content (text, video, or audio) that attracts a specific audience. Once traffic is established, income can be generated through:\n\nAffiliate Marketing: Promoting other companies' products and earning a commission on sales made through unique tracking links. Success depends on building trust and recommending genuinely useful items.\n\nDisplay Advertising: Placing ads on the website (e.g., through Google AdSense or premium ad networks).\n\nB. YouTube and Podcasting\n\nVideo and audio content are highly engaging. Monetization typically follows a few routes:\n\nAd Revenue: Earning a share of the ad revenue generated on the platform (requires meeting minimum audience thresholds).\n\nSponsorships: Direct deals with brands to integrate their product or message into the content.\n\nSelling Own Products: Using the audience to drive traffic to digital or physical products (e.g., courses, merchandise).\n\nC. Selling Digital Products (The Scalable Model)\n\nThe highest potential for passive income online often lies in creating and selling digital products. Since the product is created once and sold infinitely, the business model is highly scalable.\n\nE-books and Templates: Low-barrier entry products like detailed guides, spreadsheet templates (e.g., budget trackers), or presentation templates.\n\nOnline Courses: Offering in-depth, structured education on a specific skill (e.g., mastering Excel, learning a foreign language, advanced photography). Platforms like Teachable and Udemy facilitate distribution.\n\nStock Assets: Selling photos, videos, or graphic design elements through stock marketplaces.\n\nV. E-commerce and Direct Sales\n\nSelling physical products online remains a robust method for generating income, with modern logistics making entry easier than ever.\n\nA. Dropshipping\n\nThe Model: A highly popular e-commerce method where the seller (you) never holds inventory. When a customer places an order on your online store, you purchase the item from a third-party supplier (often overseas), and they ship it directly to the customer.\n\nThe Challenge: Requires intense focus on marketing, sourcing reliable suppliers, and managing customer service. Success is heavily reliant on finding the right product niche.\n\nB. Private Labeling/Fulfillment by Amazon (FBA)\n\nThe Model: Creating your own branded product, having it manufactured (often in bulk), and then using a third-party logistics provider (like Amazon's FBA service) to handle storage, packing, and shipping.\n\nThe Advantage: Provides greater control over branding, product quality, and profit margins compared to dropshipping.\n\nThe Barrier: Requires significant upfront capital for inventory and marketing.\n\nA table summarizing core e-commerce models:\n\nModel\n\nInventory Risk\n\nUpfront Capital\n\nScalability\n\nControl over Branding\n\nDropshipping\n\nLow\n\nLow\n\nHigh\n\nLow\n\nFBA/Private Label\n\nHigh\n\nHigh\n\nVery High\n\nHigh\n\nDigital Products\n\nZero\n\nLow\n\nExtreme\n\nComplete\n\nVI. Advanced and Passive Income Streams\n\nAs experience and capital grow, more sophisticated and truly &quot;passive&quot; (though never completely hands-off) income streams become accessible.\n\nA. Investment and Trading\n\nWhile risky, using online platforms to trade stocks, commodities, or cryptocurrencies is a direct way to make money online. This requires substantial education and should not be confused with gambling. Tools and educational resources are abundant, but disciplined risk management is essential.\n\nB. Creating a SaaS Product\n\nSaaS (Software as a Service) refers to subscription-based software applications (e.g., project management tools, email marketing systems).\n\nThe Model: Build a useful online tool that solves a business or consumer problem and charge a recurring monthly or annual fee.\n\nThe Challenge: High initial development cost and complexity. Requires technical skills (coding) or a significant budget to hire developers.\n\nC. Domain Flipping and Website Acquisition\n\nDomain Flipping: Buying desirable domain names for a low price and selling them for a profit. Requires foresight into business trends and market demand.\n\nWebsite Flipping: Buying an established, monetized website (e.g., a profitable blog or small e-commerce store), optimizing it to increase its revenue (often through SEO or better monetization), and then selling it for a multiple of its annual profit. This requires significant analytical and marketing skill.\n\nVII. Overcoming Challenges and Maintaining Security\n\nThe digital frontier is not without its perils.\n\nA. Legal and Tax Obligations\n\nIncome earned online is taxable. Establishing a clear legal structure (sole proprietorship, LLC, etc.) and diligently tracking income and expenses is non-negotiable. Consulting with a professional accountant on Datetax filing deadlines is crucial.\n\nB. Avoiding Scams\n\nThe promise of easy money online attracts numerous scams. Always adhere to these rules:\n\nIf it sounds too good to be true, it is. Guaranteed high returns for minimal effort are red flags.\n\nNever pay money to start a job. Legitimate employers or clients pay you; you do not pay them.\n\nDo not share sensitive personal financial information with unverified entities.\n\nC. Security and Data Privacy\n\nProtecting your digital assets is paramount.\n\nUse strong, unique passwords and two-factor authentication (2FA) for all platforms.\n\nSecure client data and adhere to data privacy laws relevant to your customers' geographical location (e.g., GDPR).\n\nVIII. The Next Steps: Actionable Advice\n\nTo begin the journey, an individual must first decide on a path.\n\nAssess Skills: List current professional skills and interests. Where do they intersect with market demand?\n\nChoose a Path: Select one area from the models above (e.g., content writing, dropshipping, starting a blog) and focus exclusively on it for at least six months. Multitasking is the enemy of momentum.\n\nStart Small: Do not invest heavily in tools or inventory until the basic income generation model is proven.\n\nSet a Calendar Event: Schedule time to review and update your plan every Calendar eventthree months.\n\nFind a Community: Engage with others who are pursuing similar online goals, either in online forums or local meetups at a co-working space in Place.\n\nIX. Conclusion\n\nMaking money online is the modern evolution of entrepreneurship. It demands diligence, adaptability, and a long-term vision. By choosing a viable model, establishing a professional infrastructure, and committing to continuous self-improvement, the vast and profitable digital frontier is accessible to anyone willing to put in the focused work. The opportunities are limitless, constrained only by one's imagination and persistence.	completed	f92e8049-c969-4c77-9076-961f2aae26b6	{"code": 200, "data": {"h": ["The Digital Frontier: A Comprehensive Guide to Making Money Online", "I. Introduction: The New Economic Landscape", "The internet has fundamentally reshaped the global economy, transitioning from a localized, brick-and-mortar system to a vast, interconnected digital frontier.", "This shift has unlocked unprecedented opportunities for individuals to earn income independent of traditional employment structures, geographical constraints, or set working hours.", "Making money online is no longer a niche pursuit but a mainstream aspiration, offering flexibility, scalability, and the potential for true financial independence.", "This comprehensive guide will explore the multifaceted world of online income generation, detailing viable strategies, necessary skills, common pitfalls, and the mindset required to thrive in the digital economy.", "While a 2000-word essay cannot cover every single permutation of online earning, it will provide a robust framework across key high-potential domains.", "The Foundation: Mindset and Digital Infrastructure", "Before diving into specific monetization methods, it is crucial to establish the correct foundation.", "Online success is a marathon, not a sprint, and requires a professional, dedicated approach.", "A. The Entrepreneurial Mindset", "Making money online demands an entrepreneurial spirit.", "Patience and Persistence: Initial income streams often take months to develop.", "Quitters rarely succeed.", "Continuous Learning: The digital landscape evolves rapidly.", "Successful online earners are perpetual students, adapting to new platforms, algorithms, and technologies.", "Risk Management: Every online venture involves some degree of risk, whether of time or capital.", "A successful strategy involves calculated risk and the ability to pivot quickly when a path proves non-viable.", "Self-Discipline: Without a manager or a fixed schedule, self-motivation is paramount.", "Setting clear goals, tracking progress, and maintaining a strict work ethic are essential.", "B. Essential Digital Infrastructure", "High-Speed Internet and Reliable Hardware: The basic tools of the trade.", "Downtime is lost income.", "Professional Online Presence: This includes a clean, dedicated workspace, a professional email address, and a central website or portfolio (even a simple one) to showcase work or products.", "Financial Tracking Tools: Separate business and personal finances.", "Use accounting software to track income, expenses, and taxes from day one.", "Monetizing Skills and Services: The Gig Economy and Freelancing", "One of the quickest paths to online income is leveraging existing professional skills through freelancing platforms or direct client outreach.", "A. Freelancing Platforms", "Platforms like Upwork, Fiverr, and Freelancer act as marketplaces connecting skilled professionals with clients globally.", "High-demand skills include:", "Writing and Editing: Content writing, copywriting, technical writing, and proofreading.", "Graphic Design: Branding, logo creation, social media graphics, and web design elements.", "Web Development and Programming: Building and maintaining websites, custom software, and mobile applications.", "This is consistently a high-earning category.", "Digital Marketing: SEO (Search Engine Optimization), social media management, paid advertising (PPC), and email marketing.", "Strategy for Freelancing Success:", "Niche Down: Instead of offering &quot;writing,&quot; offer &quot;SEO-optimized blog content for FinTech startups.&quot; Specialization allows for higher rates.", "Build an Impressive Portfolio: Use a file placeholder for samples of work in a dedicated, professional Fileportfolio document.", "Master Proposal Writing: Clients pay for solutions, not just skills.", "Proposals must clearly articulate how your service solves their specific problem.", "B. Virtual Assistance (VA) and Administrative Services", "Many businesses need help with administrative, technical, or creative tasks but do not require a full-time employee.", "Virtual Assistants step in to fill this gap.", "Tasks: Scheduling meetings, managing inboxes, data entry, social media scheduling, basic bookkeeping.", "Earning Potential: Starts moderately but increases significantly with specialized skills (e.g., expertise in a specific CRM or project management software).", "The Creator Economy: Content, Audience, and Influence", "The Creator Economy centers on building an audience around a specific topic and monetizing that attention through various streams.", "A. Blogging and Affiliate Marketing", "he Model: Create high-quality, valuable content (text, video, or audio) that attracts a specific audience.", "Once traffic is established, income can be generated through:", "Affiliate Marketing: Promoting other companies' products and earning a commission on sales made through unique tracking links.", "Success depends on building trust and recommending genuinely useful items.", "Display Advertising: Placing ads on the website (e.g., through Google AdSense or premium ad networks).", "B. YouTube and Podcasting", "Monetization typically follows a few routes:", "Ad Revenue: Earning a share of the ad revenue generated on the platform (requires meeting minimum audience thresholds).", "Sponsorships: Direct deals with brands to integrate their product or message into the content.", "Selling Own Products: Using the audience to drive traffic to digital or physical products (e.g., courses, merchandise).", "C. Selling Digital Products (The Scalable Model)", "The highest potential for passive income online often lies in creating and selling digital products.", "Since the product is created once and sold infinitely, the business model is highly scalable.", "E-books and Templates: Low-barrier entry products like detailed guides, spreadsheet templates (e.g., budget trackers), or presentation templates.", "Online Courses: Offering in-depth, structured education on a specific skill (e.g., mastering Excel, learning a foreign language, advanced photography).", "Platforms like Teachable and Udemy facilitate distribution.", "Stock Assets: Selling photos, videos, or graphic design elements through stock marketplaces.", "V. E-commerce and Direct Sales", "Selling physical products online remains a robust method for generating income, with modern logistics making entry easier than ever.", "A. Dropshipping", "The Model: A highly popular e-commerce method where the seller (you) never holds inventory.", "When a customer places an order on your online store, you purchase the item from a third-party supplier (often overseas), and they ship it directly to the customer.", "The Challenge: Requires intense focus on marketing, sourcing reliable suppliers, and managing customer service.", "Success is heavily reliant on finding the right product niche.", "B. Private Labeling/Fulfillment by Amazon (FBA)", "The Model: Creating your own branded product, having it manufactured (often in bulk), and then using a third-party logistics provider (like Amazon's FBA service) to handle storage, packing, and shipping.", "The Advantage: Provides greater control over branding, product quality, and profit margins compared to dropshipping.", "The Barrier: Requires significant upfront capital for inventory and marketing.", "Advanced and Passive Income Streams", "As experience and capital grow, more sophisticated and truly &quot;passive&quot; (though never completely hands-off) income streams become accessible.", "A. Investment and Trading", "hile risky, using online platforms to trade stocks, commodities, or cryptocurrencies is a direct way to make money online.", "This requires substantial education and should not be confused with gambling.", "Tools and educational resources are abundant, but disciplined risk management is essential.", "B. Creating a SaaS Product", "SaaS (Software as a Service) refers to subscription-based software applications (e.g., project management tools, email marketing systems).", "The Model: Build a useful online tool that solves a business or consumer problem and charge a recurring monthly or annual fee.", "The Challenge: High initial development cost and complexity.", "Requires technical skills (coding) or a significant budget to hire developers.", "Domain Flipping: Buying desirable domain names for a low price and selling them for a profit.", "Requires foresight into business trends and market demand.", "Website Flipping: Buying an established, monetized website (e.g., a profitable blog or small e-commerce store), optimizing it to increase its revenue (often through SEO or better monetization), and then selling it for a multiple of its annual profit.", "This requires significant analytical and marketing skill.", "Overcoming Challenges and Maintaining Security", "The digital frontier is not without its perils.", "A. Legal and Tax Obligations", "Income earned online is taxable.", "Establishing a clear legal structure (sole proprietorship, LLC, etc.) and diligently tracking income and expenses is non-negotiable.", "Consulting with a professional accountant on Datetax filing deadlines is crucial.", "B. Avoiding Scams", "The promise of easy money online attracts numerous scams.", "Always adhere to these rules:", "If it sounds too good to be true, it is.", "Guaranteed high returns for minimal effort are red flags.", "Do not share sensitive personal financial information with unverified entities.", "C. Security and Data Privacy", "Protecting your digital assets is paramount.", "Use strong, unique passwords and two-factor authentication (2FA) for all platforms.", "Secure client data and adhere to data privacy laws relevant to your customers' geographical location (e.g., GDPR).", "The Next Steps: Actionable Advice", "To begin the journey, an individual must first decide on a path.", "Assess Skills: List current professional skills and interests.", "Where do they intersect with market demand?", "Choose a Path: Select one area from the models above (e.g., content writing, dropshipping, starting a blog) and focus exclusively on it for at least six months.", "Multitasking is the enemy of momentum.", "Start Small: Do not invest heavily in tools or inventory until the basic income generation model is proven.", "Set a Calendar Event: Schedule time to review and update your plan every Calendar eventthree months.", "Find a Community: Engage with others who are pursuing similar online goals, either in online forums or local meetups at a co-working space in Place.", "Making money online is the modern evolution of entrepreneurship.", "It demands diligence, adaptability, and a long-term vision.", "By choosing a viable model, establishing a professional infrastructure, and committing to continuous self-improvement, the vast and profitable digital frontier is accessible to anyone willing to put in the focused work.", "The opportunities are limitless, constrained only by one's imagination and persistence."], "hi": [], "id": 43985934, "aiWords": 1486, "isHuman": 0, "feedback": "Your Text is AI/GPT Generated", "sentences": [], "textWords": 1545, "input_text": "The Digital Frontier: A Comprehensive Guide to Making Money Online\\n\\nI. Introduction: The New Economic Landscape\\n\\nThe internet has fundamentally reshaped the global economy, transitioning from a localized, brick-and-mortar system to a vast, interconnected digital frontier. This shift has unlocked unprecedented opportunities for individuals to earn income independent of traditional employment structures, geographical constraints, or set working hours. Making money online is no longer a niche pursuit but a mainstream aspiration, offering flexibility, scalability, and the potential for true financial independence. This comprehensive guide will explore the multifaceted world of online income generation, detailing viable strategies, necessary skills, common pitfalls, and the mindset required to thrive in the digital economy. While a 2000-word essay cannot cover every single permutation of online earning, it will provide a robust framework across key high-potential domains.\\n\\nII. The Foundation: Mindset and Digital Infrastructure\\n\\nBefore diving into specific monetization methods, it is crucial to establish the correct foundation. Online success is a marathon, not a sprint, and requires a professional, dedicated approach.\\n\\nA. The Entrepreneurial Mindset\\n\\nMaking money online demands an entrepreneurial spirit. This involves:\\n\\nPatience and Persistence: Initial income streams often take months to develop. Quitters rarely succeed.\\n\\nContinuous Learning: The digital landscape evolves rapidly. Successful online earners are perpetual students, adapting to new platforms, algorithms, and technologies.\\n\\nRisk Management: Every online venture involves some degree of risk, whether of time or capital. A successful strategy involves calculated risk and the ability to pivot quickly when a path proves non-viable.\\n\\nSelf-Discipline: Without a manager or a fixed schedule, self-motivation is paramount. Setting clear goals, tracking progress, and maintaining a strict work ethic are essential.\\n\\nB. Essential Digital Infrastructure\\n\\nA professional online operation requires reliable tools:\\n\\nHigh-Speed Internet and Reliable Hardware: The basic tools of the trade. Downtime is lost income.\\n\\nProfessional Online Presence: This includes a clean, dedicated workspace, a professional email address, and a central website or portfolio (even a simple one) to showcase work or products.\\n\\nFinancial Tracking Tools: Separate business and personal finances. Use accounting software to track income, expenses, and taxes from day one.\\n\\nIII. Monetizing Skills and Services: The Gig Economy and Freelancing\\n\\nOne of the quickest paths to online income is leveraging existing professional skills through freelancing platforms or direct client outreach.\\n\\nA. Freelancing Platforms\\n\\nPlatforms like Upwork, Fiverr, and Freelancer act as marketplaces connecting skilled professionals with clients globally. High-demand skills include:\\n\\nWriting and Editing: Content writing, copywriting, technical writing, and proofreading.\\n\\nGraphic Design: Branding, logo creation, social media graphics, and web design elements.\\n\\nWeb Development and Programming: Building and maintaining websites, custom software, and mobile applications. This is consistently a high-earning category.\\n\\nDigital Marketing: SEO (Search Engine Optimization), social media management, paid advertising (PPC), and email marketing.\\n\\nStrategy for Freelancing Success:\\n\\nNiche Down: Instead of offering &quot;writing,&quot; offer &quot;SEO-optimized blog content for FinTech startups.&quot; Specialization allows for higher rates.\\n\\nBuild an Impressive Portfolio: Use a file placeholder for samples of work in a dedicated, professional Fileportfolio document.\\n\\nMaster Proposal Writing: Clients pay for solutions, not just skills. Proposals must clearly articulate how your service solves their specific problem.\\n\\nB. Virtual Assistance (VA) and Administrative Services\\n\\nMany businesses need help with administrative, technical, or creative tasks but do not require a full-time employee. Virtual Assistants step in to fill this gap.\\n\\nTasks: Scheduling meetings, managing inboxes, data entry, social media scheduling, basic bookkeeping.\\n\\nEarning Potential: Starts moderately but increases significantly with specialized skills (e.g., expertise in a specific CRM or project management software).\\n\\nIV. The Creator Economy: Content, Audience, and Influence\\n\\nThe Creator Economy centers on building an audience around a specific topic and monetizing that attention through various streams.\\n\\nA. Blogging and Affiliate Marketing\\n\\nThe Model: Create high-quality, valuable content (text, video, or audio) that attracts a specific audience. Once traffic is established, income can be generated through:\\n\\nAffiliate Marketing: Promoting other companies' products and earning a commission on sales made through unique tracking links. Success depends on building trust and recommending genuinely useful items.\\n\\nDisplay Advertising: Placing ads on the website (e.g., through Google AdSense or premium ad networks).\\n\\nB. YouTube and Podcasting\\n\\nVideo and audio content are highly engaging. Monetization typically follows a few routes:\\n\\nAd Revenue: Earning a share of the ad revenue generated on the platform (requires meeting minimum audience thresholds).\\n\\nSponsorships: Direct deals with brands to integrate their product or message into the content.\\n\\nSelling Own Products: Using the audience to drive traffic to digital or physical products (e.g., courses, merchandise).\\n\\nC. Selling Digital Products (The Scalable Model)\\n\\nThe highest potential for passive income online often lies in creating and selling digital products. Since the product is created once and sold infinitely, the business model is highly scalable.\\n\\nE-books and Templates: Low-barrier entry products like detailed guides, spreadsheet templates (e.g., budget trackers), or presentation templates.\\n\\nOnline Courses: Offering in-depth, structured education on a specific skill (e.g., mastering Excel, learning a foreign language, advanced photography). Platforms like Teachable and Udemy facilitate distribution.\\n\\nStock Assets: Selling photos, videos, or graphic design elements through stock marketplaces.\\n\\nV. E-commerce and Direct Sales\\n\\nSelling physical products online remains a robust method for generating income, with modern logistics making entry easier than ever.\\n\\nA. Dropshipping\\n\\nThe Model: A highly popular e-commerce method where the seller (you) never holds inventory. When a customer places an order on your online store, you purchase the item from a third-party supplier (often overseas), and they ship it directly to the customer.\\n\\nThe Challenge: Requires intense focus on marketing, sourcing reliable suppliers, and managing customer service. Success is heavily reliant on finding the right product niche.\\n\\nB. Private Labeling/Fulfillment by Amazon (FBA)\\n\\nThe Model: Creating your own branded product, having it manufactured (often in bulk), and then using a third-party logistics provider (like Amazon's FBA service) to handle storage, packing, and shipping.\\n\\nThe Advantage: Provides greater control over branding, product quality, and profit margins compared to dropshipping.\\n\\nThe Barrier: Requires significant upfront capital for inventory and marketing.\\n\\nA table summarizing core e-commerce models:\\n\\nModel\\n\\nInventory Risk\\n\\nUpfront Capital\\n\\nScalability\\n\\nControl over Branding\\n\\nDropshipping\\n\\nLow\\n\\nLow\\n\\nHigh\\n\\nLow\\n\\nFBA/Private Label\\n\\nHigh\\n\\nHigh\\n\\nVery High\\n\\nHigh\\n\\nDigital Products\\n\\nZero\\n\\nLow\\n\\nExtreme\\n\\nComplete\\n\\nVI. Advanced and Passive Income Streams\\n\\nAs experience and capital grow, more sophisticated and truly &quot;passive&quot; (though never completely hands-off) income streams become accessible.\\n\\nA. Investment and Trading\\n\\nWhile risky, using online platforms to trade stocks, commodities, or cryptocurrencies is a direct way to make money online. This requires substantial education and should not be confused with gambling. Tools and educational resources are abundant, but disciplined risk management is essential.\\n\\nB. Creating a SaaS Product\\n\\nSaaS (Software as a Service) refers to subscription-based software applications (e.g., project management tools, email marketing systems).\\n\\nThe Model: Build a useful online tool that solves a business or consumer problem and charge a recurring monthly or annual fee.\\n\\nThe Challenge: High initial development cost and complexity. Requires technical skills (coding) or a significant budget to hire developers.\\n\\nC. Domain Flipping and Website Acquisition\\n\\nDomain Flipping: Buying desirable domain names for a low price and selling them for a profit. Requires foresight into business trends and market demand.\\n\\nWebsite Flipping: Buying an established, monetized website (e.g., a profitable blog or small e-commerce store), optimizing it to increase its revenue (often through SEO or better monetization), and then selling it for a multiple of its annual profit. This requires significant analytical and marketing skill.\\n\\nVII. Overcoming Challenges and Maintaining Security\\n\\nThe digital frontier is not without its perils.\\n\\nA. Legal and Tax Obligations\\n\\nIncome earned online is taxable. Establishing a clear legal structure (sole proprietorship, LLC, etc.) and diligently tracking income and expenses is non-negotiable. Consulting with a professional accountant on Datetax filing deadlines is crucial.\\n\\nB. Avoiding Scams\\n\\nThe promise of easy money online attracts numerous scams. Always adhere to these rules:\\n\\nIf it sounds too good to be true, it is. Guaranteed high returns for minimal effort are red flags.\\n\\nNever pay money to start a job. Legitimate employers or clients pay you; you do not pay them.\\n\\nDo not share sensitive personal financial information with unverified entities.\\n\\nC. Security and Data Privacy\\n\\nProtecting your digital assets is paramount.\\n\\nUse strong, unique passwords and two-factor authentication (2FA) for all platforms.\\n\\nSecure client data and adhere to data privacy laws relevant to your customers' geographical location (e.g., GDPR).\\n\\nVIII. The Next Steps: Actionable Advice\\n\\nTo begin the journey, an individual must first decide on a path.\\n\\nAssess Skills: List current professional skills and interests. Where do they intersect with market demand?\\n\\nChoose a Path: Select one area from the models above (e.g., content writing, dropshipping, starting a blog) and focus exclusively on it for at least six months. Multitasking is the enemy of momentum.\\n\\nStart Small: Do not invest heavily in tools or inventory until the basic income generation model is proven.\\n\\nSet a Calendar Event: Schedule time to review and update your plan every Calendar eventthree months.\\n\\nFind a Community: Engage with others who are pursuing similar online goals, either in online forums or local meetups at a co-working space in Place.\\n\\nIX. Conclusion\\n\\nMaking money online is the modern evolution of entrepreneurship. It demands diligence, adaptability, and a long-term vision. By choosing a viable model, establishing a professional infrastructure, and committing to continuous self-improvement, the vast and profitable digital frontier is accessible to anyone willing to put in the focused work. The opportunities are limitless, constrained only by one's imagination and persistence.", "fakePercentage": 95.51, "specialIndexes": [7, 50, 29, 266, 265, 264, 263, 262, 260, 258, 257, 255, 254, 253, 252, 251, 249, 246, 445, 691, 690, 680], "specialSentences": ["II.", "IV.", "III.", "VI.", "Complete", "Extreme", "Low", "Zero", "High", "High", "High", "Low", "High", "Low", "Low", "Dropshipping", "Scalability", "Model", "VII.", "Conclusion", "IX.", "VIII."], "originalParagraph": "2026/2/7/d468d37d-212d-4412-bdfa-b5c2499a9414", "additional_feedback": ""}, "message": "Detection complete", "success": true}	\N	2026-02-07 19:52:24.438078+00	2026-02-07 19:52:33.045+00	2026-02-07 19:52:37.343+00	0
\.


--
-- Data for Name: scans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scans (id, user_id, file_name, file_size, file_type, ai_score, word_count, paragraph_count, status, created_at, completed_at, file_path, report_path, zerogpt_result) FROM stdin;
4d88a16b-7219-4274-bdab-53190fc0449f	b781fc4f-900e-49a2-a33a-c3d98d29cd80	test-article.txt	1234	text/plain	0.00	87	\N	completed	2026-02-07 15:57:33.024655+00	2026-02-07 15:57:49.598+00	\N	\N	{"h": [], "hi": [], "id": 43979318, "aiWords": 0, "isHuman": 100, "feedback": "Your Text is Human Written", "sentences": [], "textWords": 87, "input_text": "Earning money online is no longer a side hustle that consists of teenagers who are tech-savvy. Earning money online has become a viable career option of just about anyone as long as you have a laptop and a reasonable Wi-Fi connection. However, when you have spent five minutes looking on how to do it, you must have been bombarded by so-called gurus who promise you millions. We need not mince words and the get rich quick schemes. Earning money online and earning money offline are no different.", "fakePercentage": 0, "specialIndexes": [], "specialSentences": [], "originalParagraph": "2026/2/7/9f18f2c8-b5ae-4aa9-a314-ac8626169ed4", "additional_feedback": ""}
e35ebf2a-4b36-433d-8f36-6ba6b90c5150	83b6fa09-7111-4a00-a780-f8f6dd87ff95	test-scan.txt	179	text/plain	35.00	34	\N	completed	2026-02-07 16:18:12.959065+00	2026-02-07 16:18:57.482+00	83b6fa09-7111-4a00-a780-f8f6dd87ff95/1770481091722_test-scan.txt	\N	{"h": ["It should be long enough to be processed correctly by the system.", "Word count check: one two three four five six seven eight nine ten."], "hi": [], "id": 43979887, "aiWords": 25, "isHuman": 75, "feedback": "Your Text is Most Likely Human written, may include parts generated by AI/GPT", "sentences": [], "textWords": 34, "input_text": "This is a test scan content for AI detection. It should be long enough to be processed correctly by the system. Word count check: one two three four five six seven eight nine ten.", "fakePercentage": 35.24, "specialIndexes": [], "specialSentences": [], "originalParagraph": "2026/2/7/99a1990e-a60a-4da7-ab21-ad13e9e69189", "additional_feedback": "Please input more text for a more accurate result"}
561e8a5b-50c0-4c1f-bbf8-7ae443083b6c	83b6fa09-7111-4a00-a780-f8f6dd87ff95	The Digital Frontier_ A Comprehensive Guide to Making Money Online.docx	1713956	application/vnd.openxmlformats-officedocument.wordprocessingml.document	0.00	11	\N	completed	2026-02-07 19:35:55.490264+00	2026-02-07 19:37:26.392+00	83b6fa09-7111-4a00-a780-f8f6dd87ff95/1770492953167_The_Digital_Frontier__A_Comprehensive_Guide_to_Making_Money_Online.docx	\N	{"h": [], "hi": [], "id": 43985496, "aiWords": 0, "isHuman": 100, "feedback": "Your Text is Human Written", "sentences": [], "textWords": 11, "input_text": "[File: The Digital Frontier_ A Comprehensive Guide to Making Money Online.docx]", "fakePercentage": 0, "specialIndexes": [], "specialSentences": [], "originalParagraph": "2026/2/7/7474106f-8b58-4b36-9be2-e27c54fd344b", "additional_feedback": "Please input more text for a more accurate result"}
46c54a87-71db-4cf0-b972-95433ab18e4a	83b6fa09-7111-4a00-a780-f8f6dd87ff95	The Digital Frontier_ A Comprehensive Guide to Making Money Online.docx	1713956	application/vnd.openxmlformats-officedocument.wordprocessingml.document	96.00	1545	\N	completed	2026-02-07 19:52:24.124275+00	2026-02-07 19:52:37.648+00	83b6fa09-7111-4a00-a780-f8f6dd87ff95/1770493941543_The_Digital_Frontier__A_Comprehensive_Guide_to_Making_Money_Online.docx	\N	{"h": ["The Digital Frontier: A Comprehensive Guide to Making Money Online", "I. Introduction: The New Economic Landscape", "The internet has fundamentally reshaped the global economy, transitioning from a localized, brick-and-mortar system to a vast, interconnected digital frontier.", "This shift has unlocked unprecedented opportunities for individuals to earn income independent of traditional employment structures, geographical constraints, or set working hours.", "Making money online is no longer a niche pursuit but a mainstream aspiration, offering flexibility, scalability, and the potential for true financial independence.", "This comprehensive guide will explore the multifaceted world of online income generation, detailing viable strategies, necessary skills, common pitfalls, and the mindset required to thrive in the digital economy.", "While a 2000-word essay cannot cover every single permutation of online earning, it will provide a robust framework across key high-potential domains.", "The Foundation: Mindset and Digital Infrastructure", "Before diving into specific monetization methods, it is crucial to establish the correct foundation.", "Online success is a marathon, not a sprint, and requires a professional, dedicated approach.", "A. The Entrepreneurial Mindset", "Making money online demands an entrepreneurial spirit.", "Patience and Persistence: Initial income streams often take months to develop.", "Quitters rarely succeed.", "Continuous Learning: The digital landscape evolves rapidly.", "Successful online earners are perpetual students, adapting to new platforms, algorithms, and technologies.", "Risk Management: Every online venture involves some degree of risk, whether of time or capital.", "A successful strategy involves calculated risk and the ability to pivot quickly when a path proves non-viable.", "Self-Discipline: Without a manager or a fixed schedule, self-motivation is paramount.", "Setting clear goals, tracking progress, and maintaining a strict work ethic are essential.", "B. Essential Digital Infrastructure", "High-Speed Internet and Reliable Hardware: The basic tools of the trade.", "Downtime is lost income.", "Professional Online Presence: This includes a clean, dedicated workspace, a professional email address, and a central website or portfolio (even a simple one) to showcase work or products.", "Financial Tracking Tools: Separate business and personal finances.", "Use accounting software to track income, expenses, and taxes from day one.", "Monetizing Skills and Services: The Gig Economy and Freelancing", "One of the quickest paths to online income is leveraging existing professional skills through freelancing platforms or direct client outreach.", "A. Freelancing Platforms", "Platforms like Upwork, Fiverr, and Freelancer act as marketplaces connecting skilled professionals with clients globally.", "High-demand skills include:", "Writing and Editing: Content writing, copywriting, technical writing, and proofreading.", "Graphic Design: Branding, logo creation, social media graphics, and web design elements.", "Web Development and Programming: Building and maintaining websites, custom software, and mobile applications.", "This is consistently a high-earning category.", "Digital Marketing: SEO (Search Engine Optimization), social media management, paid advertising (PPC), and email marketing.", "Strategy for Freelancing Success:", "Niche Down: Instead of offering &quot;writing,&quot; offer &quot;SEO-optimized blog content for FinTech startups.&quot; Specialization allows for higher rates.", "Build an Impressive Portfolio: Use a file placeholder for samples of work in a dedicated, professional Fileportfolio document.", "Master Proposal Writing: Clients pay for solutions, not just skills.", "Proposals must clearly articulate how your service solves their specific problem.", "B. Virtual Assistance (VA) and Administrative Services", "Many businesses need help with administrative, technical, or creative tasks but do not require a full-time employee.", "Virtual Assistants step in to fill this gap.", "Tasks: Scheduling meetings, managing inboxes, data entry, social media scheduling, basic bookkeeping.", "Earning Potential: Starts moderately but increases significantly with specialized skills (e.g., expertise in a specific CRM or project management software).", "The Creator Economy: Content, Audience, and Influence", "The Creator Economy centers on building an audience around a specific topic and monetizing that attention through various streams.", "A. Blogging and Affiliate Marketing", "he Model: Create high-quality, valuable content (text, video, or audio) that attracts a specific audience.", "Once traffic is established, income can be generated through:", "Affiliate Marketing: Promoting other companies' products and earning a commission on sales made through unique tracking links.", "Success depends on building trust and recommending genuinely useful items.", "Display Advertising: Placing ads on the website (e.g., through Google AdSense or premium ad networks).", "B. YouTube and Podcasting", "Monetization typically follows a few routes:", "Ad Revenue: Earning a share of the ad revenue generated on the platform (requires meeting minimum audience thresholds).", "Sponsorships: Direct deals with brands to integrate their product or message into the content.", "Selling Own Products: Using the audience to drive traffic to digital or physical products (e.g., courses, merchandise).", "C. Selling Digital Products (The Scalable Model)", "The highest potential for passive income online often lies in creating and selling digital products.", "Since the product is created once and sold infinitely, the business model is highly scalable.", "E-books and Templates: Low-barrier entry products like detailed guides, spreadsheet templates (e.g., budget trackers), or presentation templates.", "Online Courses: Offering in-depth, structured education on a specific skill (e.g., mastering Excel, learning a foreign language, advanced photography).", "Platforms like Teachable and Udemy facilitate distribution.", "Stock Assets: Selling photos, videos, or graphic design elements through stock marketplaces.", "V. E-commerce and Direct Sales", "Selling physical products online remains a robust method for generating income, with modern logistics making entry easier than ever.", "A. Dropshipping", "The Model: A highly popular e-commerce method where the seller (you) never holds inventory.", "When a customer places an order on your online store, you purchase the item from a third-party supplier (often overseas), and they ship it directly to the customer.", "The Challenge: Requires intense focus on marketing, sourcing reliable suppliers, and managing customer service.", "Success is heavily reliant on finding the right product niche.", "B. Private Labeling/Fulfillment by Amazon (FBA)", "The Model: Creating your own branded product, having it manufactured (often in bulk), and then using a third-party logistics provider (like Amazon's FBA service) to handle storage, packing, and shipping.", "The Advantage: Provides greater control over branding, product quality, and profit margins compared to dropshipping.", "The Barrier: Requires significant upfront capital for inventory and marketing.", "Advanced and Passive Income Streams", "As experience and capital grow, more sophisticated and truly &quot;passive&quot; (though never completely hands-off) income streams become accessible.", "A. Investment and Trading", "hile risky, using online platforms to trade stocks, commodities, or cryptocurrencies is a direct way to make money online.", "This requires substantial education and should not be confused with gambling.", "Tools and educational resources are abundant, but disciplined risk management is essential.", "B. Creating a SaaS Product", "SaaS (Software as a Service) refers to subscription-based software applications (e.g., project management tools, email marketing systems).", "The Model: Build a useful online tool that solves a business or consumer problem and charge a recurring monthly or annual fee.", "The Challenge: High initial development cost and complexity.", "Requires technical skills (coding) or a significant budget to hire developers.", "Domain Flipping: Buying desirable domain names for a low price and selling them for a profit.", "Requires foresight into business trends and market demand.", "Website Flipping: Buying an established, monetized website (e.g., a profitable blog or small e-commerce store), optimizing it to increase its revenue (often through SEO or better monetization), and then selling it for a multiple of its annual profit.", "This requires significant analytical and marketing skill.", "Overcoming Challenges and Maintaining Security", "The digital frontier is not without its perils.", "A. Legal and Tax Obligations", "Income earned online is taxable.", "Establishing a clear legal structure (sole proprietorship, LLC, etc.) and diligently tracking income and expenses is non-negotiable.", "Consulting with a professional accountant on Datetax filing deadlines is crucial.", "B. Avoiding Scams", "The promise of easy money online attracts numerous scams.", "Always adhere to these rules:", "If it sounds too good to be true, it is.", "Guaranteed high returns for minimal effort are red flags.", "Do not share sensitive personal financial information with unverified entities.", "C. Security and Data Privacy", "Protecting your digital assets is paramount.", "Use strong, unique passwords and two-factor authentication (2FA) for all platforms.", "Secure client data and adhere to data privacy laws relevant to your customers' geographical location (e.g., GDPR).", "The Next Steps: Actionable Advice", "To begin the journey, an individual must first decide on a path.", "Assess Skills: List current professional skills and interests.", "Where do they intersect with market demand?", "Choose a Path: Select one area from the models above (e.g., content writing, dropshipping, starting a blog) and focus exclusively on it for at least six months.", "Multitasking is the enemy of momentum.", "Start Small: Do not invest heavily in tools or inventory until the basic income generation model is proven.", "Set a Calendar Event: Schedule time to review and update your plan every Calendar eventthree months.", "Find a Community: Engage with others who are pursuing similar online goals, either in online forums or local meetups at a co-working space in Place.", "Making money online is the modern evolution of entrepreneurship.", "It demands diligence, adaptability, and a long-term vision.", "By choosing a viable model, establishing a professional infrastructure, and committing to continuous self-improvement, the vast and profitable digital frontier is accessible to anyone willing to put in the focused work.", "The opportunities are limitless, constrained only by one's imagination and persistence."], "hi": [], "id": 43985934, "aiWords": 1486, "isHuman": 0, "feedback": "Your Text is AI/GPT Generated", "sentences": [], "textWords": 1545, "input_text": "The Digital Frontier: A Comprehensive Guide to Making Money Online\\n\\nI. Introduction: The New Economic Landscape\\n\\nThe internet has fundamentally reshaped the global economy, transitioning from a localized, brick-and-mortar system to a vast, interconnected digital frontier. This shift has unlocked unprecedented opportunities for individuals to earn income independent of traditional employment structures, geographical constraints, or set working hours. Making money online is no longer a niche pursuit but a mainstream aspiration, offering flexibility, scalability, and the potential for true financial independence. This comprehensive guide will explore the multifaceted world of online income generation, detailing viable strategies, necessary skills, common pitfalls, and the mindset required to thrive in the digital economy. While a 2000-word essay cannot cover every single permutation of online earning, it will provide a robust framework across key high-potential domains.\\n\\nII. The Foundation: Mindset and Digital Infrastructure\\n\\nBefore diving into specific monetization methods, it is crucial to establish the correct foundation. Online success is a marathon, not a sprint, and requires a professional, dedicated approach.\\n\\nA. The Entrepreneurial Mindset\\n\\nMaking money online demands an entrepreneurial spirit. This involves:\\n\\nPatience and Persistence: Initial income streams often take months to develop. Quitters rarely succeed.\\n\\nContinuous Learning: The digital landscape evolves rapidly. Successful online earners are perpetual students, adapting to new platforms, algorithms, and technologies.\\n\\nRisk Management: Every online venture involves some degree of risk, whether of time or capital. A successful strategy involves calculated risk and the ability to pivot quickly when a path proves non-viable.\\n\\nSelf-Discipline: Without a manager or a fixed schedule, self-motivation is paramount. Setting clear goals, tracking progress, and maintaining a strict work ethic are essential.\\n\\nB. Essential Digital Infrastructure\\n\\nA professional online operation requires reliable tools:\\n\\nHigh-Speed Internet and Reliable Hardware: The basic tools of the trade. Downtime is lost income.\\n\\nProfessional Online Presence: This includes a clean, dedicated workspace, a professional email address, and a central website or portfolio (even a simple one) to showcase work or products.\\n\\nFinancial Tracking Tools: Separate business and personal finances. Use accounting software to track income, expenses, and taxes from day one.\\n\\nIII. Monetizing Skills and Services: The Gig Economy and Freelancing\\n\\nOne of the quickest paths to online income is leveraging existing professional skills through freelancing platforms or direct client outreach.\\n\\nA. Freelancing Platforms\\n\\nPlatforms like Upwork, Fiverr, and Freelancer act as marketplaces connecting skilled professionals with clients globally. High-demand skills include:\\n\\nWriting and Editing: Content writing, copywriting, technical writing, and proofreading.\\n\\nGraphic Design: Branding, logo creation, social media graphics, and web design elements.\\n\\nWeb Development and Programming: Building and maintaining websites, custom software, and mobile applications. This is consistently a high-earning category.\\n\\nDigital Marketing: SEO (Search Engine Optimization), social media management, paid advertising (PPC), and email marketing.\\n\\nStrategy for Freelancing Success:\\n\\nNiche Down: Instead of offering &quot;writing,&quot; offer &quot;SEO-optimized blog content for FinTech startups.&quot; Specialization allows for higher rates.\\n\\nBuild an Impressive Portfolio: Use a file placeholder for samples of work in a dedicated, professional Fileportfolio document.\\n\\nMaster Proposal Writing: Clients pay for solutions, not just skills. Proposals must clearly articulate how your service solves their specific problem.\\n\\nB. Virtual Assistance (VA) and Administrative Services\\n\\nMany businesses need help with administrative, technical, or creative tasks but do not require a full-time employee. Virtual Assistants step in to fill this gap.\\n\\nTasks: Scheduling meetings, managing inboxes, data entry, social media scheduling, basic bookkeeping.\\n\\nEarning Potential: Starts moderately but increases significantly with specialized skills (e.g., expertise in a specific CRM or project management software).\\n\\nIV. The Creator Economy: Content, Audience, and Influence\\n\\nThe Creator Economy centers on building an audience around a specific topic and monetizing that attention through various streams.\\n\\nA. Blogging and Affiliate Marketing\\n\\nThe Model: Create high-quality, valuable content (text, video, or audio) that attracts a specific audience. Once traffic is established, income can be generated through:\\n\\nAffiliate Marketing: Promoting other companies' products and earning a commission on sales made through unique tracking links. Success depends on building trust and recommending genuinely useful items.\\n\\nDisplay Advertising: Placing ads on the website (e.g., through Google AdSense or premium ad networks).\\n\\nB. YouTube and Podcasting\\n\\nVideo and audio content are highly engaging. Monetization typically follows a few routes:\\n\\nAd Revenue: Earning a share of the ad revenue generated on the platform (requires meeting minimum audience thresholds).\\n\\nSponsorships: Direct deals with brands to integrate their product or message into the content.\\n\\nSelling Own Products: Using the audience to drive traffic to digital or physical products (e.g., courses, merchandise).\\n\\nC. Selling Digital Products (The Scalable Model)\\n\\nThe highest potential for passive income online often lies in creating and selling digital products. Since the product is created once and sold infinitely, the business model is highly scalable.\\n\\nE-books and Templates: Low-barrier entry products like detailed guides, spreadsheet templates (e.g., budget trackers), or presentation templates.\\n\\nOnline Courses: Offering in-depth, structured education on a specific skill (e.g., mastering Excel, learning a foreign language, advanced photography). Platforms like Teachable and Udemy facilitate distribution.\\n\\nStock Assets: Selling photos, videos, or graphic design elements through stock marketplaces.\\n\\nV. E-commerce and Direct Sales\\n\\nSelling physical products online remains a robust method for generating income, with modern logistics making entry easier than ever.\\n\\nA. Dropshipping\\n\\nThe Model: A highly popular e-commerce method where the seller (you) never holds inventory. When a customer places an order on your online store, you purchase the item from a third-party supplier (often overseas), and they ship it directly to the customer.\\n\\nThe Challenge: Requires intense focus on marketing, sourcing reliable suppliers, and managing customer service. Success is heavily reliant on finding the right product niche.\\n\\nB. Private Labeling/Fulfillment by Amazon (FBA)\\n\\nThe Model: Creating your own branded product, having it manufactured (often in bulk), and then using a third-party logistics provider (like Amazon's FBA service) to handle storage, packing, and shipping.\\n\\nThe Advantage: Provides greater control over branding, product quality, and profit margins compared to dropshipping.\\n\\nThe Barrier: Requires significant upfront capital for inventory and marketing.\\n\\nA table summarizing core e-commerce models:\\n\\nModel\\n\\nInventory Risk\\n\\nUpfront Capital\\n\\nScalability\\n\\nControl over Branding\\n\\nDropshipping\\n\\nLow\\n\\nLow\\n\\nHigh\\n\\nLow\\n\\nFBA/Private Label\\n\\nHigh\\n\\nHigh\\n\\nVery High\\n\\nHigh\\n\\nDigital Products\\n\\nZero\\n\\nLow\\n\\nExtreme\\n\\nComplete\\n\\nVI. Advanced and Passive Income Streams\\n\\nAs experience and capital grow, more sophisticated and truly &quot;passive&quot; (though never completely hands-off) income streams become accessible.\\n\\nA. Investment and Trading\\n\\nWhile risky, using online platforms to trade stocks, commodities, or cryptocurrencies is a direct way to make money online. This requires substantial education and should not be confused with gambling. Tools and educational resources are abundant, but disciplined risk management is essential.\\n\\nB. Creating a SaaS Product\\n\\nSaaS (Software as a Service) refers to subscription-based software applications (e.g., project management tools, email marketing systems).\\n\\nThe Model: Build a useful online tool that solves a business or consumer problem and charge a recurring monthly or annual fee.\\n\\nThe Challenge: High initial development cost and complexity. Requires technical skills (coding) or a significant budget to hire developers.\\n\\nC. Domain Flipping and Website Acquisition\\n\\nDomain Flipping: Buying desirable domain names for a low price and selling them for a profit. Requires foresight into business trends and market demand.\\n\\nWebsite Flipping: Buying an established, monetized website (e.g., a profitable blog or small e-commerce store), optimizing it to increase its revenue (often through SEO or better monetization), and then selling it for a multiple of its annual profit. This requires significant analytical and marketing skill.\\n\\nVII. Overcoming Challenges and Maintaining Security\\n\\nThe digital frontier is not without its perils.\\n\\nA. Legal and Tax Obligations\\n\\nIncome earned online is taxable. Establishing a clear legal structure (sole proprietorship, LLC, etc.) and diligently tracking income and expenses is non-negotiable. Consulting with a professional accountant on Datetax filing deadlines is crucial.\\n\\nB. Avoiding Scams\\n\\nThe promise of easy money online attracts numerous scams. Always adhere to these rules:\\n\\nIf it sounds too good to be true, it is. Guaranteed high returns for minimal effort are red flags.\\n\\nNever pay money to start a job. Legitimate employers or clients pay you; you do not pay them.\\n\\nDo not share sensitive personal financial information with unverified entities.\\n\\nC. Security and Data Privacy\\n\\nProtecting your digital assets is paramount.\\n\\nUse strong, unique passwords and two-factor authentication (2FA) for all platforms.\\n\\nSecure client data and adhere to data privacy laws relevant to your customers' geographical location (e.g., GDPR).\\n\\nVIII. The Next Steps: Actionable Advice\\n\\nTo begin the journey, an individual must first decide on a path.\\n\\nAssess Skills: List current professional skills and interests. Where do they intersect with market demand?\\n\\nChoose a Path: Select one area from the models above (e.g., content writing, dropshipping, starting a blog) and focus exclusively on it for at least six months. Multitasking is the enemy of momentum.\\n\\nStart Small: Do not invest heavily in tools or inventory until the basic income generation model is proven.\\n\\nSet a Calendar Event: Schedule time to review and update your plan every Calendar eventthree months.\\n\\nFind a Community: Engage with others who are pursuing similar online goals, either in online forums or local meetups at a co-working space in Place.\\n\\nIX. Conclusion\\n\\nMaking money online is the modern evolution of entrepreneurship. It demands diligence, adaptability, and a long-term vision. By choosing a viable model, establishing a professional infrastructure, and committing to continuous self-improvement, the vast and profitable digital frontier is accessible to anyone willing to put in the focused work. The opportunities are limitless, constrained only by one's imagination and persistence.", "fakePercentage": 95.51, "specialIndexes": [7, 50, 29, 266, 265, 264, 263, 262, 260, 258, 257, 255, 254, 253, 252, 251, 249, 246, 445, 691, 690, 680], "specialSentences": ["II.", "IV.", "III.", "VI.", "Complete", "Extreme", "Low", "Zero", "High", "High", "High", "Low", "High", "Low", "Low", "Dropshipping", "Scalability", "Model", "VII.", "Conclusion", "IX.", "VIII."], "originalParagraph": "2026/2/7/d468d37d-212d-4412-bdfa-b5c2499a9414", "additional_feedback": ""}
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (key, value, updated_at) FROM stdin;
report_logo	\N	2026-02-07 17:12:38.112664+00
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, scans_used, stripe_subscription_id, created_at, updated_at) FROM stdin;
6bebd162-e935-4b55-9118-7c9865727a6d	83b6fa09-7111-4a00-a780-f8f6dd87ff95	e1eacc09-d366-4084-81e2-1dc2636c4dd0	active	2026-02-07 21:30:25.149+00	2026-03-09 21:30:25.149+00	0	\N	2026-02-07 21:30:26.103003+00	2026-02-07 21:30:26.103003+00
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_tickets (id, user_id, subject, message, priority, status, assigned_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: zerogpt_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zerogpt_accounts (id, label, bearer_token, is_active, max_concurrent, current_active, total_requests, failed_requests, created_at, updated_at, max_retries) FROM stdin;
f92e8049-c969-4c77-9076-961f2aae26b6	Main Account	eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4NTY1MzYiLCJyb2xlIjoiMyIsInNhbGF0YV9lbmdpbmUiOiIyLjciLCJjb3N0X3Blcl90aG91c2FuZCI6IjAuMDY5IiwibnVtYmVyX29mX2NoYXJhY3RlcnMiOiI1MDAwMDAiLCJudW1iZXJfb2ZfZmlsZXMiOiIxNTAiLCJleHAiOjIwODE1MTU0MDh9.Bszh7flifi5n73AH6LRd5Bqc2PJnKsNb3hINSp-LGGTHyPB25y83mIxxlUd-ZF3Zuyzgx5T9Tsj-s-3C4KmKoCdzNbnNxnPLuNMmpT1m7CxK84B8TJe6ndUDP0MHCewWx8QIDOw2d3YuYB0iSzIGjLn6vRfVNVhq_XX4LqKEBQo	t	3	0	4	0	2026-02-07 15:47:26.031675+00	2026-02-07 19:52:38.006+00	3
\.


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: key_usage_logs key_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_usage_logs
    ADD CONSTRAINT key_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: license_keys license_keys_key_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_key_code_key UNIQUE (key_code);


--
-- Name: license_keys license_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_key_key UNIQUE (key);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: plans plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_name_key UNIQUE (name);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: reseller_clients reseller_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_clients
    ADD CONSTRAINT reseller_clients_pkey PRIMARY KEY (id);


--
-- Name: reseller_profiles reseller_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_profiles
    ADD CONSTRAINT reseller_profiles_pkey PRIMARY KEY (id);


--
-- Name: reseller_profiles reseller_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_profiles
    ADD CONSTRAINT reseller_profiles_user_id_key UNIQUE (user_id);


--
-- Name: reseller_transactions reseller_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_transactions
    ADD CONSTRAINT reseller_transactions_pkey PRIMARY KEY (id);


--
-- Name: resellers resellers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_pkey PRIMARY KEY (id);


--
-- Name: resellers resellers_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_referral_code_key UNIQUE (referral_code);


--
-- Name: scan_queue scan_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scan_queue
    ADD CONSTRAINT scan_queue_pkey PRIMARY KEY (id);


--
-- Name: scans scans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scans
    ADD CONSTRAINT scans_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: zerogpt_accounts zerogpt_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zerogpt_accounts
    ADD CONSTRAINT zerogpt_accounts_pkey PRIMARY KEY (id);


--
-- Name: idx_api_keys_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_key_hash ON public.api_keys USING btree (key_hash);


--
-- Name: idx_api_keys_reseller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_reseller_id ON public.api_keys USING btree (reseller_id);


--
-- Name: idx_key_usage_logs_api_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_key_usage_logs_api_key_id ON public.key_usage_logs USING btree (api_key_id);


--
-- Name: idx_key_usage_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_key_usage_logs_created_at ON public.key_usage_logs USING btree (created_at);


--
-- Name: idx_license_keys_key_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_license_keys_key_code ON public.license_keys USING btree (key_code);


--
-- Name: idx_license_keys_reseller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_license_keys_reseller_id ON public.license_keys USING btree (reseller_id);


--
-- Name: idx_license_keys_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_license_keys_status ON public.license_keys USING btree (status);


--
-- Name: idx_licenses_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_licenses_key ON public.licenses USING btree (key);


--
-- Name: idx_referrals_reseller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_reseller_id ON public.referrals USING btree (reseller_id);


--
-- Name: idx_reports_scan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_scan_id ON public.reports USING btree (scan_id);


--
-- Name: idx_reseller_clients_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reseller_clients_expires ON public.reseller_clients USING btree (expires_at);


--
-- Name: idx_reseller_clients_reseller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reseller_clients_reseller ON public.reseller_clients USING btree (reseller_id);


--
-- Name: idx_reseller_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reseller_clients_status ON public.reseller_clients USING btree (status);


--
-- Name: idx_reseller_transactions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reseller_transactions_created ON public.reseller_transactions USING btree (created_at DESC);


--
-- Name: idx_reseller_transactions_reseller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reseller_transactions_reseller ON public.reseller_transactions USING btree (reseller_id);


--
-- Name: idx_resellers_referral_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resellers_referral_code ON public.resellers USING btree (referral_code);


--
-- Name: idx_resellers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resellers_user_id ON public.resellers USING btree (user_id);


--
-- Name: idx_scan_queue_scan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scan_queue_scan_id ON public.scan_queue USING btree (scan_id);


--
-- Name: idx_scan_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scan_queue_status ON public.scan_queue USING btree (status);


--
-- Name: idx_scans_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scans_created_at ON public.scans USING btree (created_at DESC);


--
-- Name: idx_scans_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scans_user_id ON public.scans USING btree (user_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_zerogpt_accounts_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zerogpt_accounts_active ON public.zerogpt_accounts USING btree (is_active);


--
-- Name: api_keys api_keys_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;


--
-- Name: key_usage_logs key_usage_logs_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_usage_logs
    ADD CONSTRAINT key_usage_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE CASCADE;


--
-- Name: license_keys license_keys_claimed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES public.profiles(id);


--
-- Name: license_keys license_keys_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.profiles(id);


--
-- Name: license_keys license_keys_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: license_keys license_keys_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.resellers(id);


--
-- Name: licenses licenses_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: licenses licenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: licenses licenses_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: referrals referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);


--
-- Name: reports reports_scan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reseller_clients reseller_clients_client_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_clients
    ADD CONSTRAINT reseller_clients_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES auth.users(id);


--
-- Name: reseller_clients reseller_clients_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_clients
    ADD CONSTRAINT reseller_clients_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: reseller_clients reseller_clients_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_clients
    ADD CONSTRAINT reseller_clients_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.reseller_profiles(id) ON DELETE CASCADE;


--
-- Name: reseller_profiles reseller_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_profiles
    ADD CONSTRAINT reseller_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reseller_transactions reseller_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_transactions
    ADD CONSTRAINT reseller_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: reseller_transactions reseller_transactions_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_transactions
    ADD CONSTRAINT reseller_transactions_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.reseller_profiles(id) ON DELETE CASCADE;


--
-- Name: resellers resellers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: scan_queue scan_queue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scan_queue
    ADD CONSTRAINT scan_queue_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.zerogpt_accounts(id) ON DELETE SET NULL;


--
-- Name: scan_queue scan_queue_scan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scan_queue
    ADD CONSTRAINT scan_queue_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE;


--
-- Name: scans scans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scans
    ADD CONSTRAINT scans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: licenses Admins can manage licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage licenses" ON public.licenses USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.plans USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: referrals Admins can manage referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage referrals" ON public.referrals USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: resellers Admins can manage resellers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage resellers" ON public.resellers USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: subscriptions Admins can manage subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: support_tickets Admins can manage tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tickets" ON public.support_tickets USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: plans Plans are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plans are viewable by everyone" ON public.plans FOR SELECT USING (true);


--
-- Name: resellers Resellers can update own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can update own data" ON public.resellers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: resellers Resellers can view own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view own data" ON public.resellers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Resellers can view own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Resellers can view own referrals" ON public.referrals FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.resellers
  WHERE ((resellers.id = referrals.reseller_id) AND (resellers.user_id = auth.uid())))));


--
-- Name: support_tickets Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: licenses Users can view assigned licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view assigned licenses" ON public.licenses FOR SELECT USING ((auth.uid() = assigned_to));


--
-- Name: reports Users can view own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reseller_transactions admin_insert_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_insert_transactions ON public.reseller_transactions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: license_keys admin_manage_license_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_license_keys ON public.license_keys USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: reseller_clients admin_manage_reseller_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_reseller_clients ON public.reseller_clients USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: reseller_profiles admin_manage_resellers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_resellers ON public.reseller_profiles USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: zerogpt_accounts admin_manage_zerogpt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_zerogpt ON public.zerogpt_accounts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: reseller_clients admin_view_all_reseller_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_all_reseller_clients ON public.reseller_clients FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: reseller_profiles admin_view_all_resellers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_all_resellers ON public.reseller_profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: reseller_transactions admin_view_all_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_all_transactions ON public.reseller_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: api_keys admin_view_api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_api_keys ON public.api_keys FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: key_usage_logs admin_view_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_logs ON public.key_usage_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: scan_queue admin_view_scan_queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_scan_queue ON public.scan_queue FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: key_usage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_usage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: license_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: licenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

--
-- Name: plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: reseller_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reseller_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: reseller_clients reseller_insert_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_insert_clients ON public.reseller_clients FOR INSERT WITH CHECK ((reseller_id IN ( SELECT reseller_profiles.id
   FROM public.reseller_profiles
  WHERE (reseller_profiles.user_id = auth.uid()))));


--
-- Name: api_keys reseller_manage_api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_manage_api_keys ON public.api_keys USING ((EXISTS ( SELECT 1
   FROM public.resellers
  WHERE ((resellers.id = api_keys.reseller_id) AND (resellers.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.resellers
  WHERE ((resellers.id = api_keys.reseller_id) AND (resellers.user_id = auth.uid())))));


--
-- Name: reseller_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reseller_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reseller_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reseller_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: reseller_clients reseller_update_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_update_clients ON public.reseller_clients FOR UPDATE USING ((reseller_id IN ( SELECT reseller_profiles.id
   FROM public.reseller_profiles
  WHERE (reseller_profiles.user_id = auth.uid()))));


--
-- Name: reseller_profiles reseller_update_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_update_own_profile ON public.reseller_profiles FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: license_keys reseller_view_license_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_view_license_keys ON public.license_keys FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.resellers
  WHERE ((resellers.id = license_keys.reseller_id) AND (resellers.user_id = auth.uid())))));


--
-- Name: key_usage_logs reseller_view_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_view_logs ON public.key_usage_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.api_keys
     JOIN public.resellers ON ((resellers.id = api_keys.reseller_id)))
  WHERE ((api_keys.id = key_usage_logs.api_key_id) AND (resellers.user_id = auth.uid())))));


--
-- Name: reseller_clients reseller_view_own_clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_view_own_clients ON public.reseller_clients FOR SELECT USING ((reseller_id IN ( SELECT reseller_profiles.id
   FROM public.reseller_profiles
  WHERE (reseller_profiles.user_id = auth.uid()))));


--
-- Name: reseller_profiles reseller_view_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_view_own_profile ON public.reseller_profiles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: reseller_transactions reseller_view_own_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reseller_view_own_transactions ON public.reseller_transactions FOR SELECT USING ((reseller_id IN ( SELECT reseller_profiles.id
   FROM public.reseller_profiles
  WHERE (reseller_profiles.user_id = auth.uid()))));


--
-- Name: resellers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

--
-- Name: scan_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scan_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: scans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

--
-- Name: scans scans_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY scans_insert_own ON public.scans FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scans scans_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY scans_select_own ON public.scans FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scans scans_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY scans_update_own ON public.scans FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: api_keys service_role_api_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_api_keys ON public.api_keys USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: license_keys service_role_license_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_license_keys ON public.license_keys USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: key_usage_logs service_role_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_logs ON public.key_usage_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: scan_queue service_role_scan_queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_scan_queue ON public.scan_queue USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: zerogpt_accounts service_role_zerogpt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_zerogpt ON public.zerogpt_accounts USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions subscriptions_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscriptions_select_own ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: license_keys user_claim_license_key; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_claim_license_key ON public.license_keys FOR UPDATE USING ((status = 'available'::text)) WITH CHECK (((claimed_by = auth.uid()) AND (status = 'claimed'::text)));


--
-- Name: scan_queue user_insert_scan_queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_scan_queue ON public.scan_queue FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.scans
  WHERE ((scans.id = scan_queue.scan_id) AND (scans.user_id = auth.uid())))));


--
-- Name: license_keys user_lookup_available_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_lookup_available_keys ON public.license_keys FOR SELECT USING (((status = 'available'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: license_keys user_view_claimed_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_view_claimed_keys ON public.license_keys FOR SELECT USING ((claimed_by = auth.uid()));


--
-- Name: zerogpt_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zerogpt_accounts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict MlHkKEY72fCPtO9gGUP9THfdUhKdjH2LO7btN2LLp4QiKfU7MGYfbXUONEzQpwt

