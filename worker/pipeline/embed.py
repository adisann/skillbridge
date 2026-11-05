import asyncio
import math
import os
import logging
from typing import Optional, Protocol, runtime_checkable

import httpx

logger = logging.getLogger(__name__)


@runtime_checkable
class EmbeddingProvider(Protocol):
    """Interface untuk embedding model independen dari vendor."""
    dimension: int
    async def get_embedding(self, text: str) -> Optional[list[float]]: ...


class MockEmbeddingProvider:
    """Provider tiruan untuk testing lokal atau demo tanpa API key berbayar."""
    def __init__(self, dimension: int = 768):
        self.dimension = dimension

    async def get_embedding(self, text: str) -> list[float]:
        # Hash deterministik teks menjadi vector float ternormalisasi
        import hashlib
        import math
        seed = int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)
        vec = [math.sin(seed + i) for i in range(self.dimension)]
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]


def _normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vector)) or 1.0
    return [x / norm for x in vector]


class _HttpEmbeddingProvider:
    """Dasar provider berbasis HTTP: 1 retry untuk 429/5xx, gagal -> None (job tetap disimpan tanpa vektor)."""
    name = "http"
    timeout = 20.0

    def __init__(self, api_key: str, model: str, dimension: int = 768, client: Optional[httpx.AsyncClient] = None):
        self.api_key = api_key
        self.model = model
        self.dimension = dimension
        self._client = client

    def _request(self, text: str) -> tuple[str, dict, dict]:
        raise NotImplementedError

    def _parse(self, payload: dict) -> list[float]:
        raise NotImplementedError

    async def get_embedding(self, text: str) -> Optional[list[float]]:
        url, headers, body = self._request(text[:8000])
        client = self._client or httpx.AsyncClient(timeout=self.timeout)
        try:
            for attempt in range(2):
                try:
                    resp = await client.post(url, headers=headers, json=body)
                except httpx.HTTPError as err:
                    logger.warning(f"Embedding {self.name} gagal jaringan: {err}")
                    return None
                if resp.status_code == 200:
                    vector = self._parse(resp.json())
                    if len(vector) != self.dimension:
                        logger.warning(f"Dimensi embedding {len(vector)} != {self.dimension}; dilewati.")
                        return None
                    return _normalize(vector)
                if resp.status_code in (429, 500, 502, 503) and attempt == 0:
                    await asyncio.sleep(2.0)
                    continue
                logger.warning(f"Embedding {self.name} ditolak ({resp.status_code}); lowongan disimpan tanpa vektor.")
                return None
            return None
        finally:
            if self._client is None:
                await client.aclose()


class GeminiEmbeddingProvider(_HttpEmbeddingProvider):
    name = "gemini"

    def _request(self, text: str) -> tuple[str, dict, dict]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:embedContent"
        headers = {"x-goog-api-key": self.api_key, "Content-Type": "application/json"}
        body = {
            "model": f"models/{self.model}",
            "content": {"parts": [{"text": text}]},
            "taskType": "RETRIEVAL_DOCUMENT",
            "outputDimensionality": self.dimension,
        }
        return url, headers, body

    def _parse(self, payload: dict) -> list[float]:
        return list((payload.get("embedding") or {}).get("values") or [])


class OpenAIEmbeddingProvider(_HttpEmbeddingProvider):
    name = "openai"

    def _request(self, text: str) -> tuple[str, dict, dict]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        body = {"model": self.model, "input": text, "dimensions": self.dimension}
        return "https://api.openai.com/v1/embeddings", headers, body

    def _parse(self, payload: dict) -> list[float]:
        data = payload.get("data") or [{}]
        return list(data[0].get("embedding") or [])


DEFAULT_MODELS = {"gemini": "gemini-embedding-001", "openai": "text-embedding-3-small"}


def get_embedding_provider() -> EmbeddingProvider:
    """Membaca konfigurasi env dan mengembalikan provider embedding yang sesuai."""
    provider_name = os.getenv("AI_PROVIDER", "mock").lower()
    dim = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))
    api_key = os.getenv("AI_API_KEY", "")

    if provider_name in DEFAULT_MODELS and api_key:
        model = os.getenv("EMBEDDING_MODEL") or DEFAULT_MODELS[provider_name]
        if provider_name == "gemini" and model == "text-embedding-004":
            model = DEFAULT_MODELS["gemini"]  # text-embedding-004 sudah dipensiunkan
        logger.info(f"Menginisialisasi embedding provider: {provider_name}/{model} (dim: {dim})")
        cls = GeminiEmbeddingProvider if provider_name == "gemini" else OpenAIEmbeddingProvider
        return cls(api_key=api_key, model=model, dimension=dim)

    logger.info("Menggunakan MockEmbeddingProvider (mode demo/offline).")
    return MockEmbeddingProvider(dimension=dim)
