// 修正错配：对指定条目用多组备用词重新搜索并写回 data.js
// 用法：$env:AMAP_KEY="<key>"; node tools/fix-pois.js
const fs = require("fs");
const path = require("path");

const KEY = process.env.AMAP_KEY;
if (!KEY) { console.error("请先设置环境变量 AMAP_KEY"); process.exit(1); }

const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();

// name -> 依次尝试的搜索词
const FIXINGS = {
  "浦发唐城天地": ["唐城天地", "浦发唐城", "唐城天地 唐镇"],
  "张江大桶天地": ["张江天地", "张江 天地商业", "张江创新大厦"],
  "浦发唐镇印象汇": ["印象汇 唐镇", "唐镇印象汇", "印象汇 浦东"],
  "虹桥前湾印象城": ["前湾印象城", "印象城 华漕", "前湾印象城 闵行"],
  "保利悦活城": ["悦活城 嘉定", "保利悦活城 上海", "悦活城"],
  "信泰中心": ["信泰中心 真如", "信泰中心 普陀", "中环信泰中心"]
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function searchPOI(q) {
  const url = `https://restapi.amap.com/v3/place/text?key=${KEY}&keywords=${encodeURIComponent(q)}&city=上海市&citylimit=true&offset=5&page=1&output=json`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status !== "1") throw new Error(`API错误[${j.info}]`);
  return (j.pois || []).map(p => ({ name: p.name, address: p.address, lng: +p.location.split(",")[0], lat: +p.location.split(",")[1] }));
}

(async () => {
  const updated = {};
  for (const [name, tries] of Object.entries(FIXINGS)) {
    let candidates = [];
    for (const q of tries) {
      candidates = await searchPOI(q);
      if (candidates.length) break;
      await sleep(360);
    }
    if (!candidates.length) { console.log(`[NO RESULT] ${name}`); continue; }
    const c = candidates[0];
    const p = POIS.find(x => x.name === name);
    if (!p) { console.log(`[NOT IN DATA] ${name}`); continue; }
    p.lng = c.lng; p.lat = c.lat; p.approx = false;
    updated[name] = c;
    console.log(`[FIXED] ${name} -> ${c.name} @ ${c.lng},${c.lat} (${c.address})`);
    console.log(`        备选: ${candidates.slice(1, 3).map(x => x.name).join(" | ")}`);
    await sleep(360);
  }

  // 写回
  const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 为 GCJ-02 坐标（适配高德底图），由高德 POI 搜索（tools/geocode-amap.js）定位。
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
  fs.writeFileSync(path.join(ROOT, "data.js"), header + JSON.stringify(POIS, null, 1) + ";\n");
  console.log(`\nDONE: 修正 ${Object.keys(updated).length} 条，data.js 已更新`);
})();
