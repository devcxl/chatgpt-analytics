# ChatGPT Analytics

基于 WXT 的 Chrome 浏览器插件，**增强 ChatGPT 统计界面**：通过 ChatGPT 内部统计接口
`/backend-api/wham/analytics/daily-workspace-usage-counts` 页面响应中的 token / 活跃度 / 模型分布等数据，
并以 ECharts 渲染更丰富的可视化图表。

## 功能

打开 [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics) 页面时，插件会在官方统计图表下方追加增强内容，包含：

| 图表 | 内容 |
| --- | --- |
| Token 消耗趋势 | 缓存输入 / 未缓存输入 / 输出 / 合计（面积图） |
| 积分消耗趋势 | credits 使用曲线（面积图） |
| 活跃度 | 用户数 / 线程数 / 轮次（柱状图） |
| 模型分布 | 各模型使用量占比（环形图） |
| 客户端分布 | OpenAI / Codex 等客户端占比（环形图） |

- 聚合维度跟随官方 Analytics 页面切换：**按天 / 按周 / 按月**
- 汇总统计卡片：用户活动日数、轮次数、线程活动数、积分、Token 总量、统计区间
- 增强内容可折叠，数据仅在官方页面完成请求后自动同步
- 跟随系统深色/浅色主题，样式与 ChatGPT 暗色界面协调
- 根据 Analytics 页面 `lang` 自动切换中文 / English，其他语言默认使用 English

## 技术栈

- **[WXT](https://wxt.dev/)** — Next-gen Web Extension 框架（替代 Manifest V3 的繁琐配置）
- **Vue 3** — 图表面板 UI（`@wxt-dev/module-vue` 支持 content script 中用 Vue）
- **ECharts 6** — 声明式图表，按需引入各图表/组件模块
- **Lucide** — Vue SVG 图标库，统一处理按钮和状态图标
- **Shadow DOM** — 通过 `createShadowRootUi` 注入，样式与宿主页面隔离，避免冲突

## 项目结构

```
chatgpt-analytics/
├── entrypoints/
│   ├── stats.content/   # 注入到 Codex Analytics 页面的 content script
│   │   ├── index.ts     # defineContentScript：Shadow DOM UI 挂载点
│   │   └── App.vue      # 增强图表 + 统计明细表格（Vue + ECharts）
│   └── popup/           # 扩展弹窗入口
│       ├── index.html
│       ├── main.ts
│       ├── App.vue      # 跳转统计页入口
│       └── style.css
├── utils/
│   ├── types.ts         # 接口数据类型
│   ├── config.ts        # 默认配置（维度、图表高度等）
│   ├── api.ts           # 页面统计响应监听、解析与数据归一化
│   └── charts.ts        # 数据聚合与图表数据集转换
├── public/icon/         # 插件图标（16~512）
├── wxt.config.ts        # WXT 配置（Vue 模块 + Chrome）
└── package.json
```

## 安装与开发

前置：Node.js ≥ 22、Chrome 浏览器。

```bash
# 1. 安装依赖（npm cache 需指向可写目录，见下方说明）
npm install

# 2. 开发模式（自动重载，改动即刷新）
npm run dev

# 3. 打包并生成 .zip（用于手动安装）
npm run pack
```

### Chrome 中加载

1. 打开 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本项目目录
4. 打开 [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics) 页面，在官方图表下方查看增强内容

### 打包成 zip 安装

```bash
npm run pack
# 生成 .output/chatgpt-analytics-1.0.0-chrome.zip（文件名以实际版本为准）
```

在 Chrome 扩展管理页选择「更新」，或手动将 zip 拖入扩展目录即可。

## 环境说明（重要）

本环境的 `npm cache` 默认目录为只读文件系统，需手动指定可写缓存目录：

```bash
export npm_config_cache=/tmp/npm-cache
mkdir -p /tmp/npm-cache
npm install
```

（若 `/tmp` 不可写，可将缓存指向其它可写目录，如 `~/Projects/.npm-cache`。）

## 数据获取说明

- 插件不主动请求统计接口，也不读取或保存 token。页面主世界监听当前 Analytics 页面已经发出的
  `fetch/XHR` 响应，因此请求使用页面自身携带的 Cookie、Authorization 等请求头。
- Popup 只负责打开统计页面，不直接请求内部接口，因此不会额外申请 Cookie 权限。
- 接口为 OpenAI 内部接口、未公开文档，**可能随时变更**。若接口变化导致
  请求失败，面板会显示具体错误信息，可在 `utils/api.ts` 中调整。
- 直接 curl 测试会返回 401（无 cookie），属正常现象。

## License

MIT
