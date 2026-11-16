// ArcGIS World Geocoder 连通性与中文命中测试（无需 key）
const queries = [
  "陆家嘴尚悦湾 上海",
  "上海环球港",
  "南翔印象城MEGA",
  "上海第一八佰伴",
  "佛罗伦萨小镇 上海浦东",
  "世博源 上海",
  "金谊广场 上海浦东"
];

(async () => {
  for (const q of queries) {
    const url = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&outFields=*&langCode=zh&singleLine=" + encodeURIComponent(q);
    const t0 = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const j = await res.json();
      const c = (j.candidates || [])[0];
      if (c) {
        console.log(`[${q}] score=${c.score} -> ${c.location.y.toFixed(5)}, ${c.location.x.toFixed(5)} (${c.address}) ${(Date.now() - t0)}ms`);
      } else {
        console.log(`[${q}] MISS ${(Date.now() - t0)}ms`);
      }
    } catch (e) {
      console.log(`[${q}] FAIL: ${e.message}`);
    }
  }
})();
