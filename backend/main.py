from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import asyncio
import time
import json
from models import (
    RaceRequest, RaceResults, LeaderboardEntry,
    StressTestConfig, StressTestResults, PromptCategory
)
from inference import InferenceEngine

app = FastAPI(title="Speed Showdown - vLLM Inference Demo")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
engine = InferenceEngine()
leaderboard: List[LeaderboardEntry] = []

# Sample prompts by category
SAMPLE_PROMPTS = {
    PromptCategory.SHORT: [
        "What is the capital of France?",
        "Explain quantum computing in one sentence.",
        "Write a haiku about AI."
    ],
    PromptCategory.LONG: [
        "Write a detailed explanation of how neural networks learn, including backpropagation and gradient descent.",
        "Describe the history of the internet from ARPANET to modern web3 technologies.",
        "Explain the process of photosynthesis in plants with chemical equations."
    ],
    PromptCategory.CODE: [
        "Write a Python function to implement binary search.",
        "Create a React component for a todo list with add and delete functionality.",
        "Write a SQL query to find the top 10 customers by total purchase amount."
    ],
    PromptCategory.CREATIVE: [
        "Write a short story about a robot discovering emotions.",
        "Compose a poem about the beauty of mathematics.",
        "Create a marketing slogan for a futuristic coffee shop."
    ],
    PromptCategory.TECHNICAL: [
        "Explain how a transformer architecture works in large language models.",
        "Describe the CAP theorem and its implications for distributed systems.",
        "What are the key differences between TCP and UDP protocols?"
    ]
}

@app.get("/")
async def root():
    return {
        "service": "Speed Showdown",
        "status": "running",
        "pillar": "Inference (vLLM)"
    }

@app.get("/prompts/{category}")
async def get_sample_prompts(category: PromptCategory):
    """Get sample prompts for a category"""
    return {"prompts": SAMPLE_PROMPTS.get(category, [])}

@app.websocket("/ws/race")
async def race_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time token racing"""
    await websocket.accept()

    try:
        while True:
            # Receive race request
            data = await websocket.receive_text()
            request = RaceRequest(**json.loads(data))

            # Send race start signal
            await websocket.send_json({
                "type": "race_start",
                "prompt": request.prompt
            })

            # Create tasks for both racers
            async def stream_racer(racer: str):
                async for token_event in engine.stream_tokens(
                    request.prompt,
                    racer,
                    request.max_tokens
                ):
                    await websocket.send_json({
                        "type": "token",
                        "data": token_event.model_dump()
                    })

            # Run both racers concurrently
            await asyncio.gather(
                stream_racer("standard"),
                stream_racer("vllm")
            )

            # Send race complete
            await websocket.send_json({
                "type": "race_complete"
            })

    except WebSocketDisconnect:
        print("Client disconnected from race")
    except Exception as e:
        print(f"Error in race WebSocket: {e}")
        await websocket.send_json({"error": str(e)})

@app.post("/race")
async def run_race(request: RaceRequest) -> RaceResults:
    """Run a complete race and return results"""

    # Run both inferences
    standard_task = engine.generate_complete(request.prompt, "standard", request.max_tokens)
    vllm_task = engine.generate_complete(request.prompt, "vllm", request.max_tokens)

    (standard_text, standard_time, standard_tps), (vllm_text, vllm_time, vllm_tps) = await asyncio.gather(
        standard_task, vllm_task
    )

    speedup = standard_time / vllm_time if vllm_time > 0 else 1.0
    winner = "vllm" if vllm_time < standard_time else "standard"

    return RaceResults(
        winner=winner,
        standard_time=standard_time,
        vllm_time=vllm_time,
        standard_tokens_per_sec=standard_tps,
        vllm_tokens_per_sec=vllm_tps,
        speedup=speedup,
        standard_text=standard_text,
        vllm_text=vllm_text
    )

@app.post("/stress-test")
async def stress_test(config: StressTestConfig) -> StressTestResults:
    """Run a stress test with concurrent requests"""

    results = {
        "successful": 0,
        "failed": 0,
        "latencies": [],
        "throughputs": [],
        "vllm_count": 0,
        "standard_count": 0
    }

    start_time = time.time()

    async def run_request(index: int):
        try:
            # Alternate between vLLM and standard
            racer = "vllm" if index % 2 == 0 else "standard"
            text, latency, tps = await engine.generate_complete(
                config.prompt,
                racer,
                config.max_tokens
            )

            results["successful"] += 1
            results["latencies"].append(latency)
            results["throughputs"].append(tps)

            if racer == "vllm":
                results["vllm_count"] += 1
            else:
                results["standard_count"] += 1

        except Exception as e:
            print(f"Request {index} failed: {e}")
            results["failed"] += 1

    # Run concurrent requests
    tasks = [run_request(i) for i in range(config.num_concurrent)]
    await asyncio.gather(*tasks)

    total_time = time.time() - start_time

    return StressTestResults(
        total_requests=config.num_concurrent,
        successful_requests=results["successful"],
        failed_requests=results["failed"],
        avg_latency=sum(results["latencies"]) / len(results["latencies"]) if results["latencies"] else 0,
        avg_throughput=sum(results["throughputs"]) / len(results["throughputs"]) if results["throughputs"] else 0,
        total_time=total_time,
        vllm_handled=results["vllm_count"],
        standard_handled=results["standard_count"]
    )

@app.post("/leaderboard")
async def add_to_leaderboard(entry: LeaderboardEntry):
    """Add entry to leaderboard"""
    leaderboard.append(entry)
    # Keep only top 10
    leaderboard.sort(key=lambda x: x.max_throughput, reverse=True)
    return {"position": leaderboard.index(entry) + 1 if entry in leaderboard[:10] else None}

@app.get("/leaderboard")
async def get_leaderboard():
    """Get top leaderboard entries"""
    return {"leaderboard": sorted(leaderboard, key=lambda x: x.max_throughput, reverse=True)[:10]}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
