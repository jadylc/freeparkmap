// 页面结构 + 数据校验
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/../index.html", "utf8");
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
fs.writeFileSync(require("os").tmpdir() + "/_check3.js", blocks[blocks.length - 1][1]);
for (const id of ["collapse-btn", "expand-btn", "reset-btn", "chips", "search", "list", "panel", "map"]) {
  if (!html.includes('id="' + id + '"')) throw new Error("缺少元素: " + id);
}
if (html.includes("tile.openstreetmap.org")) throw new Error("OSM 瓦片图层未移除干净");
console.log("页面结构校验通过：所有元素齐全，OSM 已移除");
