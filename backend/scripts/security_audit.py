import os
import re

search_patterns = {
    "Google/Gemini API Key (AIzaSy)": re.compile(r"AIzaSy[A-Za-z0-9_-]{33}"),
    "Google Gemini AQ Key": re.compile(r"AQ\.[A-Za-z0-9_-]{30,}"),
    "Google App Password (16-char)": re.compile(r"\b[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}\b"),
    "Potential DB Password in connection string": re.compile(r"(?:password|pwd)\s*=\s*['\"][^'\"]+['\"]", re.IGNORECASE),
}

exclude_dirs = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".gemini", "audit_output", "scratch"}
exclude_extensions = {".png", ".jpg", ".jpeg", ".bak", ".db", ".pyc", ".zip", ".ico", ".woff", ".woff2", ".ttf"}

findings = []

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
print(f"Scanning project root: {project_root}")

for root, dirs, files in os.walk(project_root):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in exclude_extensions:
            continue
        # Also skip .env files as they are ignored by git, but let's note them
        fpath = os.path.join(root, file)
        relpath = os.path.relpath(fpath, project_root)
        
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    for pat_name, pat in search_patterns.items():
                        m = pat.search(line)
                        if m:
                            # Check if it's .env.example or a placeholder
                            matched_str = m.group(0)
                            if "your_" in matched_str or "example" in relpath.lower():
                                continue
                            findings.append({
                                "file": relpath,
                                "line": line_idx,
                                "type": pat_name,
                                "match": matched_str[:8] + "..." + matched_str[-4:] if len(matched_str) > 12 else matched_str,
                                "snippet": line.strip()[:100]
                            })
        except Exception as e:
            pass

print(f"\nTotal findings: {len(findings)}")
for item in findings:
    print(f"[{item['type']}] {item['file']}:{item['line']} -> {item['snippet']}")
