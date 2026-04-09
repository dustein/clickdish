-- ============================================================================
-- ClickDish — Fresh Database Schema Setup
-- 
-- ⚠️ WARNING: THIS WILL DROP ALL EXISTING CLICKDISH TABLES AND DATA. 
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CLEANUP (Drop existing tables)
-- ────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.payment_events CASCADE;
DROP TABLE IF EXISTS public.analysis_logs CASCADE;
DROP TABLE IF EXISTS public.anonymous_usage CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.usage_control CASCADE;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. HELPER: auto-update updated_at trigger function
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLE: user_profiles (Replaces usage_control for authenticated users)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.user_profiles (
    user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cards_used         INTEGER NOT NULL DEFAULT 0,
    is_premium         BOOLEAN NOT NULL DEFAULT FALSE,
    plan_type          VARCHAR(20) NOT NULL DEFAULT 'free'
                       CHECK (plan_type IN ('free', 'monthly', 'annual')),
    premium_since      TIMESTAMPTZ,
    premium_expires_at TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-touch updated_at on every UPDATE
CREATE TRIGGER trg_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.user_profiles IS 'Permanent per-user record: usage counters and subscription state.';


-- ────────────────────────────────────────────────────────────────────────────
-- 4. TABLE: anonymous_usage (Replaces usage_control for visitors)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.anonymous_usage (
    device_id   VARCHAR(255) PRIMARY KEY,
    cards_used  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.anonymous_usage IS 'Disposable rate-limiting for unauthenticated visitors. Safe to prune rows older than 30 days.';


-- ────────────────────────────────────────────────────────────────────────────
-- 5. TABLE: payment_events (Webhook audit trail + idempotency)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.payment_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    mp_payment_id   BIGINT NOT NULL UNIQUE,
    status          VARCHAR(30) NOT NULL,
    status_detail   VARCHAR(100),
    payment_method  VARCHAR(30),
    amount          DECIMAL(10, 2),
    payer_email     VARCHAR(256) NOT NULL,
    plan_type       VARCHAR(20),
    action_taken    VARCHAR(50),
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_events_mp_id ON public.payment_events (mp_payment_id);
CREATE INDEX idx_payment_events_user ON public.payment_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;

COMMENT ON TABLE public.payment_events IS 'Immutable audit log of every Mercado Pago webhook processed. mp_payment_id UNIQUE enforces idempotency.';


-- ────────────────────────────────────────────────────────────────────────────
-- 6. TABLE: analysis_logs
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.analysis_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    device_id     VARCHAR(255),
    raw_result    JSONB NOT NULL,
    success       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_logs_user_created ON public.analysis_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analysis_logs_created ON public.analysis_logs (created_at);

COMMENT ON TABLE public.analysis_logs IS 'History of dish analyses.';


-- ────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────────────────

-- Best Practice: Enable RLS on ALL tables to ensure they are secure by default.
-- When RLS is enabled with no policies, all frontend (anon/authenticated) access is DENIED.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- CLIENT-FACING TABLES (user_profiles, analysis_logs)
-- ----------------------------------------------------------------------------

-- Policy: Users can only read their OWN user profile.
-- No insert/update/delete allowed from the frontend! The backend handles it via service_key.
CREATE POLICY "Enable read access for own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only read their OWN analysis logs.
-- No insert/update/delete allowed from the frontend.
CREATE POLICY "Enable read access for own logs"
    ON public.analysis_logs FOR SELECT
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- BACKEND-ONLY TABLES (anonymous_usage, payment_events)
-- ----------------------------------------------------------------------------
-- NOTE: anonymous_usage and payment_events intentionally have ZERO policies.
-- Because RLS is ENABLED, this means any request from the frontend (API fetch) will be DENIED.
-- Only the backend API (using SUPABASE_SERVICE_KEY) can read or write to these tables,
-- which is exactly what we want for maximum security on billing audit trails and rate limits.


-- ============================================================================
-- DONE! System is freshly initialized and fully secured.
-- ============================================================================
