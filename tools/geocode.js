// 批量地理编码：为 data.js 中的商场获取坐标
// 使用 Photon (photon.komoot.io，基于 OSM 数据，免费无 key)，3 路并发
// 输出 geo.json：{ 商场名: { lng, lat, display } | null }  坐标为 WGS-84，后续转 GCJ-02
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POIS = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "\nreturn POIS;")();

// 特殊查询词覆盖（攻略名与官方名不一致的）
const OVERRIDE = {
  "IFC国金中心": "上海国金中心商场",
  "环球金融中心": "上海环球金融中心",
  "Costco浦东店": "开市客 上海",
  "第一八佰伴": "上海第一八佰伴",
  "北蔡宜家": "宜家家居 北蔡商场",
  "徐汇宜家": "宜家家居 上海徐汇商场",
  "比斯特购物村": "比斯特上海购物村",
  "前滩L+plaza": "前滩L+PLAZA",
  "MOHO MALL": "MOHO 静安",
  "Livat荟聚": "上海荟聚中心",
  "合生汇": "合生汇 五角场",
  "人广来福士": "上海来福士广场",
  "悠方购物中心": "悠方购物中心 上海",
  "山姆高科西路店": "山姆会员商店 高科西路",
  "山姆外高桥店": "山姆会员商店 外高桥",
  "山姆嘉定店": "山姆会员商店 嘉定",
  "山姆真如店": "山姆会员商店 真如",
  "山姆聚丰广场": "山姆会员商店 聚丰园路",
  "张江大桶天地": "张江天地",
  "静安大宁时光里": "大宁时光里",
  "嘉里合集": "静安嘉里中心",
  "麦德龙（浦东店）": "麦德龙 上海浦东"
};

// 上海市域 bbox：minLon,minLat,maxLon,maxLat
const BBOX = "120.85,30.65,122.25,31.90";
const CONCURRENCY = 3;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function geocodeOne(p) {
  const q = OVERRIDE[p.name] || `${p.name} ${p.district} 上海`;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=default&bbox=${BBOX}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await res.json();
  if (j.features && j.features.length) {
    const f = j.features[0];
    const [lng, lat] = f.geometry.coordinates;
    const props = f.properties || {};
    return { lng: +lng.toFixed(6), lat: +lat.toFixed(6), display: [props.name, props.city, props.district, props.street].filter(Boolean).join(",").slice(0, 60) };
  }
  return null;
}

(async () => {
  const out = {};
  const miss = [];
  let done = 0;
  const queue = [...POIS];

  async function worker(id) {
    while (queue.length) {
      const p = queue.shift();
      try {
        out[p.name] = await geocodeOne(p);
      } catch (e) {
        out[p.name] = null;
      }
      done++;
      console.log(`[${done}/${POIS.length}] ${p.name} -> ${out[p.name] ? "OK " + out[p.name].display : "MISS"}`);
      if (!out[p.name]) miss.push({ name: p.name, district: p.district });
      await sleep(200);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  fs.writeFileSync(path.join(__dirname, "geo.json"), JSON.stringify(out, null, 1));
  console.log(`DONE: hit ${POIS.length - miss.length}/${POIS.length}`);
  console.log("MISS list:", JSON.stringify(miss, null, 1));
})();
