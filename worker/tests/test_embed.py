import asyncio
import math

import httpx

from worker.pipeline.embed import GeminiEmbeddingProvider, MockEmbeddingProvider, get_embedding_provider


def run(coro):
    return asyncio.run(coro)


def make_provider(handler, dimension=4):
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return GeminiEmbeddingProvider(api_key="k", model="gemini-embedding-001", dimension=dimension, client=client)


def test_gemini_embedding_dinormalisasi_dan_header_aman():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["key_header"] = request.headers.get("x-goog-api-key")
        return httpx.Response(200, json={"embedding": {"values": [3.0, 4.0, 0.0, 0.0]}})

    vector = run(make_provider(handler).get_embedding("halo"))
    assert vector is not None and math.isclose(sum(x * x for x in vector), 1.0)
    assert seen["key_header"] == "k" and "key=" not in seen["url"]


def test_gemini_embedding_gagal_mengembalikan_none():
    provider = make_provider(lambda request: httpx.Response(403, json={"error": "forbidden"}))
    assert run(provider.get_embedding("halo")) is None


def test_gemini_embedding_dimensi_salah_dilewati():
    provider = make_provider(lambda request: httpx.Response(200, json={"embedding": {"values": [1.0, 2.0]}}))
    assert run(provider.get_embedding("halo")) is None


def test_provider_dipilih_dari_env(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("AI_API_KEY", "abc")
    assert isinstance(get_embedding_provider(), GeminiEmbeddingProvider)
    monkeypatch.setenv("AI_API_KEY", "")
    assert isinstance(get_embedding_provider(), MockEmbeddingProvider)
