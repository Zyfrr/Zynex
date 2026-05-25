# ZyNex Backend AWS Deployment and CI/CD Guide

This guide deploys `apps/ZyNexAPI01` with:

```txt
GitHub Actions -> Amazon ECR -> Amazon ECS Express Mode -> Amazon RDS PostgreSQL
```

App Runner is no longer the recommended path for new AWS customers. AWS now recommends **Amazon ECS Express Mode** for simple containerized web apps and APIs. ECS Express Mode requires a container image, a task execution role, and an infrastructure role, then provisions the Fargate service, load balancer, TLS endpoint, scaling, monitoring, and networking defaults for you.

Backend health check:

```txt
/api/v1/health/ZyNexAPI01HealthCheck
```

## Current Status

You already created:

```txt
ECR repository: zynex-api
```

Next you need:

1. RDS PostgreSQL database.
2. ECS task execution role.
3. ECS infrastructure role for Express services.
4. First Docker image pushed to ECR.
5. ECS Express Mode service created from that image.
6. GitHub Actions secrets added.
7. CI/CD workflow run.

## 1. Create Amazon RDS PostgreSQL

1. AWS Console -> search `RDS`.
2. Click `Create database`.
3. Choose `Standard create`.
4. Engine: `PostgreSQL`.
5. Template: `Free tier` for testing or `Dev/Test`.
6. DB instance identifier:

```txt
zynex-postgres
```

7. Master username:

```txt
zynex
```

8. Save the password securely.
9. Initial database name:

```txt
zynex
```

10. For first deployment, choose public access only if you need GitHub Actions/local migrations to reach it. Later, lock it down to VPC/security groups.
11. Create database.

After creation, copy:

```txt
RDS -> Databases -> zynex-postgres -> Connectivity & security -> Endpoint
```

Your `DATABASE_URL`:

```txt
postgresql://zynex:<PASSWORD>@<RDS_ENDPOINT>:5432/zynex
```

## 2. Create ECS Express IAM Roles

ECS Express Mode requires two roles:

```txt
ecsTaskExecutionRole
ecsInfrastructureRoleForExpressServices
```

### Option A: AWS Console

Task execution role:

1. AWS Console -> IAM -> Roles -> Create role.
2. Trusted entity: AWS service.
3. Service: Elastic Container Service.
4. Use case: Elastic Container Service Task.
5. Attach policy:

```txt
AmazonECSTaskExecutionRolePolicy
```

6. Role name:

```txt
ecsTaskExecutionRole
```

Infrastructure role:

1. IAM -> Roles -> Create role.
2. Trusted entity: Custom trust policy.
3. Use this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

4. Attach policy:

```txt
AmazonECSInfrastructureRoleforExpressGatewayServices
```

5. Role name:

```txt
ecsInfrastructureRoleForExpressServices
```

Copy both role ARNs from IAM role details:

```txt
ECS_TASK_EXECUTION_ROLE_ARN
ECS_INFRASTRUCTURE_ROLE_ARN
```

### Option B: AWS CLI

```bash
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"ecs-tasks.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam create-role \
  --role-name ecsInfrastructureRoleForExpressServices \
  --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"ecs.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"

aws iam attach-role-policy \
  --role-name ecsInfrastructureRoleForExpressServices \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices
```

## 3. Push First Image To ECR

You already created:

```txt
zynex-api
```

Get your AWS account ID:

```bash
aws sts get-caller-identity --query Account --output text
```

Login to ECR:

```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
```

Build image:

```bash
docker build -f Dockerfile.api -t zynex-api .
```

Tag image:

```bash
docker tag zynex-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/zynex-api:initial
```

Push image:

```bash
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/zynex-api:initial
```

Your first image URI:

```txt
<AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/zynex-api:initial
```

## 4. Create ECS Express Mode Service

Use AWS Console or CLI.

### Console

1. AWS Console -> ECS.
2. Create service/application with Express Mode.
3. Container image:

```txt
<AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/zynex-api:initial
```

4. Container port:

```txt
4101
```

5. Task execution role:

```txt
ecsTaskExecutionRole
```

6. Infrastructure role:

```txt
ecsInfrastructureRoleForExpressServices
```

7. Health check path:

```txt
/api/v1/health/ZyNexAPI01HealthCheck
```

8. Environment variables:

```env
NODE_ENV=production
ZYNEX_API_PORT=4101
DATABASE_URL=postgresql://zynex:<PASSWORD>@<RDS_ENDPOINT>:5432/zynex
ZYNEX_JWT_SECRET=<LONG_RANDOM_SECRET>
NEXTAUTH_SECRET=<LONG_RANDOM_SECRET>
ZYNEX_COOKIE_DOMAIN=.zyfrr.com
SPACESHIP_SMTP_HOST=<SPACESHIP_SMTP_HOST>
SPACESHIP_SMTP_PORT=587
SPACESHIP_SMTP_USER=support@zyfrr.com
SPACESHIP_SMTP_PASS=<SPACESHIP_EMAIL_PASSWORD>
ZYNEX_SUPPORT_EMAIL=support@zyfrr.com
TWILIO_ACCOUNT_SID=<OPTIONAL>
TWILIO_AUTH_TOKEN=<OPTIONAL>
TWILIO_FROM_PHONE=<OPTIONAL>
```

9. Create service.
10. Copy the service ARN:

```txt
ECS_EXPRESS_SERVICE_ARN
```

11. Copy the public URL returned by ECS Express Mode and test:

```txt
https://<ECS_EXPRESS_URL>/api/v1/health/ZyNexAPI01HealthCheck
```

### CLI

```bash
aws ecs create-express-gateway-service \
  --service-name zynex-api \
  --execution-role-arn <ECS_TASK_EXECUTION_ROLE_ARN> \
  --infrastructure-role-arn <ECS_INFRASTRUCTURE_ROLE_ARN> \
  --health-check-path "/api/v1/health/ZyNexAPI01HealthCheck" \
  --primary-container "image=<AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/zynex-api:initial,containerPort=4101"
```

## 5. Create IAM User For GitHub Actions

1. AWS Console -> IAM.
2. Users -> Create user.
3. Username:

```txt
github-zynex-deployer
```

4. Attach policies for first setup:

```txt
AmazonEC2ContainerRegistryPowerUser
AmazonECS_FullAccess
AmazonRDSFullAccess
```

For production, replace these with least-privilege custom policies.

5. Open user -> Security credentials.
6. Create access key.
7. Use case: Command Line Interface.
8. Copy:

```txt
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## 6. Add GitHub Secrets

GitHub repo:

```txt
Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

```env
AWS_ACCESS_KEY_ID=<IAM_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<IAM_SECRET_KEY>
AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=<YOUR_ACCOUNT_ID>
ECR_REPOSITORY=zynex-api
ECS_EXPRESS_SERVICE_ARN=<FROM_ECS_EXPRESS_SERVICE>
ECS_TASK_EXECUTION_ROLE_ARN=<FROM_IAM_ROLE>
DATABASE_URL=postgresql://zynex:<PASSWORD>@<RDS_ENDPOINT>:5432/zynex
```

## 7. CI/CD Workflow

Workflow:

```txt
.github/workflows/deploy-api.yml
```

It does:

1. Checkout code.
2. Configure AWS credentials.
3. Login to ECR.
4. Build Docker image.
5. Push image to ECR.
6. Run Prisma migrations.
7. Update ECS Express service with the new image.

Run it:

```txt
GitHub -> Actions -> Deploy ZyNex API to ECS Express -> Run workflow
```

## 8. Connect Frontend

In Vercel:

```env
NEXT_PUBLIC_ZYNEX_API_URL=https://<ECS_EXPRESS_URL>
```

If you later add custom domain:

```env
NEXT_PUBLIC_ZYNEX_API_URL=https://api.zynex.zyfrr.com
```

Redeploy frontend.

## References

- Amazon ECS Express Mode requires a container image, task execution role, and infrastructure role.
- ECS Express Mode creates Fargate service infrastructure, URL, load balancer, TLS, autoscaling, monitoring, and networking.
- `aws ecs create-express-gateway-service` creates the Express service.
- `aws ecs update-express-gateway-service` updates an existing Express service with a new container image.
