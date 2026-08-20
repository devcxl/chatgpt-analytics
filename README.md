<p align="center">
  <img src="./public/icon/128.png" width="96" alt="ChatGPT Analytics logo" />
</p>

<h1 align="center">ChatGPT Analytics</h1>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml"><img src="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
</p>

<p align="center">
  A WXT-based browser extension that enhances the ChatGPT Codex Analytics page.<br />
  It visualizes token usage, activity, model distribution, and client distribution from the analytics responses already requested by the page.
</p>

## Preview

<img width="1689" height="1315" alt="English interface preview" src="https://github.com/user-attachments/assets/2dcac32d-500c-4606-9c81-bc329e4171eb" />

## Features

When you open [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics), the extension appends enhanced content below the official analytics charts:

| Chart | Contents |
| --- | --- |
| Token usage trend | Cached input, uncached input, output, and total tokens (area chart) |
| Credits usage trend | Credits usage over time (area chart) |
| Activity | Users, threads, and turns (bar chart) |
| Model distribution | Usage share by model (doughnut chart) |
| Client distribution | Usage share by client, such as Web and Codex (doughnut chart) |

- The aggregation period follows the official Analytics page: **day / week / month**
- Summary cards for user activity days, turns, thread activity, credits, total tokens, and date range
- The enhanced panel can be collapsed and updates after the official page receives new data
- Dark and light theme support
- Standard WebExtension i18n with English and Simplified Chinese catalogs; the browser extension locale selects the UI and Chrome Web Store listing text

## Technology

- **[WXT](https://wxt.dev/)** — Next-generation Web Extension framework
- **Vue 3** — UI for the injected analytics panel
- **ECharts 6** — On-demand chart modules for visualizations
- **Lucide** — Vue SVG icon library
- **`@wxt-dev/i18n`** — WXT's type-safe wrapper around the standard WebExtension i18n API
- **Shadow DOM** — Isolated styles for the injected panel

## Project structure

```text
chatgpt-analytics/
├── .github/workflows/                  # CI and draft release workflows
│   ├── ci.yml
│   └── release.yml
├── entrypoints/
│   ├── analytics-interceptor.content.ts # Main-world fetch/XHR response observer
│   ├── stats.content/                   # Content script for the Codex Analytics page
│   │   ├── index.ts                     # Shadow DOM UI mounting
│   │   └── App.vue                      # Charts and usage details table
│   └── popup/                           # Extension popup
│       ├── index.html
│       ├── main.ts
│       ├── App.vue                      # Analytics page link
│       └── style.css
├── locales/                             # Source localization catalogs
│   ├── en.json
│   └── zh_CN.json
├── utils/
│   ├── types.ts                         # Analytics response types
│   ├── config.ts                         # Panel configuration
│   ├── api.ts                            # Response listening, parsing, and normalization
│   ├── charts.ts                          # Data aggregation and chart datasets
│   └── page-bridge.ts                     # Main-world / isolated-world event bridge
├── public/icon/                           # Extension icons (16 to 512 px)
├── wxt.config.ts                          # WXT configuration
└── package.json
```

## Installation and development

Prerequisites: Node.js >= 22 and Chrome or Firefox.

```bash
# 1. Install dependencies
npm install

# 2. Start development mode
npm run dev

# 3. Build a production extension
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Click **Load unpacked** and select `.output/chrome-mv3` after running `npm run build`.
4. Open [ChatGPT Codex Analytics](https://chatgpt.com/codex/cloud/settings/analytics) and view the enhanced content below the official charts.

### Load in Firefox

1. Run `npx wxt build --browser firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `.output/firefox-mv2/manifest.json`.
4. Open the Analytics page.

### Create distribution archives

```bash
# Chrome
npm run pack
# .output/chatgpt-analytics-1.0.0-chrome.zip

# Firefox
npx wxt zip --browser firefox
# .output/chatgpt-analytics-1.0.0-firefox.zip
```

The actual archive name includes the version from `package.json`.

## Continuous integration and releases

GitHub Actions runs lint, type checking, and Chrome/Firefox builds on pushes to `main` and on pull requests targeting `main`.

To create a draft release, update the package version, commit it, and push a matching `v*` tag:

```bash
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main v1.0.1
```

The tag must match the version in `package.json`. The release workflow creates a draft GitHub Release with Chrome and Firefox archives attached. Review and publish the draft manually.

## Environment notes

If the default npm cache is read-only, use a writable cache directory:

```bash
export npm_config_cache=/tmp/npm-cache
mkdir -p /tmp/npm-cache
npm install
```

If `/tmp` is not writable, use another writable directory such as `~/Projects/.npm-cache`.

## Data access and privacy

- The extension does not actively request the analytics endpoint and does not read or store tokens. A main-world content script observes the `fetch/XHR` responses already requested by the Analytics page, so the page's own cookies, `Authorization` header, and other request headers are used.
- The popup only opens the Analytics page and does not request internal data or require additional cookie permissions.
- Localization follows the browser's extension UI locale, as required by the standard `browser.i18n` API; changing it requires changing the browser language.
- The endpoint is an undocumented internal OpenAI endpoint and may change without notice. If the page changes its response format, update `utils/api.ts`.
- If the official page does not request a particular aggregation period, the extension does not issue a replacement request.
- A direct `curl` request normally returns 401 without the browser session cookies.

## Disclaimer

This project is an independent community extension and is not affiliated with, endorsed by, or sponsored by OpenAI or ChatGPT. It relies on undocumented internal endpoints and page behavior that may change or stop working at any time. Use it at your own risk; no guarantee is made regarding data accuracy, availability, or compatibility.

## License

MIT
