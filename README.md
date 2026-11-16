# 上海免费停车点地图

纯静态单页应用：无需任何服务器后端，数据一次性内置，可直接部署到腾讯云 EdgeOne Pages（国内访问快）或 Cloudflare Pages。

当前数据：**13 个区、185 个商场、155 条无门槛 + 30 条需消费规则**（2025-11 攻略图集转录）。

## 目录结构

```
sh-free-parking/
├── index.html          页面（搜索/区筛选/地图/移动端抽屉）
├── data.js             POIS 数据数组（185 条，含 GCJ-02 坐标）
├── leaflet/            Leaflet 1.9.4 本地副本（无 CDN 依赖）
├── README.md
└── tools/              数据生产脚本（可选，不入部署包也无妨）
    ├── geocode-amap.js   高德 POI 批量定位（需自己的 AMAP_KEY）
    ├── fix-pois.js       定向修正错配
    ├── check-audit.js    坐标区范围质检 + 名称对照
    └── merge.js          WGS-84→GCJ-02 转换（OSM 数据路径）
```

## 本地查看

直接双击 `index.html` 即可在浏览器打开（无需启动任何服务）。

## 更新数据

编辑 `data.js` 中的 `POIS` 数组，每条记录：

```js
{
  id: 1, name: "商场名", district: "××区", tier: "无门槛" | "需消费",
  rules: [ { h: "3h", t: "周末节假日" } ],   // 一个商场可有多条规则
  lng: 121.51, lat: 31.24,                  // GCJ-02 坐标
  approx: false                             // true=近似坐标，页面会提示
}
```

**坐标校准**：若发现点位不准，用高德坐标拾取器 https://lbs.amap.com/tools/picker 拾取正确位置，替换对应记录的 lng/lat（approx 改为 false）即可。

**批量重定位**（可选）：`tools/geocode-amap.js` 用高德 Web 服务 POI 搜索自动定位，需注册高德开放平台获取"Web 服务"类型 key：

```powershell
$env:AMAP_KEY = "你的key"
node tools/geocode-amap.js     # 搜索并写回 data.js
node tools/check-audit.js      # 质检：区范围越界检查 + 名称对照
```

key 不要写进任何入库文件（本仓库脚本均从环境变量读取）。

## 数据来源与已知存疑项

数据转录自 2025-11 的"上海各区免费停车攻略"图集（部分区的图尚未提供）。以下条目请留意：

- **张江大桶天地**（浦东）：名称疑似图集误字，高德无匹配商场，目前使用张江高科站商圈近似坐标（`approx: true`，页面有提示），待确认商场名后修正
- **太古汇**与**兴业太古汇**（静安）：为同一商场，图中作为两条规则分别列出，两点重叠属正常
- **前滩源**：图中时长栏 3h 但说明写"免费4小时"；**浦发时光里**：图中时长栏 8h 但说明写"免费6小时"——均照原图转录，建议向商场核实
- 部分名称已按高德官方 POI 确认：如"山纲和润会"实为**山钢和润荟**（浦江镇）、"莘庄缇璟印象城"实为**莘庄维璟印象城**、"ITC国汇茂"对应 **One ITC**（徐家汇）

## 推送到 Gitee 仓库

```bash
git add -A
git commit -m "数据更新"
git push -u origin main        # 首次推送，按提示登录 Gitee（密码或私人令牌）
```

远程仓库已配置：https://gitee.com/jadylc/freeparkmap.git

## 部署到腾讯云 EdgeOne Pages（国内访问更快，推荐）

腾讯 EdgeOne Pages（现名 Makers）免费版：请求与流量均不限量、40 个项目、5GB 存储。入口：https://pages.edgeone.ai

**方法一：控制台直接上传（最简单）**
1. 登录控制台 → Makers → 创建项目 → 直接上传（Direct Upload）
2. 把本目录整个文件夹拖进去，部署完成得到 `xxx.edgeone.app` 地址（默认域名国内可访问，无需备案）

**方法二：导入 Gitee 仓库（推荐，推送即自动部署）**
1. 控制台 → Makers → 创建项目 → 导入 Git 仓库 → 选择 Gitee 授权
2. 选择 `freeparkmap` 仓库，构建命令留空、输出目录填 `/`
3. 之后每次 `git push` 自动重新部署

**方法三：EdgeOne CLI**
```bash
npm install -g edgeone
edgeone login
edgeone pages deploy
```

> 注意：使用平台默认域名（`*.edgeone.app`）无需 ICP 备案；绑定自定义域名并要求大陆节点加速时，域名需完成 ICP 备案。

## 部署到 Cloudflare Pages（海外访客补充）

1. 打开 https://dash.cloudflare.com → Workers 和 Pages → 创建 → Pages → "直接上传"，拖入本目录即可
2. 或 CLI：`npm install -g wrangler && wrangler login && wrangler pages deploy . --project-name=sh-free-parking`
3. 免费版限制：500 次构建/月、20,000 文件、单文件 25 MiB；静态请求不计费

## 功能清单

- 高德街道底图（默认，GCJ-02）/ OpenStreetMap 可切换（右上角）
- 搜索：匹配商场名、区域、规则条件（时长+说明）
- 区筛选：横向滚动 chips，按 13 个区过滤
- 无门槛（绿 P）/ 需消费（橙 P）双色标记
- 列表点击 → 地图定位 + 详情气泡（全部免费规则、近似坐标提示、一键在高德打开导航）
- 移动端：底部抽屉列表、双指缩放、输入法弹出自动展开、safe-area 适配
- 全部数据与 Leaflet 库本地内置，无 CDN 依赖（仅地图瓦片来自高德/OSM 服务器）
