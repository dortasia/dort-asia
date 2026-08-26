ALTER TABLE identity.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.account_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.account_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.account_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE company.companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE platform.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.app_features ENABLE ROW LEVEL SECURITY;

ALTER TABLE marketplace.app_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace.plan_features ENABLE ROW LEVEL SECURITY;

ALTER TABLE billing.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE subscriptions.subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE access.entitlements ENABLE ROW LEVEL SECURITY;

ALTER TABLE sso.registered_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso.authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso.app_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.security_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE lifecycle.account_deletion_requests ENABLE ROW LEVEL SECURITY;

--the core policies
CREATE POLICY "account_owner_select"
ON identity.accounts
FOR SELECT
TO authenticated
USING (
    auth_user_id = auth.uid()
);


CREATE POLICY "account_owner_update"
ON identity.accounts
FOR UPDATE
TO authenticated
USING (
    auth_user_id = auth.uid()
)
WITH CHECK (
    auth_user_id = auth.uid()
);


CREATE POLICY "account_profile_owner_all"
ON identity.account_profiles
FOR ALL
TO authenticated
USING (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
);


CREATE POLICY "account_security_owner_all"
ON identity.account_security
FOR ALL
TO authenticated
USING (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
);


CREATE POLICY "company_owner_all"
ON company.companies
FOR ALL
TO authenticated
USING (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
);

--For marketplace/app catalog, normal customers need read access

CREATE POLICY "authenticated_read_apps"
ON platform.apps
FOR SELECT
TO authenticated
USING (
    status = 'active'
);


CREATE POLICY "authenticated_read_features"
ON platform.app_features
FOR SELECT
TO authenticated
USING (
    status = 'active'
);


CREATE POLICY "authenticated_read_plans"
ON marketplace.app_plans
FOR SELECT
TO authenticated
USING (
    status = 'active'
);


CREATE POLICY "authenticated_read_plan_features"
ON marketplace.plan_features
FOR SELECT
TO authenticated
USING (
    enabled = TRUE
);

--For subscriptions

CREATE POLICY "company_subscription_read"
ON subscriptions.subscriptions
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id
        FROM company.companies
        WHERE account_id IN (
            SELECT id
            FROM identity.accounts
            WHERE auth_user_id = auth.uid()
        )
    )
);

--Entitlements
CREATE POLICY "company_entitlement_read"
ON access.entitlements
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id
        FROM company.companies
        WHERE account_id IN (
            SELECT id
            FROM identity.accounts
            WHERE auth_user_id = auth.uid()
        )
    )
);

--Billing
CREATE POLICY "company_billing_read"
ON billing.customers
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id
        FROM company.companies
        WHERE account_id IN (
            SELECT id
            FROM identity.accounts
            WHERE auth_user_id = auth.uid()
        )
    )
);


CREATE POLICY "company_invoice_read"
ON billing.invoices
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id
        FROM company.companies
        WHERE account_id IN (
            SELECT id
            FROM identity.accounts
            WHERE auth_user_id = auth.uid()
        )
    )
);


CREATE POLICY "company_payment_read"
ON billing.payments
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id
        FROM company.companies
        WHERE account_id IN (
            SELECT id
            FROM identity.accounts
            WHERE auth_user_id = auth.uid()
        )
    )
);

--Audit
CREATE POLICY "company_audit_read"
ON audit.audit_logs
FOR SELECT
TO authenticated
USING (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
);

--Deletion
CREATE POLICY "account_deletion_read"
ON lifecycle.account_deletion_requests
FOR SELECT
TO authenticated
USING (
    account_id IN (
        SELECT id
        FROM identity.accounts
        WHERE auth_user_id = auth.uid()
    )
);
