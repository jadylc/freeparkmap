# 上海免费停车点地图

纯静态单页应用：无需任何服务器后端，数据一次性内置，可直接部署到 Cloudflare Pages（或任何静态托管）。

## 本地查看

直接双击 `index.html` 即可在浏览器打开（无需启动任何服务）。

## 更新数据

编辑 `index.html` 中的 `POIS` 数组（搜索 `const POIS` 即可定位），每条记录：

```js
{
  id: 1,                        // 唯一编号
  name: "商场名",               // 必填
  address: "××路××号",          // 可选
  time: "工作日首2小时免费",     // 免费停车时间，必填
  note: "补充说明",             // 可选
  district: "××区",            // 可选，参与搜索
  lng: 121.3985,               // 经度（GCJ-02，见下）
  lat: 31.2403                 // 纬度（GCJ-02）
}
```

**坐标系注意**：默认底图是高德地图，请使用 GCJ-02 坐标（用高德"坐标拾取器" https://lbs.amap.com/tools/picker 拾取的就是这个坐标系）。如果数据来自 OSM 或 GPS 设备（WGS-84），点会偏移约几百米，需要先转换。

## 部署到腾讯云 EdgeOne（国内访问更快，推荐）

腾讯 EdgeOne Pages（现名 Makers）免费版：请求与流量均不限量、40 个项目、5GB 存储，注册即可用。
入口：https://pages.edgeone.ai （注册/登录腾讯云账号）

**方法一：控制台直接上传（最简单）**
1. 登录控制台 → Makers → 创建项目 → 直接上传（Direct Upload）
2. 把本目录整个文件夹拖进去，部署完成得到 `xxx.edgeone.app` 地址（默认域名国内可访问，无需备案）

**方法二：EdgeOne CLI**
```bash
npm install -g edgeone
edgeone login
edgeone pages deploy
```

**方法三：Git 集成**：导入 GitHub/GitLab/Gitee 仓库，构建命令留空、输出目录 `/`，push 自动部署。

> 注意：使用平台默认域名（`*.edgeone.app`）无需 ICP 备案；若绑定自己的域名并要求大陆节点加速，域名需完成 ICP 备案。

## 部署到 Cloudflare Pages

**方法一：控制台拖拽（最简单）**
1. 打开 https://dash.cloudflare.com → Workers 和 Pages → 创建 → Pages → "直接上传"
2. 把本目录整个文件夹拖进去，起个项目名，部署完成，得到 `xxx.pages.dev` 地址

**方法二：wrangler CLI**
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=sh-free-parking
```

**方法三：Git 集成**
推送到 GitHub/GitLab 仓库，在 Pages 中连接仓库，构建命令留空、输出目录填 `/`，之后每次 push 自动重新部署（免费版每月 500 次构建）。

## 功能清单

- 高德街道底图（默认）/ OpenStreetMap 可切换（右上角）
- 搜索：匹配商场名、地址、时间、说明、区域
- 列表点击 → 地图定位 + 详情气泡；点击气泡中的链接可在高德 App/网页中打开导航
- 移动端：底部抽屉列表、双指缩放、适配键盘弹出
- 全部数据与 Leaflet 库本地内置，无 CDN 依赖（仅地图瓦片来自高德/OSM 服务器）
