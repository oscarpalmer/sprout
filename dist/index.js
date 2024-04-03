// src/bloom/is.ts
function isBadAttribute(attribute) {
  const { name, value } = attribute;
  return /^on/i.test(name) || /^(href|src|xlink:href)$/i.test(name) && /(data:text\/html|javascript:)/i.test(value);
}
function isBloom(value) {
  return value?.$sentinel === true;
}
function isStylableElement(element) {
  return element instanceof HTMLElement || element instanceof SVGElement;
}

// src/bloom/html.ts
function getHtml(data) {
  if (data.html.length > 0) {
    return data.html;
  }
  const { length } = data.strings;
  let index = 0;
  for (;index < length; index += 1) {
    data.html += getPartial(data, data.strings[index], data.expressions[index]);
  }
  return data.html;
}
var getPartial = function(data, prefix, expression) {
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
      html += getPartial(data, "", expression[index]);
    }
    return `${prefix}${html}`;
  }
  return `${prefix}${expression}`;
};

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
function mapNodes(values, node) {
  const children = Array.from(node.childNodes);
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
  return node;
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
  const node = createNode(value9);
  comment.replaceWith(.../^documentfragment$/i.test(node.constructor.name) ? Array.from(node.childNodes) : [node]);
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
function bloom(strings, ...expressions) {
  const data = {
    expressions,
    strings,
    html: "",
    values: []
  };
  const instance = Object.create({
    grow() {
      const html2 = getHtml(data);
      const nodes = createNodes(html2);
      return mapNodes(data.values, nodes);
    }
  });
  Object.defineProperty(instance, "$bloom", {
    value: true
  });
  return instance;
}
// src/petal/index.ts
var getAttributes = function(from, to) {
  const fromValues = from.split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 0);
  const toValues = to.split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 0);
  const result = [[], []];
  for (let outer = 0;outer < 2; outer += 1) {
    const values = outer === 0 ? fromValues : toValues;
    const other = outer === 1 ? fromValues : toValues;
    const { length } = values;
    for (let inner = 0;inner < length; inner += 1) {
      const value9 = values[inner];
      if (!other.includes(value9)) {
        result[outer].push(value9);
      }
    }
  }
  return result;
};
var observer = function(mutations) {
  const { length } = mutations;
  let index = 0;
  for (;index < length; index += 1) {
    const mutation = mutations[index];
    if (mutation.type === "attributes" && mutation.target instanceof Element) {
      update(mutation.target, mutation.oldValue ?? "");
    }
  }
};
function petal(name, bud) {
  if (buds.has(name)) {
    throw new Error(`Petal '${name}' already exists`);
  }
  buds.set(name, bud);
}
var update = function(element, from) {
  const attributes = getAttributes(from, element.getAttribute(attribute2) ?? "");
  let elementControllers = petals.get(element);
  if (elementControllers === undefined) {
    elementControllers = new Set;
    petals.set(element, elementControllers);
  }
  let { length } = attributes[0];
  let index = 0;
  for (;index < length; index += 1) {
    const name = attributes[0][index];
    const bud = buds.get(name);
    const existing = Array.from(elementControllers).find((value9) => value9.constructor === bud);
    if (existing !== undefined) {
      existing.disconnected();
      elementControllers.delete(existing);
    }
  }
  length = attributes[1].length;
  index = 0;
  for (;index < length; index += 1) {
    const name = attributes[1][index];
    const bud = buds.get(name);
    const none = Array.from(elementControllers).findIndex((value9) => value9.constructor === bud) === -1;
    if (bud !== undefined && none) {
      const petal2 = new bud(element);
      petal2.connected();
      elementControllers.add(petal2);
    }
  }
};

class Petal {
  element;
  constructor(element) {
    this.element = element;
  }
  connected() {
  }
  disconnected() {
  }
}
var attribute2 = "data-petal";
var buds = new Map;
var petals = new Map;
var options = {
  attributeFilter: [attribute2],
  attributeOldValue: true,
  attributes: true,
  childList: true,
  subtree: true
};
new MutationObserver(observer).observe(document, options);
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(`[${attribute2}]`);
  const { length } = elements;
  let index = 0;
  for (;index < length; index += 1) {
    update(elements[index], "");
  }
});
export {
  petal,
  bloom,
  Petal
};
