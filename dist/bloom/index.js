// node_modules/@oscarpalmer/atoms/dist/js/queue.mjs
if (globalThis._atomic_queued === undefined) {
  const queued = new Set;
  Object.defineProperty(globalThis, "_atomic_queued", {
    get() {
      return queued;
    }
  });
}

// node_modules/@oscarpalmer/sentinel/dist/global.mjs
if (globalThis._sentinels == null) {
  const effects = [];
  Object.defineProperty(globalThis, "_sentinels", {
    get() {
      return effects;
    }
  });
}

// node_modules/@oscarpalmer/sentinel/dist/effect.mjs
var effect = function(callback) {
  const state = {
    callback,
    active: false,
    reactives: new Set
  };
  const instance = Object.create({
    start() {
      if (!state.active) {
        state.active = true;
        const index = globalThis._sentinels.push(state) - 1;
        state.callback();
        globalThis._sentinels.splice(index, 1);
      }
    },
    stop() {
      if (state.active) {
        state.active = false;
        for (const reactive of state.reactives) {
          reactive.effects.delete(state);
        }
        state.reactives.clear();
      }
    }
  });
  Object.defineProperty(instance, "$sentinel", {
    value: "effect"
  });
  instance.start();
  return instance;
};

// node_modules/@oscarpalmer/sentinel/dist/helpers/is.mjs
var isEffect = function(value) {
  return isSentinel(value, /^effect$/i);
};
var isReactive = function(value) {
  return isSentinel(value, /^computed|list|signal|store$/i);
};
var isSentinel = function(value, expression) {
  return expression.test(value?.$sentinel ?? "");
};

// node_modules/@oscarpalmer/sentinel/dist/helpers/value.mjs
var arrayOperations = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift"
]);

// node_modules/@oscarpalmer/sentinel/dist/reactive/index.mjs
var primitives = new Set(["boolean", "number", "string"]);

// src/bloom/store.ts
function storeNode(node, data) {
  let stored = store.get(node);
  if (stored == null) {
    stored = {
      effects: new Set,
      events: new Map
    };
    store.set(node, stored);
  }
  if (data.effect != null) {
    stored.effects.add(data.effect);
  }
  if (data.event != null) {
    let events = stored.events.get(data.event.name);
    if (events == null) {
      events = new Map;
      stored.events.set(data.event.name, events);
    }
    if (!events.has(data.event.listener)) {
      events.set(data.event.listener, data.event);
    }
  }
}
var store = new WeakMap;

// src/bloom/event.ts
function addEvent(element, attribute, value9) {
  element.removeAttribute(attribute);
  if (typeof value9 !== "function") {
    return;
  }
  const parameters = getParameters(attribute);
  element.addEventListener(parameters.name, value9, parameters.options);
  storeNode(element, {
    event: { element, listener: value9, ...parameters }
  });
}
var getParameters = function(attribute) {
  const parts = attribute.slice(1).toLowerCase().split(":");
  const name = parts.shift();
  const options = {
    capture: parts.includes("capture"),
    once: parts.includes("once"),
    passive: !parts.includes("active")
  };
  return { name, options };
};

// src/bloom/attribute.ts
var getIndex = function(value9) {
  const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value9) ?? [];
  return index == null ? -1 : +index;
};
var getSetter = function(name, allowAny) {
  switch (true) {
    case booleanAttributes.has(name.toLowerCase()):
      return setBoolean;
    case /^class\.\w/.test(name):
      return setClasses;
    case /^style\.\w/.test(name):
      return setStyle;
    default:
      return allowAny ? setAny : undefined;
  }
};
var isBadAttribute = function(attribute) {
  const { name, value: value9 } = attribute;
  return /^on/i.test(name) || /^(href|src|xlink:href)$/i.test(name) && /(data:text\/html|javascript:)/i.test(value9);
};
function mapAttributes(values, element) {
  const attributes = Array.from(element.attributes);
  const { length } = attributes;
  let index = 0;
  for (;index < length; index += 1) {
    const attribute = attributes[index];
    const value9 = values[getIndex(attribute.value)];
    const badAttribute = isBadAttribute(attribute);
    if (badAttribute) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if (attribute.name.startsWith("@")) {
      addEvent(element, attribute.name, value9);
    } else {
      const isFunction = typeof value9 === "function";
      const fx = getSetter(attribute.name, isFunction)?.(element, attribute.name, isFunction ? value9() : attribute.value);
      if (isEffect(fx)) {
        storeNode(element, { effect: fx });
      }
    }
  }
}
var setAny = function(element, name, value9) {
  if (isReactive(value9)) {
    return effect(() => setAnyAttribute(element, name, value9.get()));
  }
  setAnyAttribute(element, name, value9);
};
var setAnyAttribute = function(element, name, value9) {
  if (value9 == null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, String(value9));
  }
};
var setBoolean = function(element, name, value9) {
  if (isReactive(value9)) {
    return effect(() => setBooleanAttribute(element, name, value9.get()));
  }
  setBooleanAttribute(element, name, value9);
};
var setBooleanAttribute = function(element, name, value9) {
  if (/^(|true)$/i.test(String(value9))) {
    element.setAttribute(name, "");
  } else {
    element.removeAttribute(name);
  }
};
var setClasses = function(element, name, value9) {
  const classes = name.split(".").slice(1).filter((name2) => name2.length > 0);
  if (classes.length === 0) {
    return;
  }
  if (isReactive(value9)) {
    return effect(() => updateClassList(element, classes, value9.get()));
  }
  updateClassList(element, classes, value9);
};
var setStyle = function(element, name, value9) {
  if (!isStylableElement(element)) {
    return;
  }
  const [, first, second] = name.split(".");
  const property = first.trim();
  const suffix = second?.trim();
  if (property.length === 0 || suffix != null && suffix.length === 0) {
    return;
  }
  if (isReactive(value9)) {
    return effect(() => updateStyleProperty(element, property, suffix, value9.get()));
  }
  updateStyleProperty(element, property, suffix, value9);
};
var updateClassList = function(element, classes, value9) {
  if (value9 === true) {
    element.classList.add(...classes);
  } else {
    element.classList.remove(...classes);
  }
};
var updateStyleProperty = function(element, property, suffix, value9) {
  if (value9 == null || value9 === false || value9 === true && suffix == null) {
    element.style.removeProperty(property);
  } else {
    element.style.setProperty(property, value9 === true ? String(suffix) : `${value9}${suffix ?? ""}`);
  }
};
var booleanAttributes = new Set([
  "checked",
  "disabled",
  "hidden",
  "inert",
  "multiple",
  "open",
  "readonly",
  "required",
  "selected"
]);

// src/bloom/node.ts
function createNode(value9) {
  if (value9 instanceof Node) {
    return value9;
  }
  if (isBloom(value9)) {
    return value9.grow();
  }
  return document.createTextNode(String(value9));
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
var getIndex2 = function(value9) {
  const [, index] = /^bloom\.(\d+)$/.exec(value9) ?? [];
  return index == null ? -1 : +index;
};
function isStylableElement(element) {
  return element instanceof HTMLElement || element instanceof SVGElement;
}
function mapNodes(values, node2) {
  const children = Array.from(node2.childNodes);
  const { length } = children;
  let index = 0;
  for (;index < length; index += 1) {
    const child = children[index];
    if (child.nodeType === 8) {
      setValue2(values, child);
      continue;
    }
    if (child instanceof Element) {
      mapAttributes(values, child);
    }
    if (child.hasChildNodes()) {
      mapNodes(values, child);
    }
  }
  return node2;
}
var setFunction = function(comment, callback) {
  const value9 = callback();
  if (isReactive(value9)) {
    setReactive(comment, value9);
  } else {
    setNode(comment, value9);
  }
};
var setNode = function(comment, value9) {
  const node2 = createNode(value9);
  comment.replaceWith(.../^documentfragment$/i.test(node2.constructor.name) ? Array.from(node2.childNodes) : [node2]);
};
var setReactive = function(comment, reactive3) {
  const text = document.createTextNode("");
  const fx = effect(() => {
    const value9 = reactive3.get();
    text.textContent = String(value9);
    if (value9 == null && text.parentNode != null) {
      text.replaceWith(comment);
    } else if (value9 != null && text.parentNode == null) {
      comment.replaceWith(text);
    }
  });
  storeNode(comment, { effect: fx });
  storeNode(text, { effect: fx });
};
var setValue2 = function(values, comment) {
  const value9 = values[getIndex2(comment.nodeValue ?? "")];
  if (value9 == null) {
    return;
  }
  if (typeof value9 === "function") {
    setFunction(comment, value9);
  } else {
    setNode(comment, value9);
  }
};

// src/bloom/index.ts
function bloom2(strings, ...expressions) {
  const data = {
    expressions,
    strings,
    html: "",
    values: []
  };
  const instance = Object.create({
    grow() {
      const html = getHtml(data);
      const nodes = createNodes(html);
      return mapNodes(data.values, nodes);
    }
  });
  Object.defineProperty(instance, "$bloom", {
    value: true
  });
  return instance;
}
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
  if (typeof expression === "function" || expression instanceof Node || isBloom(expression)) {
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
function isBloom(value9) {
  return value9?.$sentinel === true;
}
export {
  isBloom,
  bloom2 as bloom
};
