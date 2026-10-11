// HLS 主播放列表改写：只保留最高画质的视频档位
(() => {
  const { Tag, Net } = globalThis.__xvmq;

  class Playlist {
    static isMaster(text) {
      return typeof text === 'string' && text.includes(Tag.STREAM);
    }

    static attrs(line) {
      const out = {};
      const re = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;
      let m;
      while ((m = re.exec(line.slice(Tag.STREAM.length)))) out[m[1]] = m[2];
      return out;
    }

    // 排序依据：[像素面积, 码率]
    static score(line) {
      const a = Playlist.attrs(line);
      const [w, h] = (a[Tag.RESOLUTION] || '0x0').split('x').map(Number);
      return [(w || 0) * (h || 0), Number(a[Tag.BANDWIDTH]) || 0];
    }

    // 返回改写后的文本；不是主列表或只有一个档位时原样返回
    static best(text) {
      if (!Playlist.isMaster(text)) return text;
      const lines = text.split(/\r?\n/);
      const head = [];
      const vars = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (!l.startsWith(Tag.STREAM)) { head.push(l); continue; }
        let j = i + 1;
        while (j < lines.length && (!lines[j].trim() || lines[j].startsWith('#'))) j++;
        if (j >= lines.length) { head.push(l); continue; }
        vars.push({ inf: l, uri: lines[j], score: Playlist.score(l) });
        i = j;
      }
      if (vars.length < 2) return text;
      vars.sort((a, b) => b.score[0] - a.score[0] || b.score[1] - a.score[1]);
      const top = vars[0];
      while (head.length && !head[head.length - 1].trim()) head.pop();
      return [...head, top.inf, top.uri, Net.EMPTY].join('\n');
    }
  }

  globalThis.__xvmq.Playlist = Playlist;
})();
