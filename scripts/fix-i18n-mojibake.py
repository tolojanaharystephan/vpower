"""Fix mojibake in locale JSON: UTF-8 bytes were misread as latin-1 then saved as UTF-8."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "apps" / "client-web" / "src" / "messages"
MARKERS = ("Ã", "â€", "Â·", "Â ", "Ð", "åŠ", "ë¶", "Ã©", "Ã¨", "Ã³", "Ã±")


def looks_mojibake(text: str) -> bool:
    return any(m in text for m in MARKERS)


def fix_text(text: str) -> str:
    """Best-effort undo of utf-8 -> latin-1 mojibake. Leaves text unchanged if undecodable."""
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def deep_fix(obj):
    if isinstance(obj, dict):
        return {k: deep_fix(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_fix(v) for v in obj]
    if isinstance(obj, str):
        if looks_mojibake(obj):
            fixed = fix_text(obj)
            # Only keep if it reduced mojibake markers
            if sum(fixed.count(m) for m in MARKERS) < sum(obj.count(m) for m in MARKERS):
                return fixed
        return obj
    return obj


def main() -> None:
    report = []
    for path in sorted(ROOT.glob("*.json")):
        raw = path.read_text(encoding="utf-8")
        before = sum(raw.count(m) for m in MARKERS)
        if before == 0:
            report.append(f"SKIP {path.name} (clean)")
            continue
        data = json.loads(raw)
        fixed_data = deep_fix(data)
        out = json.dumps(fixed_data, ensure_ascii=False, indent=2) + "\n"
        after = sum(out.count(m) for m in MARKERS)
        path.write_text(out, encoding="utf-8")
        report.append(f"FIXED {path.name}: markers {before} -> {after}")
    Path(__file__).resolve().parents[1].joinpath(".tmp-i18n-fix.txt").write_text(
        "\n".join(report) + "\n", encoding="utf-8"
    )
    print("\n".join(report))


if __name__ == "__main__":
    main()
