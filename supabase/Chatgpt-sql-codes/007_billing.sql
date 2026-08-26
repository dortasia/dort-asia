CREATE TABLE billing.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL UNIQUE
        REFERENCES company.companies(id)
        ON DELETE RESTRICT,

    stripe_customer_id TEXT NOT NULL UNIQUE,

    currency CHAR(3) NOT NULL DEFAULT 'SGD',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE billing.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company.companies(id)
        ON DELETE RESTRICT,

    stripe_invoice_id TEXT UNIQUE,

    status TEXT NOT NULL
        CHECK (status IN (
            'draft',
            'open',
            'paid',
            'void',
            'uncollectible'
        )),

    amount_due NUMERIC(12,2) NOT NULL DEFAULT 0,

    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,

    currency CHAR(3) NOT NULL DEFAULT 'SGD',

    invoice_url TEXT,

    due_at TIMESTAMPTZ,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE billing.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company.companies(id)
        ON DELETE RESTRICT,

    invoice_id UUID
        REFERENCES billing.invoices(id)
        ON DELETE SET NULL,

    stripe_payment_intent_id TEXT UNIQUE,

    amount NUMERIC(12,2) NOT NULL,

    currency CHAR(3) NOT NULL DEFAULT 'SGD',

    status TEXT NOT NULL
        CHECK (status IN (
            'pending',
            'succeeded',
            'failed',
            'refunded'
        )),

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_billing_invoices_company
ON billing.invoices(company_id);

CREATE INDEX idx_billing_payments_company
ON billing.payments(company_id);