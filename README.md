# X Video Max Quality

Chrome（MV3）插件：在 x.com / twitter.com 观看视频时自动使用最高画质。

## 原理

X 的视频以 HLS 方式播放：先请求主播放列表（`video.twimg.com/**.m3u8`），里面列出 270p～1080p 等多个档位，播放器再按网速自适应选档，所以经常停在低画质。

插件在页面主环境（`world: MAIN`、`document_start`）拦截 `XMLHttpRequest` 和 `fetch`，把主播放列表改写成**只保留分辨率最高的一个档位**（分辨率相同则取码率最高的），音频和字幕轨道原样保留。播放器只能选这个档位。

- 子播放列表、分片和非 X 的请求一律不改动；解析失败时返回原文
- 直接用 MP4 播放的视频（少数 GIF 和旧视频）只有一个档位，本身不受影响

## 开关

点击扩展栏上的图标即可开启/关闭：

- 开启：蓝色图标
- 关闭：灰色图标，并显示 `OFF` 角标

状态保存在 `chrome.storage.local` 中，重启浏览器后保留。切换后**之后加载的视频**立即生效，无需刷新；已经在播放的视频要刷新页面才会切换。

实现：后台 `bg.js` 负责切换状态和图标；隔离环境的 `bridge.js` 把状态写到 `<html data-xvmq>` 属性上；主环境的 `hook.js` 读取这个属性来决定是否改写。

## 安装

1. 打开 `chrome://extensions`，开启「开发者模式」
2. 点击「加载已解压的扩展程序」，选择本目录
3. 刷新 x.com

## 目录

| 路径 | 说明 |
|---|---|
| `manifest.json` | 插件清单 |
| `src/const.js` | 全部常量（分组类） |
| `src/m3u8.js` | `Playlist`：主播放列表解析与改写 |
| `src/hook.js` | `Hook`：拦截 XHR 和 fetch |
| `src/bg.js` | `Bg`：点击图标切换开关，同步图标、角标和提示文字 |
| `src/bridge.js` | `Bridge`：把开关状态同步到页面属性 |
| `icons/` | 开启 / 关闭两套图标，由 `python tools/icons.py` 生成 |
| `test/ext.e2e.js` | 加载真实扩展的端到端测试（Playwright），覆盖开 → 关 → 开 |
| `test/m3u8.test.js` | 单元测试：`node test/m3u8.test.js [真实 m3u8 文件]` |
| `test/e2e.html` | 端到端测试页：先注入插件脚本，再用 hls.js 播放真实 X 视频，并输出播放器看到的档位和实际分辨率 |

## 端到端测试

```bash
python -m http.server 8765
```

然后打开 `http://localhost:8765/test/e2e.html?src=<URL 编码后的 video.twimg.com 主 m3u8 地址>`，预期输出类似 `{"levels":["1080x1920"],"playing":"1080x1920"}`。

### 扩展端到端测试

```bash
cd Temp && npm i playwright && cd ..
NODE_PATH=Temp/node_modules node test/ext.e2e.js
```

预期：开启时只有 1 档（最高档），关闭时是原始的多档。注意事项：

- X 会拒绝默认 headless UA 的访问（`ERR_HTTP_RESPONSE_CODE_FAILURE`），所以测试页是用 `route` 挂到 `x.com` 域名下的
- Chrome 对同一个脚本文件每页只注入一次（不区分 world），所以 `bridge.js` 用动态 `import` 加载 `const.js`，不在清单里重复列出
