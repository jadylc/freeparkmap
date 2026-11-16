// 列出时长栏与说明文字矛盾的条目
const fs = require("fs");
const POIS = new Function(fs.readFileSync(__dirname + "/../data.js", "utf8") + "\nreturn POIS;")();

console.log("=== 已标记待核实的条目（原图时长栏与说明矛盾）===");
let n = 0;
for (const p of POIS) {
  for (const r of p.rules) {
    if (r.t.includes("待核实")) {
      n++;
      console.log(`${n}. ${p.name}（${p.district}）→ 时长栏【${r.h}】说明【${r.t}】`);
    }
  }
}

console.log("\n=== 额外发现：说明里的数字与时长栏不一致（未改动）===");
for (const p of POIS) {
  for (const r of p.rules) {
    const h = parseFloat(r.h);
    const m = r.t.match(/(\d+(?:\.\d+)?)\s*(?:小时|h)/);
    if (m && Math.abs(parseFloat(m[1]) - h) > 0.01 && !r.t.includes("待核实")) {
      console.log(`- ${p.name}（${p.district}）→ 时长栏【${r.h}】说明【${r.t}】`);
    }
  }
}
console.log(`\n小计：${n} 条已标记`);
