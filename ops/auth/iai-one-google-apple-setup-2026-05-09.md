# iai.one Google ID and Apple ID setup

Date: 2026-05-09
Surface: `iai.one`
Runtime owner: `apps/root`

## Provider keys to collect

Google OAuth web client:

- `ROOT_GOOGLE_CLIENT_ID`
- Google client secret for the server token exchange layer, when that layer is installed.

Apple Sign in with Apple web service:

- `ROOT_APPLE_CLIENT_ID` as the Apple Services ID.
- Apple Team ID.
- Apple Key ID.
- Apple private key `.p8` contents for generating the client secret JWT on the server token exchange layer.

## Runtime env

```bash
ROOT_AUTH_BASE_URL=https://iai.one
ROOT_AUTH_COOKIE_DOMAIN=.iai.one
ROOT_GOOGLE_CLIENT_ID=
ROOT_APPLE_CLIENT_ID=
```

## Redirect URIs

Register these exact callback URLs:

- Google authorized redirect URI: `https://iai.one/auth/google/callback`
- Apple return URL: `https://iai.one/auth/apple/callback`

## Current code state

The `iai.one` root app now exposes:

- `GET /login`
- `GET /auth/google/start`
- `GET /auth/apple/start`
- `GET /auth/google/callback`
- `GET|POST /auth/apple/callback`

The start routes create an HTTP-only state cookie and redirect to Google or Apple. The callback routes verify the provider state and confirm that the authorization code reached `iai.one`. Secret-backed token exchange should stay server-side and should not be committed into this repository.

## Console notes

Google requires a Web application OAuth client and an authorized redirect URI that exactly matches the URI used by the app.

Apple Sign in with Apple for the web requires a Services ID, a website return URL, and the private key material needed by the server to create the client secret JWT.
