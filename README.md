# Let's Trade ZM — Static Frontend

A mobile-first static prototype for Let's Trade ZM.

## Pages

- `index.html` — landing page and price list
- `signup.html` — instant 5-step signup flow
- `login.html` — phone/email + 4-digit customer code
- `dashboard.html` — customer dashboard
- `admin.html` — admin portal UI

## Important

This version is intentionally **100% static** and requires no server.

It uses `localStorage` only to demonstrate the signup → login → dashboard flow in a browser.

It is **not production authentication** and should not be used to store real customer data or passwords.

## GitHub Pages

1. Create a GitHub repository.
2. Upload all files while preserving the folders.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save.
7. Open the generated GitHub Pages address.

The project has no build step and no npm installation.

## Next production layer

Replace the localStorage calls with an API/backend and database. Then add:

- real customer records
- secure authentication/session tokens
- payment verification
- admin authentication
- price-list CRUD
- subscription assignment
- expiry tracking
- customer notifications
