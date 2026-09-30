from pathlib import Path

msgs = Path(__file__).resolve().parents[1] / "apps" / "client-web" / "src" / "messages"
out = Path(__file__).resolve().parents[1] / ".tmp-i18n-check.txt"
lines = []
for p in sorted(msgs.glob("*.json")):
    text = p.read_text(encoding="utf-8")
    markers = sum(text.count(s) for s in ["Ã", "â€", "Â·", "Ð", "åŠ", "ë¶", "Ã©", "Ã¨"])
    lines.append(f"{p.name}: markers={markers}")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("wrote", out)
