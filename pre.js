(function (global) {
  function register(property, value) {
    return Object.defineProperty(global, property, {
      configurable: false,
      enumerable: false,
      writable: false,
      value,
    });
  }

  register("register", register);

  ["div", "span", "main", "section", "style", "script", "link"].forEach((key) =>
    register(key, (html, prop) => {
      const oDom = document.createElement(key);
      if (html) {
        oDom.innerHTML = html;
      }
      if (prop) {
        Object.keys(prop).forEach((key) => {
          oDom.setAttribute(key, prop[key]);
        });
      }
      return oDom;
    })
  );
  register("text", (text) => document.createTextNode(text));

  class AppDom extends HTMLElement {
    constructor() {
      super();
    }
    $appendChild(dom) {
      this.shadow.appendChild(dom);
    }
    $removeChild(dom) {
      this.shadow.removeChild(dom);
    }
    $replaceChild(dom, node) {
      this.shadow.replaceChild(dom, node);
    }
    static $define(component) {
      const name = this.$pascalToKebab(component.name);
      customElements.define(name, component);
      register(component.name, () => document.createElement(name));
    }
    static $pascalToKebab(str) {
      return str.replace(
        /([A-Z])/g,
        (_, p1, offset) => `${offset ? "-" : ""}${p1.toLowerCase()}`
      );
    }
    static getPeerId() {
      const PEER_ID = "PEER_ID";
      let PeerId = localStorage.getItem(PEER_ID);
      if (!PeerId) {
        PeerId = "blind_chess_" + Math.random().toString(16).substring(2);
        localStorage.setItem(PEER_ID, PeerId);
      }
      return PeerId;
    }
    static $store = {};
    static peer = new Peer(this.getPeerId());
    static peerConn = null;
    static connActionPool = new Map();
    $on(name, fn) {
      AppDom.connActionPool.set(
        name,
        AppDom.connActionPool.has(name) ? [...AppDom.get(name), fn] : [fn]
      );
    }
    $emit(name, ...payloads) {
      const v = AppDom.connActionPool.get(name);
      if (v) {
        v.forEach((fn) => {
          fn(...payloads);
        });
      }
    }
    $off(name, fn) {
      if (AppDom.connActionPool.has(name)) {
        AppDom.connActionPool.set(
          AppDom.connActionPool.get(name).filter((v) => v !== fn)
        );
      }
    }
    $clear() {
      AppDom.connActionPool.clear();
    }
    get peer() {
      return AppDom.peer;
    }
    get peerId() {
      return this.peer.id;
    }
    get peerConn() {
      return AppDom.peerConn;
    }
    set peerConn(conn) {
      this.setPeerConn(conn);
    }
    setPeerConn(conn, i = false) {
      AppDom.peerConn = conn;
      if (conn) {
        conn.on("open", () => {
          this.$emit("open", i);
        });
        conn.on("data", (d) => {
          try {
            const data = JSON.parse(d);
            this.$emit(data.type, data);
          } catch (error) {
            console.error(error);
          }
        });
        conn.on("close", () => {
          console.warn("close");
          this.peerConn = null;
          this.$emit("close");
        });
      }
    }
    send(data) {
      if (!this.peerConn) return;
      this.peerConn.send(JSON.stringify(data));
    }
    get $store() {
      return AppDom.$store;
    }
    mode = "closed";
    connectedCallback() {
      this.shadow = this.attachShadow({ mode: this.mode });
      this.render && this.render();
    }
    disconnectedCallback() {
      this.__unmountedPool.forEach((fn) => fn(this));
    }
    __unmountedPool = [];
    $onUnmounted(callback) {
      if (callback instanceof Function) {
        this.__unmountedPool.push(callback);
      }
    }
    adoptedCallback() {}
    static get observedAttributes() {
      return [];
    }
    attributeChangedCallback(key, oldValue, newValue) {}
  }
  register(AppDom.name, AppDom);

  const HAS_SYNC_IMPORT_MAP = new Map();
  function syncImport(path) {
    return new Promise((resolve) => {
      if (HAS_SYNC_IMPORT_MAP.has(path)) {
        resolve(true);
      } else {
        fetch(path)
          .then(async (response) => ({
            text: await response.text(),
            type: response.headers.get("Content-Type"),
            response,
          }))
          .then(({ text, type, response }) => {
            if (response.status > 399) {
              throw Error(`资源加载出错${response.status}`);
            }
            switch (type) {
              case "application/javascript; charset=UTF-8":
                {
                  const o = script(null, { type: "text/javascript" });
                  o.textContent = text;
                  document.body.appendChild(o);
                }
                break;
              case "text/css; charset=UTF-8":
                {
                  const o = style(null, { type: "text/css" });
                  o.textContent = text;
                  document.head.appendChild(o);
                }
                break;
              default:
                break;
            }
            HAS_SYNC_IMPORT_MAP.set(path, true);
            resolve(true);
          })
          .catch(() => resolve(false));
      }
    });
  }
  register(syncImport.name, syncImport);
})(this);
