# Speed Showdown - vLLM Inference Demo

An interactive racing game that demonstrates the performance benefits of vLLM optimized inference vs standard inference.

## Concept

Users submit prompts and watch two "racers" generate tokens in real-time:
- **🚀 Track 1**: vLLM optimized inference (fast)
- **🐢 Track 2**: Standard inference (slower for comparison)

Visual racing interface shows tokens generating with real-time metrics, speedup calculations, and performance comparisons.

## Features

- Real-time token generation visualization with racing cars
- Side-by-side performance comparison
- Live metrics: tokens/sec, latency, throughput, speedup
- Stress test mode with concurrent requests
- Leaderboard for throughput achieved
- Multiple prompt categories (short, long, code, creative, technical)
- Educational content about vLLM optimizations

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + WebSockets (nginx-unprivileged)
- **Backend**: Python FastAPI + vLLM + OpenAI-compatible API
- **Deployment**: OpenShift with automated CI/CD
- **CI/CD**: GitHub Actions + OpenShift BuildConfig webhooks

## Quick Start

The application will be deployed at: **https://speed-showdown-speed-showdown.apps.ocp.cloud.rhai-tmm.dev**

## Automated Deployment

Push to `main` branch automatically triggers:
1. OpenShift builds via GitHub webhooks
2. GitHub Actions workflow orchestration
3. Automatic pod rollout with new images
4. Cleanup of old builds (keeps last 3)

See [DEPLOYMENT.md](DEPLOYMENT.md) for setup details.

## Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export VLLM_URL="http://localhost:8001/v1"
export VLLM_API_KEY=""
export STANDARD_LLM_URL="https://api.openai.com/v1"
export STANDARD_API_KEY="sk-your-key"
export MODEL_NAME="gpt-3.5-turbo"
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

- `VLLM_URL` - vLLM endpoint URL
- `VLLM_API_KEY` - API key for vLLM endpoint
- `STANDARD_LLM_URL` - Standard LLM endpoint URL for comparison
- `STANDARD_API_KEY` - API key for standard endpoint
- `MODEL_NAME` - Model name to use

## How It Works

The demo simulates a race between two inference engines:

1. **vLLM Track**: Uses optimized serving with techniques like:
   - Continuous batching for efficient multi-request handling
   - PagedAttention for optimized KV cache management
   - Custom CUDA kernels for faster generation
   - Dynamic batching for varying workloads

2. **Standard Track**: Simulates traditional inference with added latency to demonstrate the difference

Users can:
- Choose from preset prompts or write custom ones
- Watch real-time token generation race
- See detailed performance metrics and speedup
- Learn about vLLM optimization techniques
