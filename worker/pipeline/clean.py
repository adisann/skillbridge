import html
import re
import logging
from bs4 import BeautifulSoup
from typing import Optional

logger = logging.getLogger(__name__)


def clean_html_text(raw_html_or_text: str) -> str:
    """Membersihkan dokumen HTML dan menormalkan teks deskripsi lowongan.
    
    - Mengurai tag HTML menggunakan BeautifulSoup
    - Menghapus tag script, style, meta, iframe, dsb.
    - Menormalkan spasi, newline, dan bullet points
    """
    if not raw_html_or_text or not raw_html_or_text.strip():
        return ""

    # Greenhouse mengirim HTML dalam bentuk escaped (&lt;p&gt;); buka dulu agar tag ikut terurai
    if re.search(r"&lt;/?[a-z]", raw_html_or_text, re.IGNORECASE):
        raw_html_or_text = html.unescape(raw_html_or_text)

    soup = BeautifulSoup(raw_html_or_text, "html.parser")

    # Hapus tag berbahaya dan metadata
    for tag in soup(["script", "style", "noscript", "meta", "link", "iframe", "svg"]):
        tag.decompose()

    # Sisipkan baris baru pada elemen block
    for block in soup.find_all(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "tr"]):
        block.append("\n")
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for li in soup.find_all("li"):
        li.insert_before("• ")
        li.append("\n")

    text = soup.get_text(separator=" ")

    # Normalisasi spasi dan baris kosong berturut-turut
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" ?\n ?", "\n", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return normalize_bullets(text).strip()


def normalize_bullets(text: str) -> str:
    """Rapikan bullet hasil scrape: tanda bullet yang berdiri sendiri di satu baris
    digabung dengan teksnya, dan daftar bullet dirapatkan tanpa baris kosong."""
    text = re.sub(r"(?m)^[ \t]*([•▪●◦‣\-\*])[ \t]*\n+[ \t]*(?=\S)", r"\1 ", text)
    text = re.sub(r"[ \t]+([,.;:])", r"\1", text)
    text = re.sub(r"(?m)^([•▪●◦‣] [^\n]*)\n\n(?=[•▪●◦‣] )", r"\1\n", text)
    return text


async def render_dynamic_page_if_allowed(url: str, allowed_domains: list[str]) -> Optional[str]:
    """Menggunakan Playwright hanya untuk halaman dinamis dari domain yang diizinkan."""
    is_allowed = any(domain in url for domain in allowed_domains)
    if not is_allowed:
        logger.info(f"Domain untuk URL {url} tidak masuk whitelist Playwright. Melewati.")
        return None

    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.route("**/*.{png,jpg,jpeg,svg,gif,webp,woff,woff2}", lambda route: route.abort())
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")
            content = await page.content()
            await browser.close()
            return clean_html_text(content)
    except Exception as e:
        logger.warning(f"Playwright rendering gagal untuk {url}: {e}")
        return None
