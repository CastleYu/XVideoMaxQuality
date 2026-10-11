// 运行：node test/m3u8.test.js [真实主列表文件路径]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const src = path.join(__dirname, '..', 'src');
const ctx = vm.createContext({});
for (const f of ['const.js', 'm3u8.js']) vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8'), ctx);
const { Playlist } = ctx.__xvmq;

const master = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MEDIA:NAME="Audio",TYPE=AUDIO,GROUP-ID="audio-128000",AUTOSELECT=YES,URI="/a/128.m3u8"
#EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=300000,BANDWIDTH=400000,RESOLUTION=480x270,CODECS="mp4a.40.2,avc1.4d001e",AUDIO="audio-128000"
/v/480x270.m3u8
#EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=2000000,BANDWIDTH=2500000,RESOLUTION=1920x1080,CODECS="mp4a.40.2,avc1.640028",AUDIO="audio-128000"
/v/1920x1080.m3u8
#EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=900000,BANDWIDTH=1200000,RESOLUTION=1280x720,CODECS="mp4a.40.2,avc1.64001f",AUDIO="audio-128000"
/v/1280x720.m3u8
`;

const out = Playlist.best(master);
assert.ok(out.includes('/v/1920x1080.m3u8'), 'keeps 1080p');
assert.ok(!out.includes('/v/480x270.m3u8') && !out.includes('/v/1280x720.m3u8'), 'drops others');
assert.ok(out.includes('#EXT-X-MEDIA:'), 'keeps audio group');
assert.strictEqual((out.match(/#EXT-X-STREAM-INF/g) || []).length, 1);

const media = '#EXTM3U\n#EXT-X-TARGETDURATION:3\n#EXTINF:3.0,\n/s/0.m4s\n';
assert.strictEqual(Playlist.best(media), media, 'media playlist untouched');

const crlf = master.replace(/\n/g, '\r\n');
assert.ok(Playlist.best(crlf).includes('/v/1920x1080.m3u8'), 'CRLF ok');

const real = process.argv[2];
if (real) {
  const text = fs.readFileSync(real, 'utf8');
  const res = Playlist.best(text);
  console.log('--- real master rewritten ---\n' + res);
  assert.strictEqual((res.match(/#EXT-X-STREAM-INF/g) || []).length, 1);
}

console.log('all tests passed');
