# Infrastructure

The infrastructure is defined using Terraform to provision a three-tier application on Google Cloud Platform (GCP).

## Technology Stack

- **Infrastructure as Code:** Terraform 1.5+
- **Cloud Provider:** Google Cloud Platform
- **State Backend:** Google Cloud Storage (GCS)

## Architecture Overview

The Terraform configuration provisions:

```
┌─────────────────────────────────────────────────┐
│           VPC Network (10.0.0.0/24)             │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │ Cloud Run:   │    │ Cloud SQL:           │  │
│  │ Web (public) │───▶│ PostgreSQL 17        │  │
│  │ Port 3000    │    │ (private IP)         │  │
│  └──────────────┘    └──────────────────────┘  │
│         ▲                     ▲                 │
│         │                     │                 │
│  ┌──────────────┐            │                 │
│  │ Cloud Run:   │────────────┘                 │
│  │ API (internal)                              │
│  │ Port 3001    │                              │
│  └──────────────┘                              │
│         ▲                                       │
│         │                                       │
│  ┌─────────────────────────────────────────┐   │
│  │ VPC Access Connector (10.0.1.0/28)      │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
         │
         │ (public)
         │
      Internet
```

## Components

### Networking

- **VPC Network:** Custom VPC with private subnets
- **Subnet:** 10.0.0.0/24 (primary)
- **VPC Access Connector:** 10.0.1.0/28 (allows Cloud Run to reach VPC resources)
- **Private Services Peering:** Enables private connectivity to Cloud SQL

### Cloud SQL

- **Database Engine:** PostgreSQL 17
- **Availability:** ZONAL (dev/staging) or REGIONAL with backups (prod)
- **Storage:** SSD with auto-resize enabled
- **Authentication:** Username/password stored in Secret Manager
- **Connection:** Private IP only (not exposed to internet)
- **Backups:** Enabled in production (daily at 03:00 UTC)
- **Deletion Protection:** Enabled in production

### Cloud Run Services

#### Web Frontend

- **Image:** User-provided `web_image` variable
- **Port:** 3000
- **Ingress:** Public (receives traffic from internet)
- **Scaling:** 0-10 instances (1 minimum in prod)
- **Environment:** Receives `API_URL` pointing to internal API service
- **Health Check:** Startup probe on `/` path

#### API

- **Image:** User-provided `api_image` variable
- **Port:** 3001
- **Ingress:** Internal (receives traffic only from VPC/Cloud Run)
- **Scaling:** 0-10 instances (1 minimum in prod)
- **Environment:** Receives `DATABASE_URL` from Secret Manager
- **Health Check:** Startup and liveness probes on `/health` path

### Identity and Access

- **Service Account:** Shared by API and Web services
- **Permissions:**
  - `roles/cloudsql.client` — Connect to Cloud SQL
  - `roles/secretmanager.secretAccessor` — Read database URL from Secret Manager
  - `roles/run.invoker` (for web service) — Invoke API service

### Secrets

- **Secret ID:** `{app_name}-{environment}-db-url`
- **Value:** Full PostgreSQL connection string (username, password, host, port, database)
- **Rotation:** Manual (update via Terraform apply)
- **Replication:** Automatic within GCP region

## Deployment

### Prerequisites

1. **GCP Project:** Create a project and enable required APIs:
   - Cloud Run
   - Cloud SQL
   - Secret Manager
   - Compute Engine (for VPC)
   - Service Networking

2. **Terraform Backend:** Create a GCS bucket for state storage:
   ```bash
   gsutil mb gs://my-terraform-state
   ```

3. **Container Images:** Build and push Docker images to Container Registry:
   ```bash
   docker build -t gcr.io/my-project/api:latest src/api/
   docker push gcr.io/my-project/api:latest

   docker build -t gcr.io/my-project/web:latest src/web/
   docker push gcr.io/my-project/web:latest

   docker build -t gcr.io/my-project/db:latest src/db/
   docker push gcr.io/my-project/db:latest
   ```

4. **Database Migrations:** Run the migration job after first deployment:
   ```bash
   gcloud run jobs execute {app_name}-{environment}-migrate --region={region}
   ```

### Terraform Commands

Initialize Terraform with backend configuration:
```bash
cd src/infrastructure

terraform init \
  -backend-config="bucket=my-terraform-state" \
  -backend-config="prefix=terraform/my-app"
```

Plan the deployment:
```bash
terraform plan \
  -var="project_id=my-project" \
  -var="api_image=gcr.io/my-project/api:latest" \
  -var="web_image=gcr.io/my-project/web:latest"
```

Apply the configuration:
```bash
terraform apply \
  -var="project_id=my-project" \
  -var="api_image=gcr.io/my-project/api:latest" \
  -var="web_image=gcr.io/my-project/web:latest" \
  -var="environment=prod"
```

Get outputs:
```bash
terraform output web_url
terraform output api_url
```

### Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `project_id` | ✓ | — | GCP project ID |
| `region` | | `us-central1` | GCP region |
| `app_name` | | `todo` | Prefix for resource names |
| `environment` | | `dev` | Deployment environment (dev/staging/prod) |
| `subnet_cidr` | | `10.0.0.0/24` | VPC subnet CIDR |
| `connector_cidr` | | `10.0.1.0/28` | VPC Access Connector CIDR (must not overlap subnet_cidr) |
| `db_tier` | | `db-f1-micro` | Cloud SQL machine tier |
| `api_image` | ✓ | — | API container image URI |
| `web_image` | ✓ | — | Web frontend container image URI |
| `api_max_instances` | | `10` | Max Cloud Run instances for API |
| `web_max_instances` | | `10` | Max Cloud Run instances for web |

### Environment-Specific Behavior

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| Database availability | ZONAL | ZONAL | REGIONAL |
| Database backups | Disabled | Disabled | Daily |
| Min instances | 0 | 0 | 1 |
| Deletion protection | Disabled | Disabled | Enabled |

## Outputs

After `terraform apply`, retrieve outputs with:

```bash
terraform output web_url          # Public URL of web frontend
terraform output api_url          # Internal URL of API
terraform output db_private_ip    # Private IP of Cloud SQL
terraform output service_account_email  # Service account email
```

## Database Migrations in Production

Create a one-off Cloud Run Job to run migrations (defined in `migration.tf`):

```bash
cd src/infrastructure

terraform apply -var="db_image=gcr.io/my-project/db:latest" ...

# Run the migration job
gcloud run jobs execute {app_name}-{environment}-migrate --region={region}
```

The job:
- Inherits the same VPC access as the API
- Reads `DATABASE_URL` from Secret Manager
- Runs `node-pg-migrate up` inside the container
- Retries up to 3 times on failure

## Updating Deployment

To update images:

```bash
# Push new images
docker build -t gcr.io/my-project/api:v2.0 src/api/
docker push gcr.io/my-project/api:v2.0

# Update and apply
terraform apply -var="api_image=gcr.io/my-project/api:v2.0" ...
```

Cloud Run automatically deploys new revisions and updates traffic.

## Cost Optimization

- **Min instances:** Set to 0 in dev/staging to save on idle costs (cold starts acceptable)
- **Database tier:** Use `db-f1-micro` for development
- **Machine types:** VPC Access Connector uses `e2-micro` (smallest available)
- **Scaling:** Adjust `*_max_instances` based on expected traffic

## Troubleshooting

### Cloud Run services cannot reach Cloud SQL

Check:
1. VPC Access Connector is active and has IP capacity
2. Service account has `roles/cloudsql.client` permission
3. Cloud SQL instance is in the same region

### Database connection fails

Check:
1. `DATABASE_URL` secret is correctly populated in Secret Manager
2. Cloud SQL instance is accessible (private IP configured)
3. Network connectivity: `gcloud sql connect <instance>`

### Terraform state conflicts

If state is locked:
```bash
terraform force-unlock <LOCK_ID>
```

Refresh state:
```bash
terraform refresh
```
