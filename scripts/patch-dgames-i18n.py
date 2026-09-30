from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "apps" / "client-web" / "src" / "messages"

PORTAL = {
    "es": (
        "Catalogo GamesAPI",
        "dgamesonline: saldo VPower777, titulos via openGame, callbacks de wallet en tiempo real.",
    ),
    "ja": (
        "GamesAPI catalog",
        "dgamesonline: VPower777 balance, openGame, realtime wallet.",
    ),
    "ko": (
        "GamesAPI catalog",
        "dgamesonline: VPower777 balance, openGame, realtime wallet.",
    ),
    "mn": (
        "GamesAPI catalog",
        "dgamesonline: VPower777 balance, openGame, realtime wallet.",
    ),
    "nl": (
        "GamesAPI-catalogus",
        "dgamesonline: VPower777-saldo, titels via openGame, realtime wallet-callbacks.",
    ),
    "zh": (
        "GamesAPI catalog",
        "dgamesonline: VPower777 balance, openGame, realtime wallet.",
    ),
}

PLAY_EN = {
    "title": "dgamesonline",
    "body": "Pick a title. Your VPower777 dgamesonline balance is used on every spin.",
    "loginTitle": "Sign in first",
    "loginBody": "A VPower777 account unlocks the dgamesonline lobby.",
    "loginCta": "Sign in",
    "entering": "Opening...",
    "enterError": "Unable to open dgamesonline. Check hall / API configuration.",
    "empty": "No games yet - the dgamesonline hall may not be configured.",
    "openExternal": "New tab",
    "backProviders": "Back to rooms",
}

PLAY = {
    "es": {
        "title": "dgamesonline",
        "body": "Elige un titulo. Tu saldo dgamesonline VPower777 se usa en cada spin.",
        "loginTitle": "Inicia sesion primero",
        "loginBody": "Una cuenta VPower777 desbloquea el lobby dgamesonline.",
        "loginCta": "Iniciar sesion",
        "entering": "Abriendo...",
        "enterError": "No se pudo abrir dgamesonline. Revisa la config hall / API.",
        "empty": "Sin juegos aun - el hall dgamesonline puede no estar configurado.",
        "openExternal": "Nueva pestana",
        "backProviders": "Volver a salas",
    },
    "ja": PLAY_EN,
    "ko": PLAY_EN,
    "mn": PLAY_EN,
    "nl": {
        "title": "dgamesonline",
        "body": "Kies een titel. Je VPower777 dgamesonline-saldo wordt bij elke spin gebruikt.",
        "loginTitle": "Eerst inloggen",
        "loginBody": "Een VPower777-account opent de dgamesonline-lobby.",
        "loginCta": "Inloggen",
        "entering": "Openen...",
        "enterError": "dgamesonline kon niet worden geopend. Check hall / API-config.",
        "empty": "Nog geen games - de dgamesonline-hall is mogelijk niet geconfigureerd.",
        "openExternal": "Nieuw tabblad",
        "backProviders": "Terug naar rooms",
    },
    "zh": PLAY_EN,
}


def main() -> None:
    log: list[str] = []
    for loc, (tag, body) in PORTAL.items():
        path = BASE / f"{loc}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        portal = data.setdefault("portal", {})
        portal["dgamesTagline"] = tag
        portal["dgamesBody"] = body
        data["dgamesPlay"] = PLAY[loc]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        log.append(f"updated {loc} tag={portal.get('dgamesTagline')!r}")
    out = ROOT / "scripts" / "_i18n_out.txt"
    out.write_text("\n".join(log) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
