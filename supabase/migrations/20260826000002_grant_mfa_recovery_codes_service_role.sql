-- Grant schema usage just in case (usually already granted if identity.accounts works)
GRANT USAGE ON SCHEMA identity TO service_role;

-- Grant required CRUD privileges strictly to service_role to allow the server actions to manage recovery codes
GRANT SELECT, INSERT, UPDATE, DELETE ON identity.mfa_recovery_codes TO service_role;
