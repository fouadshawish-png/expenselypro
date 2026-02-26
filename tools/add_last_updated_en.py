import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("en")
BACKUP_EXT = ".bak"

def file_mtime_date(path: Path) -> str:
    dt = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    return dt.date().isoformat()

def has_time_tag_near_top(html: str) -> bool:
    # If any <time datetime="..."> exists, we consider it already present
    return re.search(r'<time[^>]+datetime=["\']([^"\']+)["\']', html, re.I) is not None

def add_last_updated(html: str, date_iso: str) -> str:
    # Insert right after first </h1>
    marker = "</h1>"
    if marker not in html:
        return html

    snippet = (
        f'{marker}\n'
        f'<p class="last-updated"><time datetime="{date_iso}">Last updated: {date_iso}</time></p>'
    )

    return html.replace(marker, snippet, 1)

def main():
    html_files = [p for p in ROOT.rglob("*.html")]
    changed = 0
    skipped = 0

    for path in html_files:
        original = path.read_text(encoding="utf-8", errors="ignore")

        # Only pages with H1 are treated as articles
        if not re.search(r"<h1[^>]*>.*?</h1>", original, re.I | re.S):
            skipped += 1
            continue

        # If already has a time tag, skip (avoid duplicates)
        if has_time_tag_near_top(original):
            skipped += 1
            continue

        date_iso = file_mtime_date(path)
        updated = add_last_updated(original, date_iso)

        if updated != original:
            bak = path.with_suffix(path.suffix + BACKUP_EXT)
            if not bak.exists():
                bak.write_text(original, encoding="utf-8")
            path.write_text(updated, encoding="utf-8")
            changed += 1
        else:
            skipped += 1

    print(f"Last updated inserted into {changed} files in /en/ (skipped {skipped}).")

if __name__ == "__main__":
    main()
