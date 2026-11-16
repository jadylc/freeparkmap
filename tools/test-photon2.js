// Photon 查询词变体测试：纯商场名 + bbox 约束
const names = ["尚悦湾", "金谊广场", "丁香国际", "航头浦乐汇", "万嘉广场", "唐镇阳光天地", "前滩太古里", "南翔印象城"];

const BBOX = "120.85,30.65,122.25,31.90";

(async () => {
  for (const n of names) {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(n)}&limit=3&lang=default&bbox=${BBOX}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const j = await res.json();
      const fs = j.features || [];
      console.log(`[${n}] ${fs.length} 结果`);
      fs.forEach(f => {
        const p = f.properties || {};
        console.log(`   ${f.geometry.coordinates[1].toFixed(5)},${f.geometry.coordinates[0].toFixed(5)} ${JSON.stringify(p.name)} [${p.osm_value || p.type}]`);
      });
    } catch (e) {
      console.log(`[${n}] FAIL: ${e.message}`);
    }
  }
})();
