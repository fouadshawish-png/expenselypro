import re, json
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urljoin

DOMAIN = "https://www.expenselypro.com"
ROOT = Path("en")  # ضمن نطاق /en/ فقط
BACKUP_EXT = ".bak"

LDJSON_RE = re.compile(
    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>\s*(.*?)\s*</script>',
    re.I | re.S
)

def strip_article_faq_ldjson(html: str) -> str:
    """
    Remove only JSON-LD blocks whose @type is Article or FAQPage.
    Keep any other schema types intact.
    """
    def repl(m):
        payload = m.group(1).strip()
        try:
            obj = json.loads(payload)
        except Exception:
            return m.group(0)  # not valid JSON -> keep
        t = obj.get("@type")
        # @type can be list or string
        types = set(t) if isinstance(t, list) else {t}
        if "Article" in types or "FAQPage" in types:
            return ""
        return m.group(0)

    return LDJSON_RE.sub(repl, html)

def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def get_canonical(html: str) -> str:
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, re.I)
    return m.group(1).strip() if m else ""

def get_h1(html: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    return strip_tags(m.group(1)) if m else ""

def get_meta_description(html: str) -> str:
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
    if m:
        return strip_tags(m.group(1))
    # fallback: first paragraph
    pm = re.search(r"<p[^>]*>(.*?)</p>", html, re.I | re.S)
    return strip_tags(pm.group(1)) if pm else ""

def get_time_datetime(html: str) -> str:
    # Accept <time datetime="2026-02-26"> or <time datetime="2026-02-26T10:00:00Z">
    m = re.search(r'<time[^>]+datetime=["\']([^"\']+)["\']', html, re.I)
    return m.group(1).strip() if m else ""

def file_mtime_iso(path: Path) -> str:
    ts = path.stat().st_mtime
    # Use UTC date (stable) with full ISO date only
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    return dt.date().isoformat()

def first_image_abs(html: str, canonical: str) -> str:
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
    if not m:
        return ""
    src = m.group(1).strip()
    # If already absolute
    if re.match(r"^https?://", src, re.I):
        return src
    # Prefer canonical as base if exists, else domain
    base = canonical if canonical else DOMAIN + "/en/"
    return urljoin(base, src)

def detect_faq_pairs(html: str):
    """
    Detect FAQ sections:
    - Find H2 that contains 'FAQ' or 'Questions' or Arabic 'أسئلة'
    - Inside until next H2 (lookahead), extract repeated (H3 + P) pairs.
    """
    faq_entities = []

    # Find FAQ blocks (H2 ... until next H2 or </main> or </body>)
    block_re = re.compile(
        r"<h2[^>]*>\s*([^<]*(FAQ|Questions|أسئلة)[^<]*)\s*</h2>\s*(.*?)\s*(?=(<h2[^>]*>|</main>|</body>))",
        re.I | re.S
    )

    qa_re = re.compile(
        r"<h3[^>]*>\s*(.*?)\s*</h3>\s*<p[^>]*>\s*(.*?)\s*</p>",
        re.I | re.S
    )

    for _title, _kw, block, _stop in block_re.findall(html):
        for q, a in qa_re.findall(block):
            qclean = strip_tags(q)
            aclean = strip_tags(a)
            if qclean and aclean:
                faq_entities.append({
                    "@type": "Question",
                    "name": qclean,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": aclean
                    }
                })

    return faq_entities[:8]

def build_article_schema(headline, description, canonical, date_pub, date_mod, image_abs):
    obj = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": headline,
        "description": description,
        "author": {"@type": "Person", "name": "Fouad Shawish"},
        "datePublished": date_pub,
        "dateModified": date_mod,
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "publisher": {
            "@type": "Organization",
            "name": "Expensely Pro",
            "logo": {"@type": "ImageObject", "url": "https://www.expenselypro.com/icon.png"}
        }
    }
    if image_abs:
        obj["image"] = image_abs
    return obj

def build_faq_schema(faq_entities):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq_entities
    }

def inject_into_head(html: str, scripts: str) -> str:
    if "</head>" in html:
        return html.replace("</head>", scripts + "\n</head>", 1)
    # fallback: prepend
    return scripts + "\n" + html

def main():
    html_files = [p for p in ROOT.rglob("*.html")]

    changed = 0
    skipped = 0

    for path in html_files:
        original = path.read_text(encoding="utf-8", errors="ignore")

        # Only process pages that look like articles: must have <h1> and canonical in /en/
        canonical = get_canonical(original)
        headline = get_h1(original)

        if not headline:
            skipped += 1
            continue

        # Remove old Article/FAQ JSON-LD only
        cleaned = strip_article_faq_ldjson(original)

        # Extract fields
        description = get_meta_description(cleaned)[:300]
        description = re.sub(r"\s+", " ", description).strip()

        # Dates: prefer <time datetime>, fallback to file mtime
        time_dt = get_time_datetime(cleaned)
        date_mod = time_dt if time_dt else file_mtime_iso(path)
        date_pub = date_mod  # fallback strategy

        # Canonical fallback (construct from file path)
        if not canonical:
            rel = "/" + str(path).replace("\\", "/")  # en/...
            # Convert en/index.html -> /en/
            if rel.endswith("/index.html"):
                rel = rel[:-10] + "/"  # remove index.html
            canonical = urljoin(DOMAIN + "/", rel)

        image_abs = first_image_abs(cleaned, canonical)

        # Build schemas
        article_obj = build_article_schema(headline, description, canonical, date_pub, date_mod, image_abs)
        article_script = '<script type="application/ld+json">' + json.dumps(article_obj, ensure_ascii=False) + '</script>'

        faq_entities = detect_faq_pairs(cleaned)
        faq_script = ""
        if faq_entities:
            faq_obj = build_faq_schema(faq_entities)
            faq_script = '\n<script type="application/ld+json">' + json.dumps(faq_obj, ensure_ascii=False) + '</script>'

        scripts = "\n" + article_script + faq_script + "\n"

        updated = inject_into_head(cleaned, scripts)

        if updated != original:
            # backup once
            bak = path.with_suffix(path.suffix + BACKUP_EXT)
            if not bak.exists():
                bak.write_text(original, encoding="utf-8")
            path.write_text(updated, encoding="utf-8")
            changed += 1
        else:
            skipped += 1

    print(f"Structured data injected into {changed} files in /en/ (skipped {skipped}).")

if __name__ == "__main__":
    main()
