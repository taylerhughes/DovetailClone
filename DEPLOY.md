# Deploying to production

This is the day-to-day workflow for shipping a code change to the production
Willard environment. Production runs on **AWS ECS Fargate** behind an
**Application Load Balancer**. The database is **RDS Postgres** (pgvector
enabled), reachable from ECS tasks only via the VPC — it has no public endpoint.

## Known AWS resource IDs (eu-west-2)

| Resource | ID / ARN |
|---|---|
| Account | `692797214798` |
| ECR repo | `692797214798.dkr.ecr.eu-west-2.amazonaws.com/dovetailclone` |
| ECS cluster | `dovetailclone-cluster` |
| ECS service | `dovetailclone-service` |
| ALB DNS | `dovetailclone-alb-1069383618.eu-west-2.elb.amazonaws.com` |
| ALB ARN | `arn:aws:elasticloadbalancing:eu-west-2:692797214798:loadbalancer/app/dovetailclone-alb/353c58143d04f343` |
| Target group ARN | `arn:aws:elasticloadbalancing:eu-west-2:692797214798:targetgroup/dovetailclone-tg/1432cd7f8bb03a16` |
| ALB idle timeout | 300 seconds |
| Task definition | `dovetailclone-task` (see `infra/task-def.json`) |
| Task role | `arn:aws:iam::692797214798:role/dovetailclone-apprunner-instance` |
| Execution role | `arn:aws:iam::692797214798:role/dovetailclone-ecs-execution` |
| RDS instance | `dovetailclone-postgres` |
| RDS endpoint | `dovetailclone-postgres.crwskwqgqo14.eu-west-2.rds.amazonaws.com` |
| RDS security group | `sg-0ab2c7825c66e3e56` |
| ECS security group | `sg-07c345bcc1323af20` |
| ALB security group | `sg-0c32c067e074aa138` |
| VPC | `vpc-07b2840f3982a8f1d` |
| Subnets | `subnet-00410769000e17762`, `subnet-016d09668ab2aca99`, `subnet-01c140c1757a010be` |
| CloudWatch logs | `/ecs/dovetailclone` |
| SSM parameter path | `/dovetailclone/prod/<VAR_NAME>` |

## Prerequisites

- AWS CLI configured (`aws sts get-caller-identity` to verify).
- Docker running locally.

## 1. Verify locally before touching anything

```bash
npx prisma generate
npx tsc --noEmit
npm test
```

## 2. Check whether this change needs a migration

```bash
git diff <last-deployed-commit> -- prisma/migrations
```

If there are new migration folders, run them in step 4 before deploying the image.

## 3. Build and push the image

**Important:** ECS Fargate runs `linux/amd64`. Build with `--platform linux/amd64` on Apple Silicon.

```bash
COMMIT_SHA=$(git rev-parse --short HEAD)
ECR_URI="692797214798.dkr.ecr.eu-west-2.amazonaws.com/dovetailclone"

docker build --platform linux/amd64 -t "willard:${COMMIT_SHA}" .

aws ecr get-login-password --region eu-west-2 \
  | docker login --username AWS --password-stdin 692797214798.dkr.ecr.eu-west-2.amazonaws.com

docker tag "willard:${COMMIT_SHA}" "${ECR_URI}:${COMMIT_SHA}"
docker tag "willard:${COMMIT_SHA}" "${ECR_URI}:latest"
docker push "${ECR_URI}:${COMMIT_SHA}"
docker push "${ECR_URI}:latest"
```

## 4. Run the migration (if step 2 found one)

RDS has no public access. Temporarily open it:

```bash
aws rds modify-db-instance \
  --db-instance-identifier dovetailclone-postgres \
  --publicly-accessible --apply-immediately
aws rds wait db-instance-available --db-instance-identifier dovetailclone-postgres

MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
  --group-id sg-0ab2c7825c66e3e56 \
  --protocol tcp --port 5432 --cidr "${MY_IP}/32"

DATABASE_URL="postgresql://<user>:<pass>@dovetailclone-postgres.crwskwqgqo14.eu-west-2.rds.amazonaws.com:5432/willard" \
  npx prisma migrate deploy

aws ec2 revoke-security-group-ingress \
  --group-id sg-0ab2c7825c66e3e56 \
  --protocol tcp --port 5432 --cidr "${MY_IP}/32"
aws rds modify-db-instance \
  --db-instance-identifier dovetailclone-postgres \
  --no-publicly-accessible --apply-immediately
```

## 5. Deploy the new image

Update `infra/task-def.json` with the new `image` tag, then:

```bash
COMMIT_SHA=$(git rev-parse --short HEAD)
ECR_URI="692797214798.dkr.ecr.eu-west-2.amazonaws.com/dovetailclone"

# Register new task definition revision
sed "s|dovetailclone:latest|dovetailclone:${COMMIT_SHA}|" infra/task-def.json \
  | aws ecs register-task-definition --cli-input-json file:///dev/stdin --region eu-west-2 \
  --query 'taskDefinition.taskDefinitionArn' --output text

# Update service
aws ecs update-service \
  --cluster dovetailclone-cluster \
  --service dovetailclone-service \
  --task-definition dovetailclone-task \
  --region eu-west-2

# Wait for stable
aws ecs wait services-stable \
  --cluster dovetailclone-cluster \
  --services dovetailclone-service \
  --region eu-west-2 && echo "DEPLOYED"
```

## 6. Smoke-test

```bash
curl -s -o /dev/null -w "%{http_code}" \
  http://dovetailclone-alb-1069383618.eu-west-2.elb.amazonaws.com/
```

## 7. Tail logs

```bash
aws logs tail /ecs/dovetailclone --region eu-west-2 --follow

# Filter to specific feature
aws logs tail /ecs/dovetailclone --region eu-west-2 --follow --filter-pattern "[summarize]"
```

## Rolling back

Point the service at the previous task definition revision:

```bash
aws ecs update-service \
  --cluster dovetailclone-cluster \
  --service dovetailclone-service \
  --task-definition dovetailclone-task:<previous-revision> \
  --region eu-west-2
```

Migration rollbacks require manual SQL — keep migrations additive (new columns, not renames/drops).

## Troubleshooting

- **New task exits immediately** — `aws logs tail /ecs/dovetailclone --follow` to see the crash.
- **Target unhealthy in ALB** — check logs first. If zero app logs, likely image architecture mismatch (build without `--platform linux/amd64`).
- **Database connection refused** — ECS security group `sg-07c345bcc1323af20` must have an ingress rule to RDS security group `sg-0ab2c7825c66e3e56` on port 5432.
- **AI calls 502ing** — ALB idle timeout is 300s. If calls exceed that, increase it: `aws elbv2 modify-load-balancer-attributes --load-balancer-arn <alb-arn> --attributes Key=idle_timeout.timeout_seconds,Value=600`.
- **Emails not arriving** — check SES sandbox mode: `aws sesv2 get-account`.
