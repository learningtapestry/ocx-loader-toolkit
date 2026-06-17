# Canvas admin OAuth2 setup

This guide covers creating a **reusable** Canvas export destination for the logged-in **Export Bundle** flow (admin bundle screen, visible only to logged in users under ./bundles). It uses OAuth2 with refresh tokens (`canvas-oauth2`), so you do not need to paste or rotate access tokens manually.

For the public teacher export flow (public bundle URL), see the README section on Canvas developer keys — that flow uses a different callback URL.

## Prerequisites

1. **App running** and reachable at the URL Canvas will redirect to (localhost on the same machine, or a tunnel such as Cloudflare)
2. **Logged-in user** in the toolkit at that same URL (the callback associates the destination with your user)
3. **Canvas Instance** registered in `/admin` → Configuration → Canvas Instance (Client ID, Client Secret, Canvas base URL)
4. **Canvas developer key** with a redirect URI that matches your setup (see below)

## OAuth callback URLs

The toolkit exposes two OAuth callbacks. They are **not interchangeable**.

| Callback path | Used for |
|---------------|----------|
| `/api/canvas-oauth-callback` | **Admin** — permanent export destinations (this guide) |
| `/api/canvas-oauth-export-callback` | **Public** — one-off teacher export from a public bundle link |

For admin setup, register this redirect URI on your Canvas developer key:

```
{TOOLKIT_BASE_URL}/api/canvas-oauth-callback
```

Examples:

- Local: `http://localhost:3000/api/canvas-oauth-callback`
- Tunnel: `https://your-subdomain.trycloudflare.com/api/canvas-oauth-callback`

The host, port, and path must match **exactly** in:

1. The Canvas developer key
2. The OAuth link you open
3. The token exchange performed by the app

If you also use public exports, add the export-callback URI as a **second** redirect URI on the same developer key.

## Step 1 — Register the Canvas Instance

In Canvas: **Admin → Developer Keys → + Developer Key**

- **Redirect URIs:** `{TOOLKIT_BASE_URL}/api/canvas-oauth-callback`
- Note the **Client ID** and **Client Secret**

In the toolkit: **`/admin`** → **Canvas Instance**

- **Name:** any label you will recognize
- **Base URL:** your Canvas URL (e.g. `https://yourschool.instructure.com`)
- **Client ID / Client Secret:** from the developer key

## Step 2 — List Canvas instances (optional)

```bash
yarn connect:canvas-oauth -- --list
```

Note the `id` for the instance you created.

## Step 3 — Generate the OAuth link

Run the helper script with your toolkit base URL and callback path.

```bash
yarn connect:canvas-oauth -- \
  --canvas-instance-id <id> \
  --name "My Canvas Export" \
  --toolkit-url http://<your-accessible-url-from-Canvas> \
  --callback-path /api/canvas-oauth-callback
```

### Script options

| Option | Description |
|--------|-------------|
| `--list` | List Canvas Instance ids in the database |
| `--canvas-instance-id <id>` | Canvas Instance from `/admin` |
| `--name <name>` | Export destination name (shown in the dropdown) |
| `--toolkit-url <url>` | Toolkit base URL Canvas redirects to (no trailing slash) |
| `--callback-path <path>` | Must match the developer key (default: `/api/canvas-oauth-export-callback`; use `/api/canvas-oauth-callback` for admin) |
| `--with-scopes` | Include API scopes in the OAuth URL (usually not required) |

Environment: loads `.env.local` then `.env` (needs `DATABASE_URL`).

Optional: set `TOOLKIT_URL` in env instead of passing `--toolkit-url`.

## Step 4 — Authorize in Canvas

Before opening the printed URL:

1. Confirm the app is running at `--toolkit-url`
2. **Log in** at that same URL in the browser you will use
3. Open the OAuth URL printed by the script
4. Approve access in Canvas

On success, the app creates a `canvas-oauth2` export destination. You may be redirected to `/export-destinations/{id}` (that page may not exist yet); verify the record in **`/admin` → Export Destination**.

## Step 5 — Export a bundle

1. Open a bundle with `importStatus: completed` at `/bundles/:id`
2. Click **Export Bundle**
3. Select your new destination from the dropdown
4. Ensure `yarn worker` is running while the export runs

## Troubleshooting

### Destination missing from the dropdown

The dropdown only lists destinations with type `canvas` or `canvas-oauth2`. Check **`/admin` → Export Destination** — type must be exactly `canvas-oauth2`, not a manual label like `Canvas`.

### Canvas rejects the OAuth request (`redirect_uri` mismatch)

The redirect URI in the OAuth link must match the developer key character-for-character (scheme, host, port, path). Re-run the script with the correct `--toolkit-url` and `--callback-path`.

### OAuth succeeds but no destination created

You must be logged in at the same `--toolkit-url` before opening the OAuth link. The callback requires an authenticated session.

### Token exchange fails after Canvas approval

The app exchanges the authorization code using the same redirect URI as the OAuth link. Ensure `--callback-path` matches the path registered on the developer key and used in the script output.

### When to re-authorize

Re-run the OAuth script if the refresh token is revoked, the developer key is rotated, or Canvas admin removes app access.

## Related

- Static token destinations (`canvas` type) can be created manually in `/admin` but require manual token updates.
- Public bundle export OAuth is documented in the main README under **OCX-LOADER-TOOLKIT → Canvas LMS Instances**.
