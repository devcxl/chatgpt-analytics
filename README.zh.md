<p align="center">
  <img src="./public/icon/128.png" width="96" alt="ChatGPT Analytics 图标" />
</p>

<h1 align="center">ChatGPT Analytics</h1>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">简体中文</a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/chatgpt-analytics/lpnbpllikegochooknfohankonnfikhd"><img src="https://img.shields.io/chrome-web-store/v/lpnbpllikegochooknfohankonnfikhd?logo=googlechrome&logoColor=white&label=Chrome%20Web%20Store" alt="Chrome Web Store 版本" /></a>
  <a href="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml"><img src="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI 状态" /></a>
  <a href="https://github.com/devcxl/chatgpt-analytics/blob/main/LICENSE"><img src="https://img.shields.io/github/license/devcxl/chatgpt-analytics" alt="MIT 许可证" /></a>
</p>

<p align="center">
  基于 WXT 的浏览器插件，用于增强 ChatGPT Codex Analytics 页面。<br />
  插件读取页面已经请求的统计响应，并可视化 Token、活跃度、模型分布和客户端分布。
</p>

## 界面预览

<img width="1684" height="1318" alt="中文界面预览" src="https://github.com/user-attachments/assets/71ee04ca-0390-47e3-ae02-c45d0cfe9b48" />

## 功能

打开 [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics) 页面时，插件会在官方统计图表下方追加增强内容：

| 图表 | 内容 |
| --- | --- |
| Token 消耗趋势 | 缓存输入、未缓存输入、输出和 Token 总量（面积图） |
| 积分消耗趋势 | 积分使用曲线（面积图） |
| 活跃度 | 用户、线程和轮次（柱状图） |
| 模型分布 | 各模型使用量占比（环形图） |
| 客户端分布 | Web、Codex 等客户端使用量占比（环形图） |

- 聚合周期跟随官方 Analytics 页面：**按天 / 按周 / 按月**
- 汇总统计卡片：用户活动日数、轮次数、线程活动数、积分、Token 总量和统计区间
- 增强面板可折叠，并在官方页面收到新数据后自动更新
- 支持深色和浅色主题
- 使用标准 WebExtension i18n，提供 English 和简体中文语言包；浏览器扩展语言会决定界面和 Chrome Web Store 展示文案

## 技术栈

- **[WXT](https://wxt.dev/)** — 新一代 Web Extension 框架
- **Vue 3** — 注入式统计面板 UI
- **ECharts 6** — 按需引入图表模块
- **Lucide** — Vue SVG 图标库
- **`@wxt-dev/i18n`** — WXT 对标准 WebExtension i18n API 的类型安全封装
- **Shadow DOM** — 隔离注入面板样式

## 项目结构

```text
chatgpt-analytics/
├── .github/workflows/                  # CI 和草稿 Release 工作流
│   ├── ci.yml
│   └── release.yml
├── entrypoints/
│   ├── analytics-interceptor.content.ts # 页面主世界 fetch/XHR 响应监听器
│   ├── stats.content/                   # Codex Analytics 页面 Content Script
│   │   ├── index.ts                     # Shadow DOM UI 挂载
│   │   └── App.vue                      # 图表和统计明细表格
│   └── popup/                           # 扩展 Popup
│       ├── index.html
│       ├── main.ts
│       ├── App.vue                      # 统计页面入口
│       └── style.css
├── locales/                             # 源语言包
│   ├── en.json
│   └── zh_CN.json
├── utils/
│   ├── types.ts                         # 统计响应类型
│   ├── config.ts                         # 面板配置
│   ├── api.ts                            # 响应监听、解析和归一化
│   ├── charts.ts                          # 数据聚合和图表数据集
│   └── page-bridge.ts                     # 主世界与隔离世界事件桥接
├── public/icon/                           # 插件图标（16~512 px）
├── wxt.config.ts                          # WXT 配置
└── package.json
```

## 安装

从 Chrome Web Store 安装正式发布的版本：

- [ChatGPT Analytics - Chrome Web Store](https://chromewebstore.google.com/detail/chatgpt-analytics/lpnbpllikegochooknfohankonnfikhd)

安装完成后：

1. 在已登录的 ChatGPT 账号中打开 [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics)。
2. 滚动到官方统计图表下方查看增强面板。

## 开发

前置环境：Node.js ≥ 22，以及 Chrome 或 Firefox。

```bash
# 1. 安装依赖
npm install

# 2. 开发模式
npm run dev

# 3. 构建生产版本
npm run build
```

### 在 Chrome 中加载未打包构建

1. 执行 `npm run build`（或 `npm run pack` 同时生成 `.output/chatgpt-analytics-*.zip`）。
2. 打开 `chrome://extensions/`。
3. 开启右上角「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择 `.output/chrome-mv3`。
5. 打开 [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics)，在官方图表下方查看增强内容。

如果想直接加载打包文件而不是未打包目录，可将 `.output/chatgpt-analytics-*.zip` 拖拽到 `chrome://extensions/` 页面。

### 在 Firefox 中加载

1. 执行 `npm run build:firefox`。
2. 打开 `about:debugging#/runtime/this-firefox`。
3. 点击「临时加载附加组件」，选择 `.output/firefox-mv3/manifest.json`。
4. 打开 Analytics 页面。

### 创建发布压缩包

```bash
# Chrome
npm run zip:chrome
# 生成 .output/chatgpt-analytics-<version>-chrome.zip

# Firefox（包含 MV3 扩展包及源码包）
npm run zip:firefox
# 生成 .output/chatgpt-analytics-<version>-firefox.zip 与 .output/chatgpt-analytics-<version>-sources.zip
```

实际压缩包文件名会包含 `package.json` 中的版本号。

## 持续集成与自动发布

### 工作流说明

1. **CI (`ci.yml`)**：在推送到 `main` 或提交针对 `main` 的 PR 时执行代码检查（Lint）、类型检查（Type check）、Chrome 与 Firefox 构建以及 Manifest 规范校验。
2. **构建草稿发布 (`release.yml`)**：推送 `v*` 标签或手动触发时，自动构建 Chrome/Firefox MV3 扩展包及源码包，并创建 GitHub Draft Release。
3. **自动发布至应用商店 (`publish-stores.yml`)**：当 GitHub Draft Release 正式发布（Published）或手动指定 tag 触发时，自动调用 `wxt submit` 将打包产物提交到已配置密钥的应用商店（Firefox AMO / Chrome Web Store）。

### 自动化发布流程

先更新版本号并提交，再推送匹配的 `v*` 标签：

```bash
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main v1.0.1
```

在 GitHub Releases 页面确认生成的草稿 Release 无误后，点击 **Publish release**，`publish-stores.yml` 工作流将自动上传到商店。

### GitHub Secrets 配置

在仓库 **Settings -> Secrets and variables -> Actions** 中配置以下密钥：

#### Firefox Add-ons (AMO) 发布凭证
- `FIREFOX_EXTENSION_ID`: 扩展 ID（如 `chatgpt-analytics@devcxl.cn` 或 AMO 分配的 UUID）
- `AMO_JWT_ISSUER`: Mozilla AMO API 密钥 Issuer
- `AMO_JWT_SECRET`: Mozilla AMO API 密钥 Secret

#### Chrome Web Store 发布凭证（可选）
- `CHROME_EXTENSION_ID`: Chrome 扩展 ID
- `CHROME_PUBLISHER_ID`: 发布者 UUID（v2 API 路径 `publishers/{id}/items/{id}` 必需）
- `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`: GCP 服务账号邮箱，需在 CWS 开发者后台绑定
- `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`: 服务账号私钥，必须是带真实换行的 PEM（`jq -r .private_key key.json`）

v2 凭证的获取步骤见 [`chatgpt-markdown-exporter` AGENTS.md](https://github.com/devcxl/chatgpt-markdown-exporter/blob/master/AGENTS.md#chrome-web-store-自动发布配置)。

## 环境说明

如果默认 npm cache 目录不可写，请指定可写缓存目录：

```bash
export npm_config_cache=/tmp/npm-cache
mkdir -p /tmp/npm-cache
npm install
```

如果 `/tmp` 不可写，也可以使用其它可写目录，例如 `~/Projects/.npm-cache`。

## 数据获取与隐私

- 插件不会主动请求统计接口，也不会读取或保存 token。页面主世界脚本只监听 Analytics 页面已经发出的 `fetch/XHR` 响应，因此请求使用页面自身携带的 Cookie、`Authorization` 和其它请求头。
- Popup 只负责打开 Analytics 页面，不请求内部数据，也不需要额外的 Cookie 权限。
- 语言遵循标准 `browser.i18n` API 使用浏览器扩展 UI 语言；如需切换语言，需要更改浏览器语言。
- 该接口是 OpenAI 未公开的内部接口，可能随时变更。如果页面响应格式发生变化，可调整 `utils/api.ts`。
- 如果官方页面没有请求某个聚合周期，插件不会自行补发请求。
- 直接使用 `curl` 请求时没有浏览器会话 Cookie，通常会返回 401，这是正常现象。

## 免责声明

本项目是独立的社区插件，与 OpenAI 或 ChatGPT 没有任何隶属、背书或赞助关系。插件依赖未公开的内部接口和页面行为，这些内容可能随时变更或失效。使用者需自行承担使用风险；项目不保证数据准确性、服务可用性或兼容性。

## License

MIT
