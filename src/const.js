// 全部常量集中于此，按用途分组；挂到私有命名空间避免污染页面全局
(() => {
  class Tag {
    static STREAM = '#EXT-X-STREAM-INF:';
    static BANDWIDTH = 'BANDWIDTH';
    static RESOLUTION = 'RESOLUTION';
  }

  class Net {
    static HOST = 'video.twimg.com';
    static EXT = '.m3u8';
    static TEXT = 'text';
    static EMPTY = '';
  }

  class Prop {
    static URL = '__xvmqUrl';
    static CACHE = '__xvmqText';
    static RESPONSE = 'response';
    static TEXT = 'responseText';
    static URL_KEY = 'url';
    static DONE = 4;
  }

  class Log {
    static PREFIX = '[XVideoMaxQuality]';
    static PICKED = 'picked';
  }

  // 开关状态：存储键 + 页面 <html> 属性（隔离环境 → 页面主环境的桥）
  class State {
    static KEY = 'enabled';
    static ATTR = 'data-xvmq';
    static ON = 'on';
    static OFF = 'off';
  }

  class Badge {
    static OFF = 'OFF';
    static NONE = '';
    static COLOR = '#536471';
    static TITLE_ON = 'X 视频最高画质：已开启（点击关闭）';
    static TITLE_OFF = 'X 视频最高画质：已关闭（点击开启）';
  }

  class Icon {
    static SIZES = [16, 32, 48, 128];
    // 以 / 开头：setIcon 的相对路径按 src/bg.js 所在目录解析
    static ON = '/icons/on';
    static OFF = '/icons/off';
    static path(base) {
      return Object.fromEntries(Icon.SIZES.map((s) => [s, `${base}-${s}.png`]));
    }
  }

  Object.assign((globalThis.__xvmq ??= {}), { Tag, Net, Prop, Log, State, Badge, Icon });
})();
