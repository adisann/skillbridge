"""Read-only local checks. Never print credential values or contact details."""
import base64
import json
import re
import subprocess
from pathlib import Path

root = Path.cwd()
files = subprocess.check_output(["git", "ls-files", "-co", "--exclude-standard"], text=True).splitlines()
private_values = set()
for env_path in (root / "web/.env.local", root / "worker/.env", root / ".env"):
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" not in line or line.lstrip().startswith("#"):
                continue
            key, value = line.split("=", 1)
            value = value.strip().strip("\"'")
            if not key.startswith("NEXT_PUBLIC_") and re.search(r"KEY|TOKEN|PASSWORD|SECRET", key) and len(value) >= 16 and not any(marker in value.lower() for marker in ("your-", "placeholder", "example")):
                private_values.add(value)
patterns = {
    "google_api_key": re.compile(r"AIza[\w-]{30,}"),
    "private_api_token": re.compile(r"\b(?:gsk_|sk-proj-|sb_secret_)[\w-]{20,}"),
    "aws_access_key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "private_key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}
findings = []
contacts = []
def inspect(path, data, scope):
    if b"\x00" in data:
        return
    text = data.decode("utf-8", errors="replace")
    for number, line in enumerate(text.splitlines(), 1):
        for kind, pattern in patterns.items():
            if pattern.search(line):
                findings.append({"scope": scope, "path": path, "line": number, "kind": kind})
        if any(value in line for value in private_values):
            findings.append({"scope": scope, "path": path, "line": number, "kind": "matches_private_environment_value"})
        for token in re.findall(r"eyJ[\w-]+\.[\w-]+\.[\w-]+", line):
            try:
                payload = token.split(".")[1]
                claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
                if claims.get("role") == "service_role":
                    findings.append({"scope": scope, "path": path, "line": number, "kind": "service_role_jwt"})
            except (ValueError, json.JSONDecodeError):
                pass
        if scope == "working-tree" and path.endswith("jobs_seed.json") and (re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", line) or re.search(r"(?<!\w)(?:\+62|08)\d[\d -]{7,12}\d(?!\w)", line)):
            contacts.append({"path": path, "line": number})

allowed = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".json", ".md", ".yaml", ".yml", ".sql", ".example", ".txt", ".drawio", ".svg", ".xml"}
for name in files:
    path = root / name
    if path.is_file() and path.suffix in allowed:
        inspect(name, path.read_bytes(), "working-tree")
for path in (root / "web/.next/static").rglob("*.js"):
    inspect(str(path.relative_to(root)), path.read_bytes(), "client-bundle")

objects = subprocess.check_output(["git", "rev-list", "--objects", "--all"], text=True).splitlines()
history = [(line.split(" ", 1)[0], line.split(" ", 1)[1]) for line in objects if " " in line and Path(line.split(" ", 1)[1]).suffix in allowed]
process = subprocess.Popen(["git", "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
for oid, name in history:
    process.stdin.write((oid + "\n").encode()); process.stdin.flush()
    header = process.stdout.readline().decode().split()
    if len(header) < 3:
        continue
    length = int(header[2])
    data = process.stdout.read(length); process.stdout.read(1)
    if header[1] == "blob":
        inspect(name, data, "git-history")
process.stdin.close(); process.wait()
report = {"working_files_checked": len(files), "history_objects_checked": len(history), "credential_findings": findings, "seed_contact_locations": contacts}
report_directory = root / "worker/.local-checks"
report_directory.mkdir(parents=True, exist_ok=True)
(report_directory / "repository-audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report))
raise SystemExit(1 if findings else 0)
