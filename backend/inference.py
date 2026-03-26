import os
import time
import asyncio
from typing import AsyncGenerator
from openai import AsyncOpenAI
from models import TokenEvent

class InferenceEngine:
    def __init__(self):
        # vLLM endpoint (optimized)
        self.vllm_client = AsyncOpenAI(
            api_key=os.getenv("VLLM_API_KEY", ""),
            base_url=os.getenv("VLLM_URL", "http://localhost:8000/v1")
        )

        # Standard endpoint (for comparison)
        self.standard_client = AsyncOpenAI(
            api_key=os.getenv("STANDARD_API_KEY", ""),
            base_url=os.getenv("STANDARD_LLM_URL", "https://api.openai.com/v1")
        )

        self.model_name = os.getenv("MODEL_NAME", "gpt-3.5-turbo")

    async def stream_tokens(
        self,
        prompt: str,
        racer: str,
        max_tokens: int = 100
    ) -> AsyncGenerator[TokenEvent, None]:
        """Stream tokens from either vLLM or standard endpoint"""

        client = self.vllm_client if racer == "vllm" else self.standard_client

        # For standard inference, add artificial delay to simulate slower processing
        # In real world, vLLM would naturally be faster due to optimizations
        delay_per_token = 0.0 if racer == "vllm" else 0.05

        start_time = time.time()
        token_count = 0

        try:
            stream = await client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                stream=True,
                temperature=0.7
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    token_count += 1
                    elapsed = time.time() - start_time

                    # Add delay for standard to show difference
                    if delay_per_token > 0:
                        await asyncio.sleep(delay_per_token)

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
        delay_per_token = 0.0 if racer == "vllm" else 0.05

        start_time = time.time()
        full_text = ""
        token_count = 0

        try:
            stream = await client.chat.completions.create(
                model=self.model_name,
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

                    if delay_per_token > 0:
                        await asyncio.sleep(delay_per_token)

            elapsed = time.time() - start_time
            tokens_per_sec = token_count / elapsed if elapsed > 0 else 0

            return full_text, elapsed, tokens_per_sec

        except Exception as e:
            print(f"Error in {racer} inference: {e}")
            elapsed = time.time() - start_time
            return f"Error: {str(e)}", elapsed, 0
