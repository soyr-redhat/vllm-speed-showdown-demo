from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class PromptCategory(str, Enum):
    SHORT = "short"
    LONG = "long"
    CODE = "code"
    CREATIVE = "creative"
    TECHNICAL = "technical"

class RaceRequest(BaseModel):
    prompt: str
    category: PromptCategory = PromptCategory.SHORT
    max_tokens: int = Field(default=100, ge=10, le=500)

class TokenEvent(BaseModel):
    racer: str  # "standard" or "vllm"
    token: str
    index: int
    timestamp: float
    tokens_per_sec: Optional[float] = None

class RaceResults(BaseModel):
    winner: str
    standard_time: float
    vllm_time: float
    standard_tokens_per_sec: float
    vllm_tokens_per_sec: float
    speedup: float
    standard_text: str
    vllm_text: str

class LeaderboardEntry(BaseModel):
    username: str
    max_throughput: float
    timestamp: float
    prompt_category: PromptCategory

class StressTestConfig(BaseModel):
    num_concurrent: int = Field(default=5, ge=1, le=20)
    prompt: str
    max_tokens: int = Field(default=50, ge=10, le=200)

class StressTestResults(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_latency: float
    avg_throughput: float
    total_time: float
    vllm_handled: int
    standard_handled: int
