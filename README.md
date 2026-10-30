# personal-site

Justin Harrison's personal site: Next.js + React + Tailwind, built as a static
site and served by Cloudflare Workers, with a small Python Worker behind
`/api/*` and visits stored in Cloudflare D1. Infrastructure is Terraform;
deploys run on GitHub Actions.

The previous Deno Fresh version lives on the `legacy/deno` branch.

## How it fits together

```
browser ──► Cloudflare Worker ──┬─► static assets      Next.js export (out/), served without running the Worker
            (*.workers.dev)     └─► /api/* ─► Python    api/src (Python Worker)
                                               └─► D1    visits (no expiry) + Letterboxd cache
```

| Path                | What it does                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `/api/visit`        | Records a page view. Called by the site on every page view.          |
| `/api/letterboxd`   | Recent movies from Letterboxd RSS, cached 15 minutes in D1.          |
| `/api/admin/visits` | Newest 500 visits, for `/admin/visits?token=...`.                    |

Visitor country, region and city come from Cloudflare's `request.cf`, and the
IP from `CF-Connecting-IP`, the equivalents of Deno Deploy's geo headers.

Everything in one Worker means one URL per environment and nothing to keep in
sync between a static host and an API host.

## Local development

Needs Node 22+, [uv](https://docs.astral.sh/uv/) and Python 3.13.

```sh
npm install
uv sync --project api
cp .dev.vars.example .dev.vars   # optional, sets the local admin token
npm run dev                      # http://localhost:3000
```

`npm run dev` runs `next dev` and `wrangler dev` together; Next proxies `/api/*`
to the Python Worker on port 8787. The Worker uses a local D1 database (SQLite
under `.wrangler/`), created and migrated on startup, so visits persist between
runs. Wrangler downloads the Python runtime the first time.

The admin page is at http://localhost:3000/admin/visits?token=dev-token.

To check the production build the way Cloudflare serves it (static assets and
the Worker together, on one port):

```sh
npm run preview   # http://localhost:3000
```

`npm run check` runs ESLint, ruff, the TypeScript check, pytest, the build, and a
dry-run bundle of the Worker.

## Environments

There are two copies of the infrastructure, built from one Terraform module
(`infra/modules/site`):

| Environment | Terraform            | Worker                  | GitHub environment | Deploys                                 |
| ----------- | -------------------- | ----------------------- | ------------------ | --------------------------------------- |
| staging     | `infra/envs/staging` | `personal-site-staging` | `staging`          | every merge to `master`, or run by hand |
| prod        | `infra/envs/prod`    | `personal-site`         | `production`       | after staging, once approved            |

Each has its own `workers.dev` URL, D1 database and admin token.

Terraform owns the D1 databases, the admin tokens, the state bucket and the
deploy token. GitHub Actions deploys the Worker code and static files with
wrangler (from `wrangler.jsonc`) and applies D1 migrations, so code changes
never need a Terraform run.

## First-time Cloudflare setup

You need a Cloudflare account with a `workers.dev` subdomain (Workers & Pages
in the dashboard picks one the first time you open it) and Terraform 1.10+.

1. **Make a token for Terraform** (My Profile → API Tokens → Create Custom
   Token) with these account permissions: *Account API Tokens: Edit*, *D1: Edit*,
   *Workers R2 Storage: Edit*. Then:

   ```sh
   export CLOUDFLARE_API_TOKEN=...
   export TF_VAR_account_id=...      # Workers & Pages → Account details
   ```

2. **Bootstrap** (once per account): creates the R2 bucket for Terraform state
   and the token GitHub Actions deploys with.

   ```sh
   cd infra/bootstrap
   terraform init && terraform apply
   terraform output -raw github_deploy_token
   ```

   This folder uses local state. Keep its `terraform.tfstate` somewhere safe.
   R2 is free at this size, but Cloudflare asks for a payment method before the
   first bucket.

3. **Make an R2 token for the state bucket** (R2 → Manage API tokens → Object
   Read & Write, limited to `personal-site-tfstate`), then:

   ```sh
   export AWS_ACCESS_KEY_ID=...        # the R2 token's access key id
   export AWS_SECRET_ACCESS_KEY=...    # and secret
   export AWS_ENDPOINT_URL_S3=https://$TF_VAR_account_id.r2.cloudflarestorage.com
   ```

   (These are the names Terraform's S3 backend reads; R2 speaks the S3 API.)

4. **Create each environment**:

   ```sh
   cd infra/envs/staging      # then repeat for infra/envs/prod
   terraform init && terraform apply
   terraform output database_id
   terraform output -raw admin_token
   ```

   Commit the generated `.terraform.lock.hcl` files.

5. **Point wrangler at the databases**: put each `database_id` into
   `env.staging` and `env.production` in `wrangler.jsonc` and commit it. (IDs
   aren't secret.)

6. **Configure GitHub** (Settings → Secrets and variables → Actions):

   | Where                                | Name                    | Value                                    |
   | ------------------------------------ | ----------------------- | ---------------------------------------- |
   | Repository secret                    | `CLOUDFLARE_API_TOKEN`  | bootstrap `github_deploy_token`          |
   | Repository variable                  | `CLOUDFLARE_ACCOUNT_ID` | your account id                          |
   | `staging` environment secret         | `ADMIN_TOKEN`           | staging `admin_token`                    |
   | `production` environment secret      | `ADMIN_TOKEN`           | prod `admin_token`                       |

   On `production`, add yourself as a required reviewer and limit deployments to
   the `master` branch. That's the approval step before prod.

7. **Deploy**: Actions → Deploy → Run workflow → `staging` deploys any branch
   to staging. After a merge to `master`, staging deploys on its own and prod
   waits for your approval. The workflow prints each environment's URL.

## Moving visits over from Deno KV

The old site stored visits in Deno KV with a 90-day expiry, so copy them as late
as is practical before shutting it down:

```sh
# 1. Export (uses Deno; the KV connect URL and access token are in the Deno Deploy dashboard)
DENO_KV_ACCESS_TOKEN=... deno run -A --unstable-kv \
  scripts/deno/export-kv-visits.ts <kv-connect-url> > visits.json

# 2. Turn it into SQL, keeping the original timestamps and KV ids
npm run import-visits -- visits.json > visits.sql

# 3. Load it (safe to re-run: same ids overwrite, no duplicates)
npx wrangler d1 execute DB --remote --env production --file visits.sql
```

Step 3 uses your own `wrangler login`. If remote KV access isn't available on
your Deno Deploy plan, the fallback is a temporary token-protected route on
`legacy/deno` that returns the same JSON.

`visits*.json` and `visits*.sql` are gitignored since they contain IP addresses.

## Cutover checklist

1. Deploy this branch to staging and check it at its `workers.dev` URL.
2. Apply prod, merge to `master`, approve the prod deploy.
3. Export and import the KV visits.
4. Shut down the Deno Deploy project.

A custom domain can be added later by moving its DNS to Cloudflare (free plan)
and adding a `routes` entry with `custom_domain: true` to the production
environment in `wrangler.jsonc`.

## Cost

$0 at current traffic, on the Workers free plan:

- Static asset requests are free and unlimited.
- Worker requests (`/api/*` only): 100,000 a day free.
- D1: 5 GB storage, 5 million rows read and 100,000 rows written a day free.
  Each visit is one row written.
- R2 (Terraform state only): 10 GB free.

If traffic ever outgrows that, the Workers paid plan is $5/month and covers all
of it with lots of room.
