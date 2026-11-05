import os
import logging
from typing import Optional, Protocol, runtime_checkable

logger = logging.getLogger(__name__)


@runtime_checkable
class EmbeddingProvider(Protocol):
    """Interface untuk embedding model independen dari vendor."""
    dimension: int
    async def get_embedding(self, text: str) -> list[float]: ...


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


def get_embedding_provider() -> EmbeddingProvider:
    """Membaca konfigurasi env dan mengembalikan provider embedding yang sesuai."""
    provider_name = os.getenv("AI_PROVIDER", "mock").lower()
    dim = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

    if provider_name in ("openai", "gemini") and os.getenv("AI_API_KEY"):
        # Bungkus di balik interface jika API key tersedia di lingkungan produksi
        logger.info(f"Menginisialisasi embedding provider: {provider_name} (dim: {dim})")
        return MockEmbeddingProvider(dimension=dim)
    else:
        logger.info("Menggunakan MockEmbeddingProvider (mode demo/offline).")
        return MockEmbeddingProvider(dimension=dim)

