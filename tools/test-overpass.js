// Overpass 连通性测试 v2：带 UA，打印原始错误响应
const names = ["尚悦湾", "金谊广场", "丁香国际", "世博源", "南翔印象城", "第一八佰伴", "环球金融中心", "山姆会员商店"];
const rx = names.join("|");
const q = `[out:json][timeout:60];
(
  nwr["name"~"${rx}"](30.65,120.85,31.90,122.25);
);
out center 100;`;

const UA = "sh-free-parking-builder/1.0 (one-off data prep; contact: jadylc@noreply.gitee.com)";

(async () => {
  for (const ep of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.osm.jp/api/interpreter"]) {
    const t0 = Date.now();
    try {
      const res = await fetch(ep, {
        method: "POST",
        body: "data=" + encodeURIComponent(q),
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        signal: AbortSignal.timeout(45000)
      });
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        const els = j.elements || [];
        console.log(ep.split("/")[2], "->", res.status, els.length, "elements,", (Date.now() - t0) + "ms");
        els.slice(0, 15).forEach(e => console.log("  ", e.type, JSON.stringify(e.tags && e.tags.name), (e.center || e).lat, (e.center || e).lon));
      } catch {
        console.log(ep.split("/")[2], "->", res.status, "非JSON响应:", text.slice(0, 200).replace(/\n/g, " "));
      }
    } catch (e) {
      console.log(ep.split("/")[2], "-> FAIL:", e.message);
    }
  }
})();
