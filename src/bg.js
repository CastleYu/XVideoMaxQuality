// 后台：点击扩展栏按钮切换开关，并同步图标 / 角标 / 提示文字
importScripts('const.js');

(() => {
  const { State, Badge, Icon } = globalThis.__xvmq;

  class Bg {
    static async get() {
      const s = await chrome.storage.local.get(State.KEY);
      return s[State.KEY] !== false;
    }

    static async paint(on) {
      await Promise.all([
        chrome.action.setIcon({ path: Icon.path(on ? Icon.ON : Icon.OFF) }),
        chrome.action.setBadgeText({ text: on ? Badge.NONE : Badge.OFF }),
        chrome.action.setBadgeBackgroundColor({ color: Badge.COLOR }),
        chrome.action.setTitle({ title: on ? Badge.TITLE_ON : Badge.TITLE_OFF }),
      ]);
    }

    static async toggle() {
      const on = !(await Bg.get());
      await chrome.storage.local.set({ [State.KEY]: on });
      await Bg.paint(on);
    }

    static async init() {
      await Bg.paint(await Bg.get());
    }

    static run() {
      globalThis.__xvmq.Bg = Bg;
      chrome.action.onClicked.addListener(Bg.toggle);
      chrome.runtime.onInstalled.addListener(Bg.init);
      chrome.runtime.onStartup.addListener(Bg.init);
    }
  }

  Bg.run();
})();
