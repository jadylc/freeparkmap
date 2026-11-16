// 列出所有规则，标出"可能含糊"的条目供审查
// 含糊特征：t 很短、含"、"/","但无明确动词、只有名词短语
const fs = require("fs");
const POIS = new Function(fs.readFileSync(__dirname + "/../data.js", "utf8") + "\nreturn POIS;")();

let n = 0;
for (const p of POIS) {
  for (let i = 0; i < p.rules.length; i++) {
    const r = p.rules[i];
    const suspicious = r.t.length <= 12 || /[、,，]$/.test(r.t) || /^[、,，]/.test(r.t);
    if (suspicious) {
      n++;
      console.log(`${suspicious ? "?" : " "} [${p.id}] ${p.name} | ${r.h} | ${r.t}`);
    }
  }
}
console.log(`\n可疑条目 ${n} 条`);
