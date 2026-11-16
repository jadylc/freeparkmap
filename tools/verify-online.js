// 线上验收：页面、数据、静态资源逐项检查
const base = "https://freeparkmap-dpfe06bvbp3f.edgeone.cool";
(async () => {
  // 1. 首页 HTML
  let r = await fetch(base + "/");
  const html = await r.text();
  console.log("1) 首页:", r.status, "| 内容特征:", {
    标题: html.includes("上海免费停车点"),
    区筛选: html.includes('id="chips"'),
    引用datajs: html.includes('src="data.js"'),
    高德底图: html.includes("autonavi")
  });

  // 2. data.js 数据完整性
  r = await fetch(base + "/data.js");
  const dataText = await r.text();
  const POIS = new Function(dataText + "\nreturn POIS;")();
  const districts = new Set(POIS.map(p => p.district));
  const approx = POIS.filter(p => p.approx);
  const noCoord = POIS.filter(p => typeof p.lng !== "number");
  const zj = POIS.find(p => p.name.includes("大橘"));
  const ytg = POIS.find(p => p.name === "兴业太古汇");
  console.log("2) data.js:", r.status, "| 条目:", POIS.length, "| 区数:", districts.size,
    "| 近似坐标:", approx.map(p => p.name).join(",") || "无", "| 缺坐标:", noCoord.length);
  console.log("   张江大橘天地:", zj ? zj.lng + "," + zj.lat + " (approx:" + zj.approx + ")" : "未找到");
  console.log("   兴业太古汇规则数:", ytg ? ytg.rules.length : "未找到");

  // 3. Leaflet 资源
  r = await fetch(base + "/leaflet/leaflet.js");
  console.log("3) leaflet.js:", r.status, "| 大小:", (await r.arrayBuffer()).byteLength, "bytes");

  // 4. 响应头
  r = await fetch(base + "/");
  console.log("4) 响应头: HTTP", r.status, "| server:", r.headers.get("server") || "-", "| cache-control:", r.headers.get("cache-control") || "-");
})().catch(e => console.log("ERROR:", e.message));
