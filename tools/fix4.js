// fix4：用户确认的四项修正
// 1) 张江大桶天地 -> 张江大橘天地（改名+重新定位）
// 2) 兴业太古汇 与 太古汇 合并（同一商场，两条规则并到一条记录）
// 3) 前滩源 时长改为 4h
// 4) 浦发时光里 确认为免费8小时
// 最后重排 id 并写回 data.js
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
  // 1) 张江大橘天地：改名并重新定位
  const p1 = POIS.find(x => x.name === "张江大桶天地");
  if (p1) {
    p1.name = "张江大橘天地";
    let hit = null, all = [];
    for (const q of ["张江大橘天地", "大橘天地 张江", "大橘天地"]) {
      const list = await searchPOI(q);
      all = all.concat(list);
      hit = list.find(x => x.name.includes("大橘") && !x.name.includes("邻里"));
      if (hit) break;
    }
    if (hit) {
      p1.lng = hit.lng; p1.lat = hit.lat; p1.approx = false;
      console.log(`[FIXED] 张江大橘天地 -> ${hit.name} @ ${hit.lng},${hit.lat} (${hit.address})`);
    } else {
      console.log(`[WARN] 未搜到匹配商场，保持近似坐标。候选：${all.slice(0, 5).map(x => x.name).join(" | ") || "无"}`);
    }
  }

  // 2) 太古汇并入兴业太古汇
  const y = POIS.find(x => x.name === "兴业太古汇");
  const t = POIS.find(x => x.name === "太古汇");
  if (y && t) {
    y.rules.push(...t.rules);
    POIS.splice(POIS.indexOf(t), 1);
    console.log(`[MERGED] 太古汇 并入 兴业太古汇（现 ${y.rules.length} 条规则）`);
  }

  // 3) 前滩源 -> 4h
  const p3 = POIS.find(x => x.name === "前滩源");
  if (p3) { p3.rules[0].h = "4h"; console.log("[FIXED] 前滩源 -> 4h"); }

  // 4) 浦发时光里 -> 免费8小时
  const p4 = POIS.find(x => x.name === "浦发时光里");
  if (p4) { p4.rules[0] = { h: "8h", t: "免费8小时" }; console.log("[FIXED] 浦发时光里 -> 免费8小时"); }

  // 重排 id
  POIS.forEach((p, i) => { p.id = i + 1; });

  const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 为 GCJ-02 坐标（适配高德底图），由高德 POI 搜索（tools/geocode-amap.js）定位。
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
  fs.writeFileSync(path.join(ROOT, "data.js"), header + JSON.stringify(POIS, null, 1) + ";\n");
  console.log(`DONE: 共 ${POIS.length} 条，data.js 已更新`);
})();
