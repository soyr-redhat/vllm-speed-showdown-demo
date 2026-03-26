import os
import time
import asyncio
from typing import AsyncGenerator
from openai import AsyncOpenAI
from models import TokenEvent

class InferenceEngine:
    def __init__(self):
        vllm_api_key = os.getenv("VLLM_API_KEY", "")
        standard_api_key = os.getenv("STANDARD_API_KEY", "")

        print(f"Initializing InferenceEngine")
        print(f"VLLM_URL: {os.getenv('VLLM_URL')}")
        print(f"VLLM_API_KEY set: {bool(vllm_api_key)}")
        print(f"STANDARD_LLM_URL: {os.getenv('STANDARD_LLM_URL')}")
        print(f"VLLM_MODEL: {os.getenv('VLLM_MODEL')}")
        print(f"STANDARD_MODEL: {os.getenv('STANDARD_MODEL')}")

        # vLLM endpoint (optimized)
        self.vllm_client = AsyncOpenAI(
            api_key=vllm_api_key or "EMPTY",
            base_url=os.getenv("VLLM_URL", "http://localhost:8000/v1")
        )

        # Standard endpoint (for comparison)
        self.standard_client = AsyncOpenAI(
            api_key=standard_api_key or "EMPTY",
            base_url=os.getenv("STANDARD_LLM_URL", "https://api.openai.com/v1")
        )

        self.vllm_model = os.getenv("VLLM_MODEL", "gpt-3.5-turbo")
        self.standard_model = os.getenv("STANDARD_MODEL", "gpt-3.5-turbo")

    async def stream_tokens(
        self,
        prompt: str,
        racer: str,
        max_tokens: int = 100
    ) -> AsyncGenerator[TokenEvent, None]:
        """Stream tokens from either vLLM or standard endpoint"""

        client = self.vllm_client if racer == "vllm" else self.standard_client
        model = self.vllm_model if racer == "vllm" else self.standard_model

        start_time = time.time()
        token_count = 0

        try:
            print(f"[{racer}] Starting inference with model: {model}, prompt length: {len(prompt)}")
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                stream=True,
                temperature=0.7
            )

            print(f"[{racer}] Stream created, waiting for tokens...")
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    token_count += 1
                    elapsed = time.time() - start_time

                    yield TokenEvent(
                        racer=racer,
                        token=token,
                        index=token_count,
                        timestamp=time.time(),
                        tokens_per_sec=token_count / elapsed if elapsed > 0 else 0
                    )

        except Exception as e:
            print(f"Error in {racer} inference: {e}")
            # Yield error token
            yield TokenEvent(
                racer=racer,
                token=f"[ERROR: {str(e)}]",
                index=-1,
                timestamp=time.time(),
                tokens_per_sec=0
            )

    async def generate_complete(
        self,
        prompt: str,
        racer: str,
        max_tokens: int = 100
    ) -> tuple[str, float, float]:
        """Generate complete response and return text, time, tokens/sec"""

        client = self.vllm_client if racer == "vllm" else self.standard_client
        model = self.vllm_model if racer == "vllm" else self.standard_model

        start_time = time.time()
        full_text = ""
        token_count = 0

        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                stream=True,
                temperature=0.7
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_text += token
                    token_count += 1

            elapsed = time.time() - start_time
            tokens_per_sec = token_count / elapsed if elapsed > 0 else 0

            return full_text, elapsed, tokens_per_sec

        except Exception as e:
            print(f"Error in {racer} inference: {e}")
            elapsed = time.time() - start_time
            return f"Error: {str(e)}", elapsed, 0
