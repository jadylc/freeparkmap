// 质检：检查每条记录的坐标是否落在所属区的粗略范围内，输出可疑清单 + 全部名称对照
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();

// 各区粗略中心 [lat, lng, 半径(度)]（GCJ-02 近似）
const REGIONS = {
  "浦东新区": [31.15, 121.55, 0.60],
  "闵行区":   [31.12, 121.38, 0.30],
  "杨浦区":   [31.29, 121.52, 0.15],
  "青浦区":   [31.15, 121.12, 0.35],
  "长宁区":   [31.22, 121.39, 0.15],
  "黄浦区":   [31.23, 121.48, 0.10],
  "嘉定区":   [31.37, 121.26, 0.35],
  "虹口区":   [31.27, 121.49, 0.12],
  "静安区":   [31.26, 121.45, 0.20],
  "徐汇区":   [31.19, 121.44, 0.13],
  "松江区":   [31.03, 121.22, 0.35],
  "普陀区":   [31.24, 121.39, 0.15],
  "宝山区":   [31.39, 121.45, 0.25]
};

console.log("=== 越界可疑清单 ===");
let bad = 0;
for (const p of POIS) {
  const [clat, clng, r] = REGIONS[p.district] || [31.2, 121.47, 0.5];
  const d = Math.max(Math.abs(p.lat - clat), Math.abs(p.lng - clng));
  if (d > r) {
    bad++;
    console.log(`  [${p.id}] ${p.district} / ${p.name} @ ${p.lng},${p.lat} (偏出 ${d.toFixed(2)}°)`);
  }
}
console.log(bad ? `共 ${bad} 条越界` : "全部通过\n");

console.log("=== 名称对照表（from=攻略名 -> to=高德POI名）===");
const audit = JSON.parse(fs.readFileSync(path.join(__dirname, "amap-audit.json"), "utf8"));
for (const a of audit.audit) {
  const mark = a.from === a.to ? "  =" : "  ~";
  console.log(`${mark} [${a.id}] ${a.from} -> ${a.to} @ ${a.lng},${a.lat}`);
}
console.log("\nMISS:", JSON.stringify(audit.miss));
