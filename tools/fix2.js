// 最终定向修复：
// 1) 浦发唐城天地 -> 用备选词「浦发唐镇印象天地」（唐镇的正确项目）
// 2) 张江大桶天地 -> 名称存疑无法确认，改用张江地铁站商圈近似坐标 + approx 标记
const fs = require("fs");
const path = require("path");

const KEY = process.env.AMAP_KEY;
const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function searchPOI(q) {
  const url = `https://restapi.amap.com/v3/place/text?key=${KEY}&keywords=${encodeURIComponent(q)}&city=上海市&citylimit=true&offset=3&page=1&output=json`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status !== "1") throw new Error(`API错误[${j.info}]`);
  return (j.pois || []).map(p => ({ name: p.name, address: p.address, lng: +p.location.split(",")[0], lat: +p.location.split(",")[1] }));
}

(async () => {
  // 1) 浦发唐城天地
  const p1 = POIS.find(x => x.name === "浦发唐城天地");
  const r1 = await searchPOI("浦发唐镇印象天地");
  if (p1 && r1.length) {
    p1.lng = r1[0].lng; p1.lat = r1[0].lat; p1.approx = false;
    console.log(`[FIXED] 浦发唐城天地 -> ${r1[0].name} @ ${r1[0].lng},${r1[0].lat} (${r1[0].address})`);
  } else console.log("[MISS] 浦发唐镇印象天地");

  // 2) 张江大桶天地：名称存疑，用张江高科站商圈近似
  const p2 = POIS.find(x => x.name === "张江大桶天地");
  if (p2) {
    p2.lng = 121.587932; p2.lat = 31.204837; p2.approx = true;
    console.log("[APPROX] 张江大桶天地 -> 张江高科站商圈近似坐标（approx=true，待用户确认商场名）");
  }

  const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 为 GCJ-02 坐标（适配高德底图），由高德 POI 搜索（tools/geocode-amap.js）定位。
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
  fs.writeFileSync(path.join(ROOT, "data.js"), header + JSON.stringify(POIS, null, 1) + ";\n");
  console.log("DONE data.js 已更新");
})();
