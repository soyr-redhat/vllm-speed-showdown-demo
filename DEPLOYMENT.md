# Deployment Guide - Speed Showdown

## Prerequisites

- OpenShift cluster access (https://api.ocp.cloud.rhai-tmm.dev:6443)
- GitHub repository with Actions enabled
- vLLM or OpenAI-compatible API credentials

## Automated CI/CD Setup

This project uses **dual deployment strategies** for automatic updates:

### 1. GitHub Actions (Primary Orchestration)

**Required GitHub Secrets:**
- `OPENSHIFT_LOGIN_TOKEN` - Your OpenShift authentication token
- `VLLM_API_KEY` - API key for vLLM endpoint (optional)
- `STANDARD_API_KEY` - API key for standard LLM endpoint

**Workflow Features:**
- Triggers on push to `main` affecting backend/frontend/deployment
- Installs OpenShift CLI
- Builds container images on OpenShift
- Deploys to `speed-showdown` namespace
- Automatically cleans up old builds (keeps last 3)
- Reports deployment URL

### 2. OpenShift BuildConfig (Automatic Builds)

- GitHub webhooks trigger builds on git push
- Automatic image stream updates
- Zero-downtime rolling deployments via image triggers

## Initial Setup

### 1. Configure GitHub Secrets

Go to: https://github.com/soyr-redhat/vllm-speed-showdown-demo/settings/secrets/actions

Add:
```
OPENSHIFT_LOGIN_TOKEN=<your-token>
VLLM_API_KEY=<your-vllm-api-key>
STANDARD_API_KEY=<your-standard-api-key>
```

### 2. Deploy Initial Resources

```bash
# Login to OpenShift
oc login --token=<your-token> --server=https://api.ocp.cloud.rhai-tmm.dev:6443

# Create namespace
oc new-project speed-showdown

# Create secrets
cp deployment/secrets.yaml.example deployment/secrets.yaml
# Edit with your credentials
oc apply -f deployment/secrets.yaml

# Apply build configs and deployments
oc apply -f deployment/buildconfig.yaml
oc apply -f deployment/deployment.yaml

# Trigger initial builds
oc start-build speed-backend -n speed-showdown
oc start-build speed-frontend -n speed-showdown
```

### 3. Access the Application

```bash
oc get route speed-showdown -n speed-showdown
```

## How It Works

**On every push to main:**

1. GitHub sends webhook to OpenShift
2. BuildConfigs automatically start building new container images
3. GitHub Actions workflow triggers and orchestrates deployment
4. New images pushed to internal registry
5. Image triggers automatically update deployments
6. Pods roll out with zero downtime
7. Old builds cleaned up (keeps last 3)

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export VLLM_URL="http://localhost:8001/v1"
export VLLM_API_KEY=""
export STANDARD_LLM_URL="https://api.openai.com/v1"
export STANDARD_API_KEY="sk-..."
export MODEL_NAME="gpt-3.5-turbo"

uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Using Docker Compose
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your API keys
# Start all services
docker-compose up
```

## Monitoring

```bash
# Check deployments
oc get deployments -n speed-showdown

# Check pods
oc get pods -n speed-showdown

# View logs
oc logs -f deployment/speed-backend -n speed-showdown
oc logs -f deployment/speed-frontend -n speed-showdown

# Check builds
oc get builds -n speed-showdown

# Watch GitHub Actions
gh run watch
```

## Troubleshooting

### Workflow fails at login
- Verify `OPENSHIFT_LOGIN_TOKEN` secret is set correctly
- Check token hasn't expired

### Builds not triggering automatically
- Verify BuildConfig webhooks are configured
- Check webhook deliveries in GitHub Settings → Webhooks

### Frontend pods crash (permission denied)
- Verify using `nginxinc/nginx-unprivileged:alpine` base image
- Check OpenShift security constraints

### Deployments not updating with new images
- Verify image triggers annotation exists on deployment
- Check ImageStream exists: `oc get imagestream -n speed-showdown`

### Old builds not cleaning up
- Check GitHub Actions logs for cleanup step
- Verify user has delete permissions on builds

### WebSocket connection fails
- Ensure route supports websocket connections
- Check backend CORS configuration
- Verify frontend is using correct ws:// or wss:// protocol

### Backend can't connect to LLM
- Verify API keys are set in secrets
- Check VLLM_URL is accessible from cluster
- View backend logs for connection errors
