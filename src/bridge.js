// 隔离环境：把开关状态写到 <html> 属性上，供页面主环境的 Hook 读取；切换后实时生效
// Chrome 对同一文件每页只注入一次（不分 world），const.js 已被主环境占用，故此处动态加载
(async () => {
  await import(chrome.runtime.getURL('src/const.js'));
  const { State } = globalThis.__xvmq;

  class Bridge {
    static set(on) {
      document.documentElement.setAttribute(State.ATTR, on === false ? State.OFF : State.ON);
    }

    static run() {
      chrome.storage.local.get(State.KEY).then((s) => Bridge.set(s[State.KEY]));
      chrome.storage.onChanged.addListener((c) => {
        if (State.KEY in c) Bridge.set(c[State.KEY].newValue);
      });
    }
  }

  Bridge.run();
})();
