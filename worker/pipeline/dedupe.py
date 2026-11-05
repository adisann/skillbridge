import hashlib
import logging
from typing import Set

logger = logging.getLogger(__name__)


def compute_content_hash(title: str, company: str, cleaned_description: str) -> str:
    """Menghitung SHA-256 hash untuk mendeteksi perubahan konten lowongan."""
    payload = f"{title.strip().lower()}|{company.strip().lower()}|{cleaned_description.strip()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class Deduplicator:
    """Melacak duplikasi lowongan dalam satu run dan terhadap data tersimpan."""
    def __init__(self):
        self._seen_composite_keys: Set[str] = set()
        self._seen_content_hashes: Set[str] = set()

    def is_duplicate(self, source_name: str, external_id: str, content_hash: str) -> bool:
        composite_key = f"{source_name}:{external_id}"
        if composite_key in self._seen_composite_keys:
            return True
        if content_hash in self._seen_content_hashes:
            return True

        self._seen_composite_keys.add(composite_key)
        self._seen_content_hashes.add(content_hash)
        return False

