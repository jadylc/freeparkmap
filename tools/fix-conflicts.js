// 时长栏与说明矛盾：按用户决定取"文字口径"，时长以说明文字为准
const fs = require("fs");
const ROOT = __dirname + "/..";
const POIS = new Function(fs.readFileSync(ROOT + "/data.js", "utf8") + "\nreturn POIS;")();

const FIX = [
  { name: "绿洲智谷·花园里", oldH: "8h", newH: "4h", newT: "周末及节假日免费停车4小时" },
  { name: "Art Park大融城", oldH: "3h", newH: "1h", newT: "会员任意消费免费停车1小时" },
  { name: "虹口龙之梦", oldH: "4h", newH: "3h", newT: "600积分兑换3小时停车" },
  { name: "尚湾里", oldH: "3h", newH: "2h", newT: "消费满19.9元免费停车2小时" },
  { name: "宝山经纬汇", oldH: "3h", newH: "1h", newT: "任意消费并积分免费停车1小时" }
];

let changed = 0;
for (const f of FIX) {
  const p = POIS.find(x => x.name === f.name);
  if (!p) throw new Error("找不到商场: " + f.name);
  const r = p.rules.find(x => x.h === f.oldH);
  if (!r) throw new Error("找不到规则: " + f.name + " " + f.oldH);
  console.log(`${p.name}: 【${r.h}】-> 【${f.newH}】 | 【${r.t}】-> 【${f.newT}】`);
  r.h = f.newH;
  r.t = f.newT;
  changed++;
}

const header = `/* 上海免费停车点数据
 * 来源：用户提供的攻略图集（2025-11 整理），按区分组转录。
 * rules 数组支持一个商场多条免费规则；h=时长，t=条件说明。
 * lng/lat 为 GCJ-02 坐标（适配高德底图），由高德 POI 搜索定位。
 * approx=true 表示坐标为近似位置，建议导航前用商场名二次确认。
 */
const POIS = `;
fs.writeFileSync(ROOT + "/data.js", header + JSON.stringify(POIS, null, 1) + ";\n");
console.log("共修正", changed, "条（按文字口径）");
