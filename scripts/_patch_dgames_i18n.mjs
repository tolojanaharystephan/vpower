import fs from "node:fs";
import path from "node:path";

const BASE = path.join(
  "C:",
  "Users",
  "Tolojanahary",
  "Desktop",
  "vpower777",
  "apps",
  "client-web",
  "src",
  "messages",
);

const PLAY_EN = {
  title: "dgamesonline",
  body: "Pick a title. Your VPower777 dgamesonline balance is used on every spin.",
  loginTitle: "Sign in first",
  loginBody: "A VPower777 account unlocks the dgamesonline lobby.",
  loginCta: "Sign in",
  entering: "Opening…",
  enterError: "Unable to open dgamesonline. Check hall / API configuration.",
  empty: "No games yet — the dgamesonline hall may not be configured.",
  openExternal: "New tab",
  backProviders: "Back to rooms",
};

const PORTAL = {
  es: [
    "Catálogo GamesAPI",
    "dgamesonline: saldo VPower777, títulos vía openGame, callbacks de wallet en tiempo real.",
  ],
  ja: ["GamesAPIカタログ", "dgamesonline：VPower777残高、openGame、リアルタイムウォレット。"],
  ko: ["GamesAPI 카탈로그", "dgamesonline: VPower777 잔액, openGame, 실시간 지갑."],
  mn: ["GamesAPI каталог", "dgamesonline: VPower777 үлдэгдэл, openGame, бодит цагийн түрийвч."],
  nl: [
    "GamesAPI-catalogus",
    "dgamesonline: VPower777-saldo, titels via openGame, realtime wallet-callbacks.",
  ],
  zh: ["GamesAPI 目录", "dgamesonline：VPower777 余额、openGame、实时钱包回调。"],
};

const PLAY = {
  es: {
    title: "dgamesonline",
    body: "Elige un título. Tu saldo dgamesonline VPower777 se usa en cada spin.",
    loginTitle: "Inicia sesión primero",
    loginBody: "Una cuenta VPower777 desbloquea el lobby dgamesonline.",
    loginCta: "Iniciar sesión",
    entering: "Abriendo…",
    enterError: "No se pudo abrir dgamesonline. Revisa la config hall / API.",
    empty: "Sin juegos aún — el hall dgamesonline puede no estar configurado.",
    openExternal: "Nueva pestaña",
    backProviders: "Volver a salas",
  },
  ja: PLAY_EN,
  ko: PLAY_EN,
  mn: PLAY_EN,
  nl: {
    title: "dgamesonline",
    body: "Kies een titel. Je VPower777 dgamesonline-saldo wordt bij elke spin gebruikt.",
    loginTitle: "Eerst inloggen",
    loginBody: "Een VPower777-account opent de dgamesonline-lobby.",
    loginCta: "Inloggen",
    entering: "Openen…",
    enterError: "dgamesonline kon niet worden geopend. Check hall / API-config.",
    empty: "Nog geen games — de dgamesonline-hall is mogelijk niet geconfigureerd.",
    openExternal: "Nieuw tabblad",
    backProviders: "Terug naar rooms",
  },
  zh: {
    title: "dgamesonline",
    body: "选择一款游戏。每次旋转使用你的 VPower777 dgamesonline 余额。",
    loginTitle: "请先登录",
    loginBody: "VPower777 账户可解锁 dgamesonline 大厅。",
    loginCta: "登录",
    entering: "打开中…",
    enterError: "无法打开 dgamesonline。请检查 hall / API 配置。",
    empty: "暂无游戏 — dgamesonline 大厅可能尚未配置。",
    openExternal: "新标签页",
    backProviders: "返回房间",
  },
};

const lines = [];
for (const [loc, [tag, body]] of Object.entries(PORTAL)) {
  const file = path.join(BASE, `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.portal = data.portal || {};
  data.portal.dgamesTagline = tag;
  data.portal.dgamesBody = body;
  if (typeof data.portal.providersLine === "string" && !data.portal.providersLine.includes("dgames")) {
    data.portal.providersLine = data.portal.providersLine.replace(/\s*$/, "") + " · dgamesonline";
  }
  data.dgamesPlay = PLAY[loc];
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  lines.push(`updated ${loc}`);
}
console.log(lines.join("\n"));
