// 高德 POI 文本搜索批量定位：读 data.js，逐条用高德"关键字搜索"API 定位（GCJ-02 原生坐标）
// 用法：$env:AMAP_KEY="<key>"; node tools/geocode-amap.js
// 流程：原名搜索 -> 未命中则用 RETRY 备用词 -> 仍未命中记入 miss（不写坐标）
// 输出：直接更新 ../data.js，并打印 miss 清单与名称对照供人工核对
const fs = require("fs");
const path = require("path");

const KEY = process.env.AMAP_KEY;
if (!KEY) { console.error("请先设置环境变量 AMAP_KEY"); process.exit(1); }

const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();

// 高德官方名称覆盖（攻略名与高德 POI 名不一致的）
const OVERRIDE = {
  "IFC国金中心": "上海国金中心商场IFC",
  "Costco浦东店": "开市客 上海浦东",
  "北蔡宜家": "宜家家居 上海北蔡商场",
  "徐汇宜家": "宜家家居 上海徐汇商场",
  "比斯特购物村": "比斯特上海购物村",
  "前滩L+plaza": "前滩L+PLAZA",
  "MOHO MALL": "MOHO商场 静安",
  "Livat荟聚": "荟聚中心 上海",
  "合生汇": "合生汇 五角场",
  "人广来福士": "来福士广场 西藏中路",
  "悠方购物中心": "悠方购物中心 上海",
  "山姆高科西路店": "山姆会员商店 高科西路",
  "山姆外高桥店": "山姆会员商店 外高桥",
  "山姆嘉定店": "山姆会员商店 嘉定",
  "山姆真如店": "山姆会员商店 真如",
  "山姆聚丰广场": "山姆会员商店 聚丰园路",
  "麦德龙（浦东店）": "麦德龙 御桥",
  "嘉里合集": "静安嘉里中心",
  "红星美凯龙真北路": "红星美凯龙 真北路",
  "近铁城市广场南区": "近铁城市广场",
  "Art Park大融城": "长宁大融城",
  "静安大宁时光里": "大宁时光里",
  "PJC平金中心": "平金中心 闵行"
};

// 原名未命中时的第二轮备用词
const RETRY = {
  "张江大桶天地": "张江天地",
  "山纲和润会": "和润会 闵行",
  "集颛桥": "颛桥 集生活",
  "ITC国汇茂": "国汇中心 徐汇",
  "红象汇": "红象汇 莘庄",
  "嘉定月光": "嘉亭荟城市生活广场",
  "宝山月光": "宝山日月光中心",
  "徐汇月光": "徐汇日月光中心",
  "金桥月光": "金桥太茂商业广场",
  "金环广场": "金环商务广场 普陀",
  "丁香国际": "丁香国际商业中心",
  "世纪汇": "世纪汇广场",
  "世博天地": "世博天地 浦东",
  "盈丰天地": "盈丰天地 浦东",
  "天荟": "天荟万科广场",
  "绚荟城": "绚荟城 闵行",
  "置业梦享家": "置业梦享家 闵行",
  "力波九坊": "力波九坊 闵行",
  "衡园莘光里": "莘光里",
  "慧华里": "慧华里 浦东",
  "EKA天物": "EKA·天物 浦东",
  "美达广场": "美达广场 浦东",
  "祝桥天和广场": "天和商业广场 浦东祝桥",
  "万嘉广场": "万嘉商业广场",
  "新环广场": "新环广场 浦东新场",
  "海上世界": "宝山海上世界",
  "定海神针观光塔": "吴淞口国际邮轮港 观光塔"
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function searchPOI(q) {
  const url = `https://restapi.amap.com/v3/place/text?key=${KEY}&keywords=${encodeURIComponent(q)}&city=上海市&citylimit=true&offset=3&page=1&output=json`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status !== "1") throw new Error(`API错误[${j.info}]`);
  if (!j.pois || !j.pois.length) return null;
  const p = j.pois[0];
  const [lng, lat] = p.location.split(",").map(Number);
  return { name: p.name, address: p.address, type: p.type, lng, lat };
}

(async () => {
  const audit = [];   // 名称对照，供人工核对
  const miss = [];
  let n = 0;
  for (const p of POIS) {
    let r = null;
    const q1 = OVERRIDE[p.name] || p.name;
    try { r = await searchPOI(q1); } catch (e) { console.log(`APIERR ${p.name}: ${e.message}`); process.exit(2); }
    if (!r && RETRY[p.name]) {
      try { r = await searchPOI(RETRY[p.name]); } catch (e) { console.log(`APIERR ${p.name}: ${e.message}`); process.exit(2); }
    }
    n++;
    if (r) {
      p.lng = r.lng; p.lat = r.lat; p.approx = false;
      audit.push({ id: p.id, from: p.name, to: r.name, address: r.address, type: r.type, lng: r.lng, lat: r.lat });
      console.log(`[${n}/${POIS.length}] OK  ${p.name} -> ${r.name} @ ${r.lng},${r.lat}`);
    } else {
      miss.push({ id: p.id, name: p.name, district: p.district });
      console.log(`[${n}/${POIS.length}] MISS ${p.name}`);
    }
    await sleep(360);
  }

  // 名称对照表落盘（不入库）
  fs.writeFileSync(path.join(__dirname, "amap-audit.json"), JSON.stringify({ audit, miss }, null, 1));

  if (miss.length) {
    console.log(`\nMISS ${miss.length} 条（未写入坐标，保留 null）：`);
    miss.forEach(m => console.log(`  ${m.district} / ${m.name}`));
  }

  // 写回 data.js
  const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 为 GCJ-02 坐标（适配高德底图），由高德 POI 搜索（tools/geocode-amap.js）定位。
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
  fs.writeFileSync(path.join(ROOT, "data.js"), header + JSON.stringify(POIS, null, 1) + ";\n");
  console.log(`\nDONE: ${POIS.length - miss.length}/${POIS.length} 条已写入坐标（GCJ-02），data.js 已更新`);
})();
