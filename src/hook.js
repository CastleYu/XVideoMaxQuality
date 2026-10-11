// 在页面主环境拦截 XHR / fetch 返回的 m3u8，改写为最高画质
(() => {
  const { Net, Prop, Log, State, Playlist } = globalThis.__xvmq;

  class Hook {
    // 属性未写入前默认视为开启
    static on() {
      return document.documentElement?.getAttribute(State.ATTR) !== State.OFF;
    }

    static match(url) {
      try {
        const u = new URL(String(url), location.href);
        return u.hostname === Net.HOST && u.pathname.endsWith(Net.EXT);
      } catch {
        return false;
      }
    }

    static fix(text, url) {
      if (!Hook.on()) return text;
      const out = Playlist.best(text);
      if (out !== text) console.debug(Log.PREFIX, Log.PICKED, url);
      return out;
    }

    static xhr() {
      const P = XMLHttpRequest.prototype;
      const open = P.open;
      P.open = function (method, url, ...rest) {
        this[Prop.URL] = Hook.match(url) ? String(url) : null;
        this[Prop.CACHE] = null;
        return open.call(this, method, url, ...rest);
      };
      for (const key of [Prop.RESPONSE, Prop.TEXT]) {
        const d = Object.getOwnPropertyDescriptor(P, key);
        Object.defineProperty(P, key, {
          configurable: true,
          enumerable: d.enumerable,
          get() {
            const raw = d.get.call(this);
            const url = this[Prop.URL];
            if (!url || this.readyState !== Prop.DONE || typeof raw !== 'string') return raw;
            if (this[Prop.CACHE] === null) this[Prop.CACHE] = Hook.fix(raw, url);
            return this[Prop.CACHE];
          },
        });
      }
    }

    static fetch() {
      const orig = globalThis.fetch;
      globalThis.fetch = async function (input, init) {
        const res = await orig.call(this, input, init);
        const url = input instanceof Request ? input.url : input;
        if (!Hook.match(url) || !res.ok) return res;
        try {
          const raw = await res.clone().text();
          const out = Hook.fix(raw, url);
          if (out === raw) return res;
          const r = new Response(out, { status: res.status, statusText: res.statusText, headers: res.headers });
          Object.defineProperty(r, Prop.URL_KEY, { value: res.url });
          return r;
        } catch {
          return res;
        }
      };
    }

    static run() {
      if (globalThis.__xvmq.Hook) return;
      globalThis.__xvmq.Hook = Hook;
      Hook.xhr();
      Hook.fetch();
    }
  }

  Hook.run();
})();
