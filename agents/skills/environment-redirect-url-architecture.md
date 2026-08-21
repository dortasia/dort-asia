# Environment-Aware Redirect and URL Architecture

Analyze the entire project and fix all environment-dependent redirects, callback URLs, navigation URLs, and absolute URL generation.

## Goal

The application must automatically work according to the domain from which the user is currently accessing it.

Supported environments:

* Local: `http://localhost:3000`
* Development/Beta: `https://beta.dortasia.com`
* Production: `https://dortasia.com`

I must NOT manually change code when moving between these environments.

The same source code must work in all environments.

---

## Core Requirement

Find every place in the project where URLs are hardcoded or environment-specific.

Search for:

* `localhost`
* `beta.dortasia.com`
* `dortasia.com`
* `http://`
* `https://`
* hardcoded redirect URLs
* Stripe `success_url`
* Stripe `cancel_url`
* OAuth callback URLs
* authentication redirects
* email verification URLs
* password reset URLs
* invitation URLs
* API callback URLs
* middleware redirects
* `window.location.href`
* `window.location.replace`
* `router.push`
* `redirect()`
* `NextResponse.redirect`
* `Response.redirect`
* absolute URLs constructed manually

Do not blindly replace external third-party URLs. Only modify URLs that represent this application's own domain.

---

# URL Strategy

## Server-side Next.js code

When an absolute URL is required, derive the origin from the current request.

Preferred:

```ts
const origin = request.nextUrl.origin;
```

or, when using a standard `Request`:

```ts
const origin = new URL(request.url).origin;
```

Then construct URLs using:

```ts
const callbackUrl = `${origin}/auth/callback`;
```

Never hardcode:

```ts
https://dortasia.com
```

or:

```ts
https://beta.dortasia.com
```

or:

```ts
http://localhost:3000
```

inside server-side application logic.

---

# Client-side code

When an absolute URL is genuinely required in browser code, use:

```ts
window.location.origin
```

Example:

```ts
const origin = window.location.origin;
const url = `${origin}/dashboard`;
```

However, prefer relative URLs whenever possible.

Prefer:

```ts
router.push("/dashboard");
```

instead of:

```ts
router.push("https://dortasia.com/dashboard");
```

---

# Stripe

Inspect all Stripe Checkout/session creation code.

For example:

```ts
const origin = request.nextUrl.origin;

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  success_url: `${origin}/payment/success`,
  cancel_url: `${origin}/pricing`,
});
```

The Stripe redirect must automatically become:

Local:

```text
http://localhost:3000/payment/success
```

Beta:

```text
https://beta.dortasia.com/payment/success
```

Production:

```text
https://dortasia.com/payment/success
```

without changing the source code.

---

# Authentication and OAuth

Inspect all authentication flows.

The following must not accidentally redirect users between environments:

```text
localhost → production
beta → production
production → beta
```

The redirect/callback URL should be based on the current environment whenever the authentication provider supports it.

Examples:

```text
/auth/callback
/auth/verify
/auth/reset-password
/invite
```

Ensure the current environment is preserved throughout the complete authentication flow.

---

# Critical Requirement: No Environment Crossover

Test every redirect flow against this matrix:

| Current environment | Expected destination |
| ------------------- | -------------------- |
| localhost           | localhost            |
| beta.dortasia.com   | beta.dortasia.com    |
| dortasia.com        | dortasia.com         |

Examples:

If the user starts from:

```text
http://localhost:3000
```

they must never be redirected to:

```text
https://beta.dortasia.com
```

or:

```text
https://dortasia.com
```

If the user starts from:

```text
https://beta.dortasia.com
```

they must remain on:

```text
https://beta.dortasia.com
```

If the user starts from:

```text
https://dortasia.com
```

they must remain on:

```text
https://dortasia.com
```

---

# Do Not Solve This With Manual Environment Conditions

Do NOT create unnecessary logic like:

```ts
if (hostname === "localhost") {
  // localhost
} else if (hostname === "beta.dortasia.com") {
  // beta
} else {
  // production
}
```

if the only purpose is generating the current application's URL.

Prefer:

```ts
const origin = request.nextUrl.origin;
```

This makes the implementation environment-independent.

---

# Environment Variables

Inspect `.env`, `.env.local`, `.env.example`, Vercel configuration, and application configuration.

Environment variables should contain actual environment-specific configuration only.

Do not introduce environment variables such as:

```text
APP_URL=http://localhost:3000
```

unless there is a specific technical requirement that makes request-based origin detection impossible.

If an environment-specific URL is genuinely required by an external service, centralize it in configuration rather than scattering it throughout the application.

---

# Security

Do not introduce open redirects.

Never blindly redirect to a user-provided URL:

```ts
const redirectUrl = searchParams.get("redirect");
return Response.redirect(redirectUrl);
```

Validate redirect destinations and allow only trusted internal paths/domains.

Do not expose:

```text
STRIPE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
```

or other secrets to the browser.

Do not add secrets to GitHub.

---

# Implementation Process

Before changing anything:

1. Scan the complete repository.
2. Identify all hardcoded application domains.
3. Identify every redirect and callback flow.
4. Identify server-side versus client-side URL generation.
5. Identify authentication and Stripe flows.
6. Identify any existing environment configuration.
7. Determine whether the current architecture already has a URL utility.

Then implement the smallest clean architecture that solves the problem globally.

If a reusable URL utility is appropriate, create one and use it consistently instead of duplicating URL logic.

---

# Validation

After implementation, verify:

### Local

```text
http://localhost:3000
```

Expected:

```text
localhost → localhost
```

### Beta

```text
https://beta.dortasia.com
```

Expected:

```text
beta → beta
```

### Production

```text
https://dortasia.com
```

Expected:

```text
production → production
```

Specifically test:

* Stripe Checkout
* Stripe success redirect
* Stripe cancellation redirect
* Login
* Logout
* OAuth callback
* Email verification
* Password reset
* Invitation links
* Middleware redirects
* Protected routes
* Any `/api/*` redirect
* Any external callback that returns to the application

---

# Final Requirement

Do not simply patch one redirect.

Analyze the entire project and establish a consistent environment-aware URL strategy.

The final architecture must satisfy:

```text
One codebase
     ↓
Three environments
     ↓
Automatic current-origin detection
     ↓
No manual URL changes
     ↓
No localhost/beta/production crossover
```

After making the changes:

1. List every file modified.
2. Explain what was changed.
3. Identify any remaining hardcoded application URLs.
4. Explain whether those remaining URLs are intentional.
5. Confirm that Stripe/authentication redirects now preserve the current environment.
6. Run the project's type-check/build/lint tests if available and fix any errors caused by the changes.

Do not modify unrelated functionality or UI.
