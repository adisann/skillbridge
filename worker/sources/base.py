from datetime import datetime
from typing import Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class RawJob(BaseModel):
    """Representasi data mentah lowongan dari berbagai sumber."""
    external_id: str
    source_name: str
    source_url: str
    title: str
    company: str
    location: str
    description_raw: str
    retrieval_method: str = "public_api"  # public_api | jobspy | admin_import | seed
    posted_at: Optional[datetime] = None
    employment_type: Optional[str] = None  # Full-time, Part-time, Contract, Internship
    is_remote: bool = False
    metadata: dict = Field(default_factory=dict)
    expires_at: Optional[datetime] = None
    # Data terstruktur dari sumber (bila tersedia); jika kosong, diekstrak dari deskripsi
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None  # IDR
    salary_period: Optional[str] = None  # hour | day | week | month | year
    education_level: Optional[str] = None  # High School, Diploma, Bachelor, Master, Doctorate
    experience_years_min: Optional[int] = None
    skill_hints: list[dict] = Field(default_factory=list)  # [{"name": str, "must_have": bool}]


@runtime_checkable
class JobSource(Protocol):
    """Interface standar untuk seluruh sumber lowongan kerja SkillBridge."""
    name: str

    async def fetch_jobs(self, limit: int = 25) -> list[RawJob]:
        """Ambil daftar lowongan kerja mentah hingga batas limit."""
        ...

