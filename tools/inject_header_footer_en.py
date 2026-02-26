import re
from pathlib import Path

ROOT = Path("en")
PARTIALS_DIR = ROOT / "_partials"
HEADER_PATH = PARTIALS_DIR / "header.html"
FOOTER_PATH = PARTIALS_DIR / "footer.html"
BACKUP_EXT = ".bak"

HEADER_START = "<!-- SITE_HEADER_START -->"
HEADER_END   = "<!-- SITE_HEADER_END -->"
FOOTER_START = "<!-- SITE_FOOTER_START -->"
FOOTER_END   = "<!-- SITE_FOOTER_END -->"

def read_partial(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Missing partial: {path}")
    return path.read_text(encoding="utf-8").strip() + "\n"

def ensure_backup(file_path: Path, original: str):
    bak = file_path.with_suffix(file_path.suffix + BACKUP_EXT)
    if not bak.exists():
        bak.write_text(original, encoding="utf-8")

def replace_block(html: str, start_marker: str, end_marker: str, new_block: str) -> tuple[str, bool]:
    """
    Replace a marked block if present. Returns (html, replaced?)
    """
    pattern = re.compile(re.escape(start_marker) + r".*?" + re.escape(end_marker), re.S)
    if pattern.search(html):
        return pattern.sub(new_block.strip(), html, count=1), True
    return html, False

def has_tag(html: str, tag: str) -> bool:
    return re.search(rf"<{tag}\b", html, re.I) is not None

def inject_after_body_open(html: str, snippet: str) -> tuple[str, bool]:
    """
    Insert snippet right after opening <body ...>.
    """
    m = re.search(r"<body\b[^>]*>", html, re.I)
    if not m:
        return html, False
    insert_at = m.end()
    return html[:insert_at] + "\n\n" + snippet + "\n" + html[insert_at:], True

def inject_before_body_close(html: str, snippet: str) -> tuple[str, bool]:
    """
    Insert snippet right before </body>.
    """
    m = re.search(r"</body\s*>", html, re.I)
    if not m:
        return html, False
    insert_at = m.start()
    return html[:insert_at] + "\n" + snippet + "\n\n" + html[insert_at:], True

def main():
    header = read_partial(HEADER_PATH)
    footer = read_partial(FOOTER_PATH)

    html_files = [p for p in ROOT.rglob("*.html") if PARTIALS_DIR not in p.parents]

    changed = 0
    skipped = 0
    problems = 0

    for path in html_files:
        original = path.read_text(encoding="utf-8", errors="ignore")

        html = original

        # 1) Replace marked blocks if already present
        html, header_replaced = replace_block(html, HEADER_START, HEADER_END, header)
        html, footer_replaced = replace_block(html, FOOTER_START, FOOTER_END, footer)

        # 2) If not replaced and there's no header tag, inject header
        if not header_replaced and not has_tag(html, "header"):
            html, ok = inject_after_body_open(html, header)
            if not ok:
                problems += 1
                skipped += 1
                continue

        # 3) If not replaced and there's no footer tag, inject footer
        if not footer_replaced and not has_tag(html, "footer"):
            html, ok = inject_before_body_close(html, footer)
            if not ok:
                problems += 1
                skipped += 1
                continue

        if html != original:
            ensure_backup(path, original)
            path.write_text(html, encoding="utf-8")
            changed += 1
        else:
            skipped += 1

    print(f"Header/Footer applied to {changed} EN files. Skipped {skipped}. Problems {problems}.")

if __name__ == "__main__":
    main()
