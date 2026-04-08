from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
import time
import json
import os
from pathlib import Path
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

# Persistent scoreboard
SCOREBOARD_FILE = Path(os.getenv("SCOREBOARD_PATH", "/tmp/vllm_scoreboard.json"))

def load_wins() -> Dict[str, int]:
    """Load wins from persistent storage"""
    if SCOREBOARD_FILE.exists():
        try:
            with open(SCOREBOARD_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading scoreboard: {e}")
    return {"standard": 0, "optimized": 0, "quantized": 0}

def save_wins(wins: Dict[str, int]):
    """Save wins to persistent storage"""
    try:
        with open(SCOREBOARD_FILE, 'w') as f:
            json.dump(wins, f)
    except Exception as e:
        print(f"Error saving scoreboard: {e}")

# Load wins on startup
global_wins = load_wins()

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

@app.get("/wins")
async def get_wins():
    """Get current global win counts"""
    return global_wins

@app.post("/wins/{racer}")
async def increment_win(racer: str):
    """Increment win count for a racer"""
    global global_wins
    if racer in global_wins:
        global_wins[racer] += 1
        save_wins(global_wins)
        return global_wins
    return {"error": "Invalid racer"}, 400

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

            # Run all three racers concurrently
            await asyncio.gather(
                stream_racer("standard"),
                stream_racer("optimized"),
                stream_racer("quantized")
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

    # Run all three inferences
    standard_task = engine.generate_complete(request.prompt, "standard", request.max_tokens)
    optimized_task = engine.generate_complete(request.prompt, "optimized", request.max_tokens)
    quantized_task = engine.generate_complete(request.prompt, "quantized", request.max_tokens)

    (standard_text, standard_time, standard_tps), \
    (optimized_text, optimized_time, optimized_tps), \
    (quantized_text, quantized_time, quantized_tps) = await asyncio.gather(
        standard_task, optimized_task, quantized_task
    )

    # Calculate speedups vs standard
    optimized_speedup = standard_time / optimized_time if optimized_time > 0 else 1.0
    quantized_speedup = standard_time / quantized_time if quantized_time > 0 else 1.0

    # Determine winner (fastest time)
    times = {
        "standard": standard_time,
        "optimized": optimized_time,
        "quantized": quantized_time
    }
    winner = min(times, key=times.get)

    return RaceResults(
        winner=winner,
        standard_time=standard_time,
        optimized_time=optimized_time,
        quantized_time=quantized_time,
        standard_tokens_per_sec=standard_tps,
        optimized_tokens_per_sec=optimized_tps,
        quantized_tokens_per_sec=quantized_tps,
        standard_text=standard_text,
        optimized_text=optimized_text,
        quantized_text=quantized_text,
        optimized_speedup=optimized_speedup,
        quantized_speedup=quantized_speedup
    )

@app.post("/stress-test")
async def stress_test(config: StressTestConfig) -> StressTestResults:
    """Run a stress test with concurrent requests"""

    results = {
        "successful": 0,
        "failed": 0,
        "latencies": [],
        "throughputs": [],
        "standard_count": 0,
        "optimized_count": 0,
        "quantized_count": 0
    }

    start_time = time.time()

    async def run_request(index: int):
        try:
            # Rotate between standard, optimized, and quantized
            racers = ["standard", "optimized", "quantized"]
            racer = racers[index % 3]

            text, latency, tps = await engine.generate_complete(
                config.prompt,
                racer,
                config.max_tokens
            )

            results["successful"] += 1
            results["latencies"].append(latency)
            results["throughputs"].append(tps)

            if racer == "standard":
                results["standard_count"] += 1
            elif racer == "optimized":
                results["optimized_count"] += 1
            else:
                results["quantized_count"] += 1

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
        standard_handled=results["standard_count"],
        optimized_handled=results["optimized_count"],
        quantized_handled=results["quantized_count"]
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

@app.websocket("/ws/compare")
async def compare_websocket(websocket: WebSocket):
    """WebSocket endpoint for side-by-side comparison of standard vs quantized"""
    await websocket.accept()

    try:
        # Receive prompt
        data = await websocket.receive_text()
        request_data = json.loads(data)
        prompt = request_data.get("prompt", "")

        # Stream both models concurrently
        async def stream_model(model_type: str):
            start_time = time.time()
            first_token_time = None
            token_count = 0

            async for token_event in engine.stream_tokens(prompt, model_type, max_tokens=512):
                if first_token_time is None:
                    first_token_time = time.time()

                token_count += 1

                # Send token to frontend
                await websocket.send_json({
                    "type": "token",
                    "model": model_type,
                    "token": token_event.token,
                    "timestamp": token_event.timestamp
                })

            # Calculate metrics
            end_time = time.time()
            total_time = end_time - start_time
            ttft = (first_token_time - start_time) * 1000 if first_token_time else 0
            tps = token_count / total_time if total_time > 0 else 0

            # Send completion with metrics
            await websocket.send_json({
                "type": "complete",
                "model": model_type,
                "metrics": {
                    "tps": tps,
                    "ttft": ttft,
                    "totalTime": total_time,
                    "tokenCount": token_count
                }
            })

        # Run both models concurrently
        await asyncio.gather(
            stream_model("standard"),
            stream_model("quantized")
        )

        # Send done signal
        await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        print("Client disconnected from compare")
    except Exception as e:
        print(f"Error in compare WebSocket: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
