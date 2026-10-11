# personal-site

Justin Harrison's personal site: Next.js + React + Tailwind, served as a static
site from S3 + CloudFront, with one small Python 3.13 Lambda behind `/api/*`.
Infrastructure is Terraform; deploys run on GitHub Actions.

The previous Deno Fresh version lives on the `legacy/deno` branch.

## How it fits together

```
browser ──► CloudFront ──┬─► S3 bucket          static export of the Next.js app (out/)
                         └─► /api/* ─► Lambda   Python 3.13 (api/site_api)
                                         └─► DynamoDB visits table (no expiry)
```

| Path                | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `/api/visit`        | Records a page view. Called by the site on every page view.         |
| `/api/letterboxd`   | Recent movies from Letterboxd RSS. CloudFront caches it 15 minutes. |
| `/api/admin/visits` | Newest 500 visits, for `/admin/visits?token=...`.                   |

Visitor country, region, city and IP come from CloudFront's viewer headers, the
AWS equivalent of Deno Deploy's geo headers.

## Local development

Needs Node 22+, [uv](https://docs.astral.sh/uv/) and Python 3.13.

```sh
npm install
uv sync --project api
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
```

`npm run dev` runs `next dev` and the API (`api/dev_server.py`) together; Next
proxies `/api/*` to it. Visits are kept in memory unless you run DynamoDB Local:

```sh
npm run db:up                                            # needs Docker
echo "DYNAMODB_ENDPOINT=http://localhost:8000" >> .env.local
```

The admin page is at http://localhost:3000/admin/visits?token=dev-token.

To check the production build the way CloudFront serves it:

```sh
npm run build && npm run preview
```

`npm run check` runs ESLint, ruff, the TypeScript check, Vitest and pytest.

## Environments

There are two copies of the infrastructure, built from one Terraform module
(`infra/modules/site`):

| Environment | Terraform           | GitHub environment | Deploys                                |
| ----------- | ------------------- | ------------------ | -------------------------------------- |
| staging     | `infra/envs/staging` | `staging`          | every merge to `master`, or run by hand |
| prod        | `infra/envs/prod`    | `production`       | after staging, once approved            |

Each has its own CloudFront URL, bucket, Lambda and visits table.

## First-time AWS setup

You need the AWS CLI signed in to your account and Terraform 1.10+. Everything is
in `us-east-1`.

1. **Bootstrap** (once per account): creates the Terraform state bucket and the
   GitHub OIDC provider.

   ```sh
   cd infra/bootstrap
   terraform init && terraform apply
   ```

   This folder uses local state. Keep its `terraform.tfstate` somewhere safe.

2. **Create each environment**:

   ```sh
   ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
   cd infra/envs/staging      # then repeat for infra/envs/prod
   terraform init -backend-config="bucket=personal-site-tfstate-$ACCOUNT"
   terraform apply
   terraform output           # values for the next step
   terraform output -raw admin_token
   ```

   Commit the generated `.terraform.lock.hcl` files.

3. **Configure GitHub** (Settings → Environments): create `staging` and
   `production`, and give each these variables from its `terraform output`:

   | Variable          | Output            |
   | ----------------- | ----------------- |
   | `AWS_ROLE_ARN`    | `deploy_role_arn` |
   | `SITE_BUCKET`     | `site_bucket`     |
   | `DISTRIBUTION_ID` | `distribution_id` |
   | `FUNCTION_NAME`   | `function_name`   |
   | `SITE_URL`        | `site_url`        |

   On `production`, add yourself as a required reviewer and limit deployments to
   the `master` branch. That's the approval step before prod.

4. **Deploy**: Actions → Deploy → Run workflow → `staging` deploys any branch
   to staging. After a merge to `master`, staging deploys on its own and prod
   waits for your approval.

Terraform owns the infrastructure; GitHub Actions only uploads the site, updates
the Lambda code and clears the CloudFront cache. Code changes never need a
Terraform run. The deploy role can't do anything else.

## Moving visits over from Deno KV

The old site stored visits in Deno KV with a 90-day expiry, so copy them as late
as is practical before shutting it down:

```sh
# 1. Export (uses Deno; the KV connect URL and access token are in the Deno Deploy dashboard)
DENO_KV_ACCESS_TOKEN=... deno run -A --unstable-kv \
  scripts/deno/export-kv-visits.ts <kv-connect-url> > visits.json

# 2. Import into each environment's table (safe to re-run, no duplicates)
npm run import-visits -- visits.json personal-site-prod-visits
```

If remote KV access isn't available on your Deno Deploy plan, the fallback is a
temporary token-protected route on `legacy/deno` that returns the same JSON.

`visits*.json` is gitignored since it contains IP addresses.

## Cutover checklist

1. Deploy this branch to staging and check it at its CloudFront URL.
2. Apply prod, merge to `master`, approve the prod deploy.
3. Export and import the KV visits.
4. Shut down the Deno Deploy project.

A custom domain can be added later: a Route 53 zone (~$0.50/month), an ACM
certificate in us-east-1, and `aliases` + `viewer_certificate` on the
distribution.

## Cost

At current traffic, roughly $0–1/month per environment. CloudFront's always-free
tier covers 1 TB and 10M requests a month; Lambda's covers 1M requests. The rest
is S3 storage, DynamoDB storage and requests, CloudWatch logs (kept 14 days), and
point-in-time recovery on the prod visits table, all cents at this scale.
