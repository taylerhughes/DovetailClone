# Deploying to production

This is the day-to-day workflow for shipping a code change to the production
Willard environment. It assumes the one-time AWS provisioning (VPC, RDS with
pgvector, S3, IAM, SES, App Runner service, secrets) is already done — this
doc is about pushing a *new build* of an already-running service, not
standing the environment up from scratch.

Production runs on **AWS App Runner**, pulling a container image from
**ECR**. The database is **RDS Postgres** (pgvector enabled), reachable from
App Runner only via a VPC Connector — it has no public endpoint.

## Prerequisites

- AWS CLI configured with credentials that can push to ECR and manage the
  App Runner service (`aws sts get-caller-identity` to sanity-check).
- Docker running locally.
- The following noted somewhere handy (from the initial AWS setup):
  - `<account-id>`, `<region>`, `<ecr-repo-uri>`
  - The App Runner service's ARN or name
  - The RDS endpoint and master credentials (or wherever `DATABASE_URL` is
    stored — Secrets Manager / Parameter Store)

## 1. Verify locally before touching anything

```bash
npx tsc --noEmit
npm test
npm run test:e2e
```

Don't push a build that hasn't passed these. There's no staging environment
in front of production yet, so this is the only gate.

## 2. Check whether this change needs a migration

```bash
git diff <last-deployed-tag-or-commit> -- prisma/migrations
```

If there are new migration folders, note that — you'll run them against the
production database in step 4, before traffic hits the new image. If a
migration touches a table with a `searchVector` (tsvector) or `embedding`
(vector) column, re-read the note in `prisma/migrations/` for that migration
— Prisma's diff engine has a known history of emitting bogus
`DROP INDEX`/`DROP DEFAULT` statements against those columns, and the
hand-corrected SQL already committed there is what actually needs to run,
not a fresh `prisma migrate dev` diff.

## 3. Build and push the image

```bash
docker build -t willard:$(git rev-parse --short HEAD) .

aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

docker tag willard:$(git rev-parse --short HEAD) <ecr-repo-uri>:$(git rev-parse --short HEAD)
docker tag willard:$(git rev-parse --short HEAD) <ecr-repo-uri>:latest

docker push <ecr-repo-uri>:$(git rev-parse --short HEAD)
docker push <ecr-repo-uri>:latest
```

Tag with the commit SHA (not just `latest`) so a bad deploy has an
unambiguous previous image to roll back to.

## 4. Run the migration, if step 2 found one

RDS has no public access, so your machine can't reach it directly — only
the App Runner service can, through the VPC connector. The straightforward
path (same one used for the initial migration) is a temporary, scoped
security-group opening:

```bash
# Add a rule for your current IP only, run the migration, then remove it
MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
  --group-id <rds-security-group-id> \
  --protocol tcp --port 5432 --cidr "${MY_IP}/32"

DATABASE_URL="postgresql://<user>:<pass>@<rds-endpoint>:5432/willard" \
  npx prisma migrate deploy

aws ec2 revoke-security-group-ingress \
  --group-id <rds-security-group-id> \
  --protocol tcp --port 5432 --cidr "${MY_IP}/32"
```

`migrate deploy` only applies already-committed SQL files in order — it
never regenerates them, so this is safe to run against a database that
already has other migrations applied.

If you're deploying often enough that opening/closing the security group
each time gets old, the cleaner long-term fix is a small bastion host (or
an SSM Session Manager port-forward through one) sitting in the same VPC,
so migrations run through a stable, always-present path instead of a
temporary rule — worth setting up once deploys become routine rather than
occasional.

## 5. Deploy the new image

If the App Runner service has auto-deploy enabled, pushing `:latest` (step
3) is enough — it picks up the new image automatically. Otherwise trigger
it explicitly:

```bash
aws apprunner start-deployment --service-arn <service-arn>
```

Watch it roll out:

```bash
aws apprunner describe-service --service-arn <service-arn> \
  --query 'Service.Status'
```

Wait for `RUNNING`. App Runner keeps the previous version serving traffic
until the new one passes its health check, so a bad image fails without
causing a visible outage.

## 6. Smoke-test production

- Load the production URL, confirm the page renders and you can sign in.
- If step 4 ran a migration, exercise whatever it touched (e.g. a new
  field, a new AI feature) directly rather than trusting the deploy alone.
- Check CloudWatch logs for the service if anything looks off:

```bash
aws logs tail /aws/apprunner/<service-name>/<service-id>/application --follow
```

## Rolling back

Because every image was pushed tagged with its commit SHA (step 3), rolling
back is: point the App Runner service at the previous tag and redeploy.

```bash
aws apprunner update-service \
  --service-arn <service-arn> \
  --source-configuration ImageRepository="{ImageIdentifier=<ecr-repo-uri>:<previous-sha>,...}"
```

If the bad deploy included a migration, rolling back the app image does
**not** undo the migration — Prisma migrations aren't automatically
reversible. Rolling back a schema change means hand-writing and running a
down-migration; there is no `prisma migrate down` command. This is the
main reason to keep migrations backward-compatible with the previous app
version whenever possible (additive columns, not renames/drops, in the same
deploy that starts using them).

## Updating secrets / environment variables

Env vars live in Secrets Manager / Parameter Store and are referenced by
the App Runner service configuration, not baked into the image. Changing
one (e.g. rotating `BETTER_AUTH_SECRET`, adding a new API key) requires an
App Runner service update, which triggers a redeploy of the *current* image
with the new environment — no new image build needed:

```bash
aws apprunner update-service \
  --service-arn <service-arn> \
  --source-configuration <updated environment config>
```

## Troubleshooting

- **New deploy stuck / fails health check, old version still serving** —
  check the CloudWatch log group above for a stack trace before anything
  else; App Runner's own console error is usually just "health check
  failed," not the actual cause.
- **Connection refused / timeout talking to Postgres** — almost always the
  VPC connector missing or pointed at the wrong security group, not a
  credentials problem.
- **Emails silently not arriving** — check whether the SES account is still
  in sandbox mode (`aws sesv2 get-account`) before assuming the app is
  broken; sandbox SES only delivers to individually-verified addresses.
