import fs from "node:fs";
const t = fs.readFileSync(
  "C:/Users/Tolojanahary/.cursor/projects/c-Users-Tolojanahary-Desktop-vpower777/terminals/360959.txt",
  "utf8",
);
const head = t.match(/HEAD [0-9a-f]{7}/g);
const health = t.includes('"status":"ok"');
const migrate = t.includes("0016") || t.includes("single_cashier");
console.log("heads", head?.slice(-3).join(" "));
console.log("health", health);
console.log("mentions0016", migrate);
console.log("exit0", t.includes("exit=0"));
