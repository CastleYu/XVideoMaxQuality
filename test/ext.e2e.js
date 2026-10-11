// 加载真实扩展的端到端测试：开/关两种状态下播放器看到的画质档位
// 运行：NODE_PATH=Temp/node_modules node test/ext.e2e.js [主 m3u8 地址]
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PAGE = 'https://x.com/__xvmq_e2e';
const SRC = process.argv[2] || 'https://video.twimg.com/amplify_video/2107850214744698880/pl/rX-nKpygHifLr2wW.m3u8?tag=16&v=e51';

// 复用 e2e.html，去掉手动注入的脚本（改由扩展注入）
const html = fs.readFileSync(path.join(__dirname, 'e2e.html'), 'utf8').replace(/<script src="\.\.\/src\/[^"]+"><\/script>\n?/g, '');

async function play(page) {
  await page.goto(`${PAGE}?src=${encodeURIComponent(SRC)}`);
  await page.waitForFunction(() => document.getElementById('out').textContent.startsWith('{'), null, { timeout: 30000 });
  return JSON.parse(await page.textContent('#out'));
}

(async () => {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`],
  });
  await ctx.route(`${PAGE}*`, (r) => r.fulfill({ contentType: 'text/html', body: html }));
  const sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'));
  const page = await ctx.newPage();
  const badge = () => sw.evaluate(() => chrome.action.getBadgeText({}));

  try {
    await sw.evaluate(() => globalThis.__xvmq.Bg.init());
    assert.strictEqual(await badge(), '', 'default on: no badge');
    const on = await play(page);
    console.log('ON ', JSON.stringify(on));
    assert.strictEqual(on.levels.length, 1, 'on: only one level');
    assert.strictEqual(on.levels[0], on.playing, 'on: playing best level');

    await sw.evaluate(() => globalThis.__xvmq.Bg.toggle());
    assert.strictEqual(await badge(), 'OFF', 'off: badge shown');
    const attr = await page.evaluate(() => document.documentElement.getAttribute('data-xvmq'));
    assert.strictEqual(attr, 'off', 'off: live attribute update without reload');
    const off = await play(page);
    console.log('OFF', JSON.stringify(off));
    assert.ok(off.levels.length > 1, 'off: original levels untouched');

    await sw.evaluate(() => globalThis.__xvmq.Bg.toggle());
    assert.strictEqual(await badge(), '', 'on again: badge cleared');
    assert.strictEqual((await play(page)).levels.length, 1, 'on again: one level');
    console.log('extension e2e passed');
  } finally {
    await ctx.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
