# bashgala — next steps

Pick up from here. Everything is built. This is just wiring it to live infrastructure.

---

## 1. Supabase — database + auth + storage

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the full contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → create a bucket named `media`, set it to **public**
4. Go to **Authentication → Providers** → confirm Email is enabled, turn on **Magic Link**
5. Copy your project's **URL** and **anon public key** from Settings → API

---

## 2. Local env

Create a `.env` file at the root (it's gitignored):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Test the build locally:

```bash
source .env && node build.js
npx serve dist
```

Visit `http://localhost:3000` — feed should load (empty). Visit `http://localhost:3000/bash` — login screen should appear.

---

## 3. Deploy Edge Functions

Install Supabase CLI if needed:

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref your-project-ref
```

Deploy all five functions:

```bash
supabase functions deploy create-post
supabase functions deploy update-post
supabase functions deploy upload-image
supabase functions deploy publish-post
supabase functions deploy delete-post
```

---

## 4. DigitalOcean App Platform

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) → **Create App**
2. Connect the `bashgala` GitHub repo, branch `main`
3. Set source dir to `/`, build command to `node build.js`, output dir to `dist`
4. Add two **build-time** environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Deploy

---

## 5. Domain

In your domain registrar (wherever `bashgala.com` is registered):
- Point DNS to DigitalOcean — they'll give you a CNAME or A record during app setup
- Add the custom domain in the DigitalOcean app settings
- SSL is automatic

---

## 6. First login

1. Visit `bashgala.com/bash`
2. Enter your email (shelton@empathylab.io)
3. Click the magic link from your inbox
4. Post the first thing Bash has to say

---

## Later (not now)

- Add an About page if it earns its place
- Supabase RLS policy for write operations (currently handled by Edge Function auth, but worth tightening)
- `supabase/functions/_shared/auth.ts` helper to deduplicate auth check across functions
- Tag index page at `/t` if you want to surface the full taxonomy
- Open Graph meta tags for posts if sharing ever matters
