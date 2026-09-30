from pathlib import Path
import json

ROOT = Path(r"C:\Users\Tolojanahary\Desktop\vpower777\apps\client-web\src\messages")
TARGETS = ["es.json", "zh.json", "ja.json", "ko.json", "nl.json", "mn.json"]
REPORT = Path(r"C:\Users\Tolojanahary\Desktop\vpower777\.tmp-i18n-fix.txt")

lines = []
for name in TARGETS:
    path = ROOT / name
    raw = path.read_text(encoding="utf-8")
    fixed = None
    err = None
    for enc in ("cp1252", "latin-1"):
        try:
            candidate = raw.encode(enc).decode("utf-8")
            json.loads(candidate)
            fixed = candidate
            used = enc
            break
        except Exception as e:
            err = f"{enc}:{e}"
    if fixed is None:
        lines.append(f"FAIL {name}: {err}")
        continue
    path.write_text(fixed, encoding="utf-8", newline="\n")
    sample = json.loads(fixed)["common"]["loading"]
    lines.append(f"OK {name} via {used}: loading={sample!r}")

REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
