// ../code-standard/dist/index.mjs
var CDN = "https://testingcf.jsdelivr.net";
var textarea = /* @__PURE__ */ (() => typeof document === "object" ? document.createElement("textarea") : void 0)();
var decodeHTML = (str) => {
  textarea.innerHTML = str;
  return textarea.value;
};
var rawurldecode = (str) => decodeURIComponent(str.replace(/%(?![\da-f]{2})/giu, "%25"));
var normalizeTitle = (title) => {
  const decoded = rawurldecode(title);
  return /[<>[\]|{}]/u.test(decoded) ? decoded : decodeHTML(decoded);
};
var regex = /* @__PURE__ */ (() => {
  const hexColor = String.raw`#(?:[\da-f]{3,4}|(?:[\da-f]{2}){3,4})(?![\p{L}\p{N}_])`, rgbValue = String.raw`(?:\d*\.)?\d+%?`, hue = String.raw`(?:\d*\.)?\d+(?:deg|grad|rad|turn)?`, rgbColor = String.raw`rgba?\(\s*(?:${String.raw`${new Array(3).fill(rgbValue).join(String.raw`\s+`)}(?:\s*\/\s*${rgbValue})?`}|${String.raw`${new Array(3).fill(rgbValue).join(String.raw`\s*,\s*`)}(?:\s*,\s*${rgbValue})?`})\s*\)`, hslColor = String.raw`hsla?\(\s*(?:${String.raw`${hue}\s+${rgbValue}\s+${rgbValue}(?:\s*\/\s*${rgbValue})?`}|${String.raw`${hue}${String.raw`\s*,\s*(?:\d*\.)?\d+%`.repeat(2)}(?:\s*,\s*${rgbValue})?`})\s*\)`;
  return {
    full: new RegExp(String.raw`(^|[^\p{L}\p{N}_])(${hexColor}|${rgbColor}|${hslColor})`, "giu"),
    rgb: new RegExp(String.raw`(^|[^\p{L}\p{N}_])(${hexColor}|${rgbColor})`, "giu")
  };
})();
var splitColors = (str, hsl = true) => {
  const pieces = [], re = regex[hsl ? "full" : "rgb"];
  re.lastIndex = 0;
  let mt = re.exec(str), lastIndex = 0;
  while (mt) {
    const index = mt.index + mt[1].length;
    if (index > lastIndex) {
      pieces.push([str.slice(lastIndex, index), lastIndex, index, false]);
    }
    ({ lastIndex } = re);
    pieces.push([mt[2], index, lastIndex, str[index - 1] !== "&" || !/^#\d+$/u.test(mt[2])]);
    mt = re.exec(str);
  }
  if (str.length > lastIndex) {
    pieces.push([str.slice(lastIndex), lastIndex, str.length, false]);
  }
  return pieces;
};
var loading = /* @__PURE__ */ new Map();
var loadScript = (src, globalConst, amd) => {
  if (loading.has(src)) {
    return loading.get(src);
  }
  const promise = new Promise((resolve) => {
    const path = /^https?:\/\//iu.test(src) ? src : `${CDN}/${src}`;
    let obj = globalThis;
    for (const prop of globalConst.split(".")) {
      obj = obj == null ? void 0 : obj[prop];
    }
    if (obj) {
      resolve();
    } else if (amd && typeof define === "function" && "amd" in define) {
      const requirejs = globalThis.require;
      requirejs.config({ paths: { [globalConst]: path } });
      requirejs([globalConst], (exports) => {
        Object.assign(globalThis, { [globalConst]: exports });
        resolve();
      });
    } else {
      const script = document.createElement("script");
      script.src = path;
      script.onload = () => {
        resolve();
      };
      document.head.append(script);
    }
  });
  loading.set(src, promise);
  return promise;
};

// src/wiki.ts
var jsonTags = /* @__PURE__ */ new Set(["templatedata", "maplink", "mapframe"]);
var latexTags = /* @__PURE__ */ new Set(["math", "chem", "ce"]);
var getTo = (node) => node.getAbsoluteIndex() + String(node).length;
var wiki_default = (theme) => {
  mw.loader.load("mediawiki.Title");
  const wiki = {};
  Prism.languages["wiki"] = wiki;
  const keyword = "keyword", url = "url", urlLink = "url url-link", mwLink = "mw-link", bold = "bold", doctype = "doctype", comment = "comment", tag = "tag", punctuation = "punctuation", variable = "variable", builtin = "builtin", template = theme === "dark" || theme === "funky" ? "builtin" : "function", symbol = "symbol", selector = "selector", string = "string", map = {
    "redirect-syntax": keyword,
    "redirect-target": url,
    "link-target": `${url} ${bold} ${mwLink}`,
    translate: tag,
    "translate-attr": "attr-name",
    noinclude: doctype,
    include: doctype,
    comment,
    ext: tag,
    "ext-attr-dirty": comment,
    "ext-attr": punctuation,
    "attr-key": "attr-name",
    "attr-value": "attr-value",
    arg: variable,
    "arg-name": variable,
    hidden: comment,
    "magic-word": builtin,
    "magic-word-name": builtin,
    "invoke-function": template,
    "invoke-module": template,
    template,
    "template-name": `${template} ${bold} ${mwLink}`,
    parameter: punctuation,
    "parameter-key": variable,
    heading: symbol,
    "heading-title": bold,
    html: tag,
    "html-attr-dirty": comment,
    "html-attr": punctuation,
    table: symbol,
    tr: symbol,
    td: symbol,
    "table-syntax": symbol,
    "table-attr-dirty": comment,
    "table-attr": punctuation,
    "table-inter": "deleted",
    hr: symbol,
    "double-underscore": "constant",
    link: url,
    category: url,
    file: url,
    "gallery-image": url,
    "imagemap-image": url,
    "image-parameter": keyword,
    quote: `${symbol} ${bold}`,
    "ext-link": url,
    "ext-link-url": urlLink,
    "free-ext-link": urlLink,
    "magic-link": url,
    list: symbol,
    dd: symbol,
    converter: selector,
    "converter-flags": punctuation,
    "converter-flag": string,
    "converter-rule": punctuation,
    "converter-rule-variant": string
  };
  const { tokenize } = Prism;
  Prism.tokenize = (s, grammar) => {
    if (grammar === wiki) {
      const code = s.replace(/[\0\x7F]/gu, ""), root = Parser.parse(code), output = [];
      try {
        root.json();
      } catch {
      }
      let cur = root, last = 0, out = false;
      const slice = (node, text, complex = true, color) => {
        var _a;
        if (!text) {
          return;
        }
        const { type, parentNode } = node, pType = parentNode == null ? void 0 : parentNode.type;
        let t = type === "text" ? pType : type;
        if (type === "text" && pType === "image-parameter") {
          t = "root";
        } else if (type === "converter" && text === ";") {
          t = "converter-rule";
        }
        let str = (color ? "color " : "") + ((_a = map[t]) != null ? _a : "");
        if (complex && str.endsWith("-link")) {
          str = str.replace(/(?:^| )\S+-link$/u, "");
        }
        output.push(str ? new Prism.Token(str, [text]) : text);
      };
      const push = (node) => {
        const to = getTo(node);
        if (last === to) {
          return;
        }
        const { parentNode } = node, { type: pType, name: pName, length: l } = parentNode, text = code.slice(last, to);
        if (!out && (pType === "attr-value" || (pType === "parameter-value" || pType === "arg-default") && l === 1)) {
          for (const [, start, end, isColor] of splitColors(text)) {
            slice(node, text.slice(start, end), false, isColor);
          }
          return;
        } else if (pType === "ext-inner") {
          if (jsonTags.has(pName)) {
            output.push(...Prism.tokenize(text, Prism.languages["json"]));
            return;
          } else if (latexTags.has(pName)) {
            const tokens = Prism.tokenize(`$${text}$`, Prism.languages["latex"]), token = tokens[0];
            if (tokens.length === 1 && token.type === "equation") {
              const { content } = token;
              if (typeof content === "string") {
                token.content = content.slice(1, -1);
                output.push(token);
                return;
              } else if (Array.isArray(content)) {
                const { length: n } = content;
                try {
                  content[0] = content[0].slice(1);
                  content[n - 1] = content[n - 1].slice(0, -1);
                  output.push(token);
                  return;
                } catch {
                }
              }
            }
          } else if (pName === "score") {
            const lang = parentNode.parentNode.getAttr("lang");
            if (lang === void 0 || lang === "lilypond") {
              output.push(...Prism.tokenize(text, Prism.languages["lilypond"]));
              return;
            }
          }
        }
        slice(node, text, l !== 1);
      };
      while (last < code.length) {
        const { firstChild, parentNode } = cur, to = getTo(cur);
        if (out || !firstChild) {
          if (last < to) {
            if (out) {
              slice(cur, code.slice(last, to));
            } else {
              push(cur);
            }
            last = to;
          }
          if (parentNode.lastChild === cur) {
            cur = parentNode;
            out = true;
          } else {
            cur = cur.nextSibling;
            out = false;
            const from = cur.getAbsoluteIndex();
            if (last < from) {
              slice(parentNode, code.slice(last, from));
              last = from;
            }
          }
        } else {
          const from = firstChild.getAbsoluteIndex();
          if (last < from) {
            if (cur.type === "template" && cur.modifier) {
              slice(cur, code.slice(last, last + 2), false);
              slice({ type: "magic-word-name" }, code.slice(last + 2, from), false);
            } else {
              slice(cur, code.slice(last, from));
            }
            last = from;
          }
          cur = firstChild;
        }
      }
      return output;
    }
    return tokenize(s, grammar);
  };
  Prism.hooks.add("wrap", (env) => {
    var _a;
    const { content, language, type } = env;
    if (language !== "wiki" || content === void 0) {
    } else if (type == null ? void 0 : type.startsWith("color")) {
      env.content = `<span class="inline-color-wrapper"><span class="inline-color" style="background-color:${content};"></span></span>${content}`;
    } else if (type == null ? void 0 : type.endsWith(mwLink)) {
      const ns = type.startsWith(template) ? 10 : 0, uri = content.startsWith("/") ? `:${mw.config.get("wgPageName")}${content}` : content;
      (_a = env.attributes) != null ? _a : env.attributes = {};
      try {
        env.attributes["href"] = new mw.Title(normalizeTitle(uri), ns).getUrl(void 0);
      } catch {
      }
    }
  });
};

// src/gh-page.ts
Object.assign(globalThis, {
  mw: {
    loader: {
      load() {
      }
    },
    config: {
      get() {
        return "";
      }
    }
  }
});
(async () => {
  await loadScript(
    "combine/npm/prismjs@1.29.0/components/prism-core.min.js,npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js",
    "Prism"
  );
  wiki_default();
  let timer, highlighting = false;
  const textarea2 = document.querySelector("textarea"), pre = document.querySelector("pre");
  textarea2.addEventListener("input", () => {
    if (timer) {
      clearTimeout(timer);
    }
    if (!highlighting) {
      timer = setTimeout(() => {
        pre.firstElementChild.textContent = textarea2.value;
        highlighting = true;
        Prism.highlightElement(pre.firstElementChild, false, () => {
          highlighting = false;
        });
      }, 1e3);
    }
  });
})();
