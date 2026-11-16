// fix3：浦发唐城天地 —— 在候选列表中按名称含"印象天地"筛选（银行 POI 权重高会排在前面）
const fs = require("fs");
const path = require("path");
const KEY = process.env.AMAP_KEY;
const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();

async function searchPOI(q) {
  const url = `https://restapi.amap.com/v3/place/text?key=${KEY}&keywords=${encodeURIComponent(q)}&city=上海市&citylimit=true&offset=10&page=1&output=json`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status !== "1") throw new Error(`API错误[${j.info}]`);
  return (j.pois || []).map(p => ({ name: p.name, address: p.address, lng: +p.location.split(",")[0], lat: +p.location.split(",")[1] }));
}

(async () => {
  const p = POIS.find(x => x.name === "浦发唐城天地");
  let hit = null;
  for (const q of ["浦发唐镇印象天地", "唐城天地"]) {
    const list = await searchPOI(q);
    hit = list.find(x => x.name.includes("印象天地"));
    if (hit) break;
  }
  if (hit) {
    p.lng = hit.lng; p.lat = hit.lat; p.approx = false;
    console.log(`[FIXED] 浦发唐城天地 -> ${hit.name} @ ${hit.lng},${hit.lat} (${hit.address})`);
  } else {
    console.log("[MISS] 未找到印象天地");
  }
  const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 为 GCJ-02 坐标（适配高德底图），由高德 POI 搜索（tools/geocode-amap.js）定位。
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
  fs.writeFileSync(path.join(ROOT, "data.js"), header + JSON.stringify(POIS, null, 1) + ";\n");
  console.log("DONE");
})();
