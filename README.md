<p align="center">
  <img src="./public/icon/128.png" width="96" alt="ChatGPT Analytics logo" />
</p>

<h1 align="center">ChatGPT Analytics</h1>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">简体中文</a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/chatgpt-analytics/lpnbpllikegochooknfohankonnfikhd"><img src="https://img.shields.io/chrome-web-store/v/lpnbpllikegochooknfohankonnfikhd?logo=googlechrome&logoColor=white&label=Chrome%20Web%20Store" alt="Chrome Web Store version" /></a>
  <a href="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml"><img src="https://github.com/devcxl/chatgpt-analytics/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
  <a href="https://github.com/devcxl/chatgpt-analytics/blob/main/LICENSE"><img src="https://img.shields.io/github/license/devcxl/chatgpt-analytics" alt="MIT License" /></a>
</p>

<p align="center">
  A WXT-based browser extension that enhances the ChatGPT Codex Analytics page.<br />
  It visualizes token usage, activity, model distribution, and client distribution from the analytics responses already requested by the page.
</p>

## Preview

<img width="1689" height="1315" alt="English interface preview" src="https://github.com/user-attachments/assets/2dcac32d-500c-4606-9c81-bc329e4171eb" />

## Features

When you open [ChatGPT Codex Analytics](https://chatgpt.com/settings/usage?tab=analytics), the extension appends enhanced content below the official analytics charts:

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
│   │   ├── App.vue                      # Panel state, layout, and usage details table
│   │   ├── chart-options.ts             # ECharts option builders
│   │   └── theme.ts                     # Panel theme colors
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
│   ├── config.ts                         # Panel configuration and chart palette
│   ├── api.ts                            # Response listening, parsing, and normalization
│   ├── charts.ts                          # Data aggregation and panel view data
│   └── page-bridge.ts                     # Main-world / isolated-world event bridge
├── public/icon/                           # Extension icons (16 to 512 px)
├── wxt.config.ts                          # WXT configuration
└── package.json
```

## Installation

Install the published extension from the Chrome Web Store:

- [ChatGPT Analytics on the Chrome Web Store](https://chromewebstore.google.com/detail/chatgpt-analytics/lpnbpllikegochooknfohankonnfikhd)

After installation:

1. Open [ChatGPT Codex Analytics](https://chatgpt.com/settings/usage?tab=analytics) while signed in to your account.
2. Scroll below the official analytics charts to view the enhanced panel.

## Development

Prerequisites: Node.js >= 22 and Chrome or Firefox.

```bash
# 1. Install dependencies
npm install

# 2. Start development mode
npm run dev

# 3. Build a production extension
npm run build
```

### Load the unpacked build in Chrome

1. Run `npm run build` (or `npm run pack` to also generate `.output/chatgpt-analytics-*.zip`).
2. Open `chrome://extensions/`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select `.output/chrome-mv3`.
5. Open [ChatGPT Codex Analytics](https://chatgpt.com/settings/usage?tab=analytics) and view the enhanced content below the official charts.

To load the packaged zip instead of the unpacked folder, drag `.output/chatgpt-analytics-*.zip` onto `chrome://extensions/`.

### Load in Firefox

1. Run `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `.output/firefox-mv3/manifest.json`.
4. Open the Analytics page.

### Create distribution archives

```bash
# Chrome
npm run zip:chrome
# Outputs .output/chatgpt-analytics-<version>-chrome.zip

# Firefox (includes MV3 extension archive and source code archive)
npm run zip:firefox
# Outputs .output/chatgpt-analytics-<version>-firefox.zip and .output/chatgpt-analytics-<version>-sources.zip
```

The actual archive name includes the version from `package.json`.

## Continuous integration and automated publishing

### Workflows overview

1. **CI (`ci.yml`)**: Runs Lint, Type check, Chrome/Firefox builds, and Manifest validation on pushes and PRs to `main`.
2. **Build Draft Release (`release.yml`)**: Automatically packages Chrome and Firefox MV3 archives plus source code archives, and creates a GitHub Draft Release upon pushing a `v*` tag or manual dispatch.
3. **Publish Extension Stores (`publish-stores.yml`)**: Triggered only when a Draft Release is manually published (and only for non-prerelease tags), uploading archives to the configured stores (Chrome Web Store / Firefox AMO) via `wxt submit`.

### Publishing process

Update the version, commit, and push the matching `v*` tag:

```bash
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main v1.0.1
```

Review the draft release on GitHub Releases, then click **Publish release**. The `publish-stores.yml` workflow will automatically submit the release to configured stores.

### GitHub Secrets configuration

Configure the following secrets under **Settings -> Secrets and variables -> Actions**:

#### Firefox Add-ons (AMO) credentials
- `FIREFOX_EXTENSION_ID`: Extension ID (e.g. `chatgpt-analytics@devcxl.cn` or AMO UUID)
- `FIREFOX_JWT_ISSUER`: Mozilla AMO API key Issuer (also accepts `AMO_JWT_ISSUER`)
- `FIREFOX_JWT_SECRET`: Mozilla AMO API key Secret (also accepts `AMO_JWT_SECRET`)

#### Chrome Web Store credentials (Optional)
- `CHROME_EXTENSION_ID`: Chrome Extension ID
- `CHROME_PUBLISHER_ID`: Publisher UUID (required by the v2 API path `publishers/{id}/items/{id}`)
- `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`: GCP service account email, bound in the CWS Developer Dashboard
- `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`: Service account private key, stored as a real PEM (`jq -r .private_key key.json`)

Setup steps for the v2 credentials: see [`chatgpt-markdown-exporter` AGENTS.md](https://github.com/devcxl/chatgpt-markdown-exporter/blob/master/AGENTS.md#chrome-web-store-自动发布配置).

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
