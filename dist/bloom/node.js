// node_modules/@oscarpalmer/atoms/dist/js/queue.mjs
if (globalThis._atomic_effects === undefined) {
  const queued = new Set;
  Object.defineProperty(globalThis, "_atomic_queued", {
    get() {
      return queued;
    }
  });
}

// node_modules/@oscarpalmer/atoms/dist/js/signal.mjs
var effect = function(callback) {
  return new Effect(callback);
};
var isComputed = function(value) {
  return isInstance(/^computed$/i, value);
};
var isReactive = function(value) {
  return isComputed(value) || isSignal(value);
};
var isSignal = function(value) {
  return isInstance(/^signal$/i, value);
};
var isInstance = function(expression, value) {
  return expression.test(value?.constructor?.name ?? "") && value.atomic === true;
};
if (globalThis._atomic_effects === undefined) {
  const effects = [];
  Object.defineProperty(globalThis, "_atomic_effects", {
    get() {
      return effects;
    }
  });
}

class Atomic {
  constructor() {
    Object.defineProperty(this, "atomic", {
      value: true
    });
  }
}

class Reactive extends Atomic {
  constructor() {
    super(...arguments);
  }
  _active = true;
  _effects = new Set;
  peek() {
    return this._value;
  }
  toJSON() {
    return this.value;
  }
  toString() {
    return String(this.value);
  }
}
class Effect extends Atomic {
  _callback;
  _active = false;
  _reactives = new Set;
  constructor(_callback) {
    super();
    this._callback = _callback;
    this.run();
  }
  run() {
    if (this._active) {
      return;
    }
    this._active = true;
    const index = _atomic_effects.push(this) - 1;
    this._callback();
    _atomic_effects.splice(index, 1);
  }
  stop() {
    if (!this._active) {
      return;
    }
    this._active = false;
    for (const value of this._reactives) {
      value._effects.delete(this);
    }
    this._reactives.clear();
  }
}

// src/bloom/index.ts
var getHtml = function(data) {
  if (data.html.length > 0) {
    return data.html;
  }
  const { length } = data.strings;
  let index = 0;
  for (;index < length; index += 1) {
    data.html += getPart(data, data.strings[index], data.expressions[index]);
  }
  return data.html;
};
var getPart = function(data, prefix, expression) {
  if (expression == null) {
    return prefix;
  }
  if (typeof expression === "function" || expression instanceof Node || expression instanceof Bloom) {
    data.values.push(expression);
    return `${prefix}<!--bloom.${data.values.length - 1}-->`;
  }
  if (Array.isArray(expression)) {
    const { length } = expression;
    let html = "";
    let index = 0;
    for (;index < length; index += 1) {
      html += getPart(data, "", expression[index]);
    }
    return `${prefix}${html}`;
  }
  return `${prefix}${expression}`;
};
function isBloom(value) {
  return value instanceof Bloom;
}

class Bloom {
  constructor(strings, ...expressions) {
    this.data = {
      expressions,
      strings,
      html: "",
      values: []
    };
  }
  grow() {
    const html = getHtml(this.data);
    const nodes = createNodes(html);
    return mapNodes(this.data.values, nodes);
  }
}

// src/bloom/node.ts
function createNode(value) {
  if (value instanceof Node) {
    return value;
  }
  if (isBloom(value)) {
    return value.grow();
  }
  return document.createTextNode(String(value));
}
function createNodes(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const cloned = template.content.cloneNode(true);
  const scripts = Array.from(cloned instanceof Element ? cloned.querySelectorAll("script") : []);
  for (const script of scripts) {
    script.remove();
  }
  cloned.normalize();
  return cloned;
}
var getIndex = function(value) {
  const [, index] = /^bloom\.(\d+)$/.exec(value) ?? [];
  return index == null ? -1 : +index;
};
function mapNodes(values, node2) {
  const children = Array.from(node2.childNodes);
  const { length } = children;
  let index = 0;
  for (;index < length; index += 1) {
    const child = children[index];
    if (child.nodeType === 8) {
      setValue(values, child);
      continue;
    }
    if (child instanceof Element) {
    }
    if (child.hasChildNodes()) {
      mapNodes(values, child);
    }
  }
  return node2;
}
var setFunction = function(comment, callback) {
  const value = callback();
  if (isReactive(value)) {
    setReactive(comment, value);
  } else {
    setNode(comment, value);
  }
};
var setNode = function(comment, value) {
  const node2 = createNode(value);
  comment.replaceWith(.../^documentfragment$/i.test(node2.constructor.name) ? Array.from(node2.childNodes) : [node2]);
};
var setReactive = function(comment, reactive) {
  const text = document.createTextNode("");
  effect(() => {
    const { value } = reactive;
    text.textContent = String(value);
    if (value == null && text.parentNode != null) {
      text.replaceWith(comment);
    } else if (value != null && text.parentNode == null) {
      comment.replaceWith(text);
    }
  });
};
var setValue = function(values, comment) {
  const index = getIndex(comment.nodeValue ?? "");
  const value = values[index];
  if (value == null) {
    return;
  }
  if (typeof value === "function") {
    setFunction(comment, value);
  } else {
    setNode(comment, value);
  }
};
export {
  mapNodes,
  createNodes,
  createNode
};
