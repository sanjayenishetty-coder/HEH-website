-- 0016: admin accounts in the database (so passwords can be reset by email) and one-time codes/links.
-- The first account is created from ADMIN_USER / ADMIN_PASSWORD_HASH / ADMIN_EMAIL in .env when the API starts
-- and finds this table empty; after that the password lives here.

CREATE TABLE admin_users (
  id                   serial PRIMARY KEY,
  username             text NOT NULL,
  email                text,
  password_hash        text NOT NULL,
  email_verified_at    timestamptz,
  -- sessions issued before this time are no longer valid (set when the password is reset)
  sessions_valid_after timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_username_key ON admin_users (lower(username));
CREATE UNIQUE INDEX admin_users_email_key ON admin_users (lower(email));

-- kind: 'reset' (password reset link), 'login' (security code at sign-in), 'verify' (email verification code)
-- token_hash: sha256 of the random token in the link / held by the browser between sign-in steps
-- code_hash: HMAC of the 6-digit code (login/verify only)
CREATE TABLE admin_tokens (
  id         serial PRIMARY KEY,
  admin_id   integer NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('reset', 'login', 'verify')),
  token_hash text NOT NULL UNIQUE,
  code_hash  text,
  attempts   integer NOT NULL DEFAULT 0,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_tokens_admin_idx ON admin_tokens (admin_id, kind);
