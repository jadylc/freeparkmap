// 坐标合并：读 tools/geo.json（Photon 结果，WGS-84），转换 GCJ-02 后写回 data.js
// 未命中的用 FALLBACK 近似坐标（GCJ-02，区/商圈级精度），并标记 approx=true
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();
const geo = JSON.parse(fs.readFileSync(path.join(__dirname, "geo.json"), "utf8"));

// 兜底近似坐标（GCJ-02）：Photon 未命中的商场，取区中心/所属商圈的大致位置
const FALLBACK = {
};

/* ---------- WGS-84 -> GCJ-02（火星坐标系）标准近似算法，误差约 1-2 米 ---------- */
const A = 6378245.0, EE = 0.00669342162296594323;
function outOfChina(lat, lng) { return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271; }
function tLat(x, y) {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  r += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
  r += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
  return r;
}
function tLng(x, y) {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  r += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
  r += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
  return r;
}
function wgs2gcj(lat, lng) {
  if (outOfChina(lat, lng)) return [lat, lng];
  let dLat = tLat(lng - 105, lat - 35), dLng = tLng(lng - 105, lat - 35);
  const radLat = lat / 180 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sq = Math.sqrt(magic);
  dLat = (dLat * 180) / ((A * (1 - EE)) / (magic * sq) * Math.PI);
  dLng = (dLng * 180) / (A / sq * Math.cos(radLat) * Math.PI);
  return [+(lat + dLat).toFixed(6), +(lng + dLng).toFixed(6)];
}

/* ---------- 合并 ---------- */
const results = [];
for (const p of POIS) {
  const g = geo[p.name];
  if (g) {
    const [lat, lng] = wgs2gcj(g.lat, g.lng);
    p.lng = lng; p.lat = lat; p.approx = false;
  } else if (FALLBACK[p.name]) {
    [p.lat, p.lng] = FALLBACK[p.name];
    p.approx = true;
  } else {
    results.push({ missNoFallback: p.name, district: p.district });
    continue;
  }
  results.push({ name: p.name, lng: p.lng, lat: p.lat, approx: p.approx, src: g ? "photon" : "fallback" });
}

const noFallback = results.filter(r => r.missNoFallback);
if (noFallback.length) {
  console.log("以下地点既无编码结果也无兜底坐标，请在 merge.js 的 FALLBACK 表中补齐：");
  noFallback.forEach(r => console.log(`  ${r.district} / ${r.missNoFallback}`));
  process.exit(1);
}

/* ---------- 重新生成 data.js ---------- */
const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 坐标为 GCJ-02（适配高德底图），由 tools/geocode.js + tools/merge.js 生成：
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
fs.writeFileSync(path.join(ROOT, "data.js"), header + JSON.stringify(POIS, null, 1) + ";\n");

const approxCount = results.filter(r => r.approx).length;
console.log(`DONE: ${results.length} 条坐标已写入（photon 精确定位 ${results.length - approxCount}，近似兜底 ${approxCount}）`);
