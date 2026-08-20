<p align="center">
  <img src="./public/icon/128.png" width="96" alt="ChatGPT Analytics 图标" />
</p>

<h1 align="center">ChatGPT Analytics</h1>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml"><img src="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml/badge.svg" alt="CI 状态" /></a>
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
- 根据 Analytics 页面语言自动切换中文 / English，其他语言默认使用 English

## 技术栈

- **[WXT](https://wxt.dev/)** — 新一代 Web Extension 框架
- **Vue 3** — 注入式统计面板 UI
- **ECharts 6** — 按需引入图表模块
- **Lucide** — Vue SVG 图标库
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
├── utils/
│   ├── types.ts                         # 统计响应类型
│   ├── config.ts                         # 面板配置
│   ├── api.ts                            # 响应监听、解析和归一化
│   ├── charts.ts                          # 数据聚合和图表数据集
│   ├── i18n.ts                            # 语言检测和翻译
│   └── page-bridge.ts                     # 主世界与隔离世界事件桥接
├── public/icon/                           # 插件图标（16~512 px）
├── wxt.config.ts                          # WXT 配置
└── package.json
```

## 安装与开发

前置环境：Node.js ≥ 22，以及 Chrome 或 Firefox。

```bash
# 1. 安装依赖
npm install

# 2. 开发模式
npm run dev

# 3. 构建生产版本
npm run build
```

### 在 Chrome 中加载

1. 打开 `chrome://extensions/`。
2. 开启「开发者模式」。
3. 执行 `npm run build` 后，点击「加载已解压的扩展程序」，选择 `.output/chrome-mv3`。
4. 打开 [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics)，在官方图表下方查看增强内容。

### 在 Firefox 中加载

1. 执行 `npx wxt build --browser firefox`。
2. 打开 `about:debugging#/runtime/this-firefox`。
3. 点击「临时加载附加组件」，选择 `.output/firefox-mv2/manifest.json`。
4. 打开 Analytics 页面。

### 创建发布压缩包

```bash
# Chrome
npm run pack
# .output/chatgpt-analytics-1.0.0-chrome.zip

# Firefox
npx wxt zip --browser firefox
# .output/chatgpt-analytics-1.0.0-firefox.zip
```

实际压缩包文件名会包含 `package.json` 中的版本号。

## 持续集成与发布

GitHub Actions 会在推送到 `main` 或提交针对 `main` 的 Pull Request 时，执行 lint、类型检查以及 Chrome/Firefox 构建。

创建草稿 Release 时，先更新版本号并提交，再推送匹配的 `v*` 标签：

```bash
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main v1.0.1
```

标签版本必须与 `package.json` 中的版本一致。Release 工作流会创建一个附带 Chrome 和 Firefox 压缩包的 GitHub 草稿 Release，检查无误后再手动发布。

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
- 该接口是 OpenAI 未公开的内部接口，可能随时变更。如果页面响应格式发生变化，可调整 `utils/api.ts`。
- 如果官方页面没有请求某个聚合周期，插件不会自行补发请求。
- 直接使用 `curl` 请求时没有浏览器会话 Cookie，通常会返回 401，这是正常现象。

## 免责声明

本项目是独立的社区插件，与 OpenAI 或 ChatGPT 没有任何隶属、背书或赞助关系。插件依赖未公开的内部接口和页面行为，这些内容可能随时变更或失效。使用者需自行承担使用风险；项目不保证数据准确性、服务可用性或兼容性。

## License

MIT
