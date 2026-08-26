CREATE TABLE platform.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    slug TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    description TEXT,

    logo_url TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'draft',
            'active',
            'maintenance',
            'deprecated',
            'disabled'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE platform.app_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    app_id UUID NOT NULL
        REFERENCES platform.apps(id)
        ON DELETE CASCADE,

    feature_key TEXT NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'active',
            'disabled'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(app_id, feature_key)
);


CREATE INDEX idx_app_features_app
ON platform.app_features(app_id);