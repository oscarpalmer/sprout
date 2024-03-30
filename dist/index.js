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
if (globalThis._sentinels === undefined) {
  const effects = [];
  Object.defineProperty(globalThis, "_sentinels", {
    get() {
      return effects;
    }
  });
}

// node_modules/@oscarpalmer/sentinel/dist/models.mjs
class Sentinel {
  get active() {
    return this.state.active;
  }
  constructor(active) {
    this.state = { active };
  }
}

// node_modules/@oscarpalmer/sentinel/dist/effect.mjs
var effect = function(callback) {
  return new Effect(callback);
};

class Effect extends Sentinel {
  constructor(callback) {
    super(false);
    this.state.callback = callback;
    this.state.values = new Set;
    this.start();
  }
  start() {
    if (this.active) {
      return;
    }
    this.state.active = true;
    const index = globalThis._sentinels.push(this) - 1;
    this.state.callback();
    globalThis._sentinels.splice(index, 1);
  }
  stop() {
    if (!this.active) {
      return;
    }
    this.state.active = false;
    for (const value of this.state.values) {
      value.state.effects.delete(this);
    }
    this.state.values.clear();
  }
}

// node_modules/@oscarpalmer/sentinel/dist/helpers/is.mjs
var isEffect = function(value) {
  return isInstance(value, /^effect$/i);
};
var isReactive = function(value) {
  return isInstance(value, /^computed|list|signal|store$/i);
};
var isInstance = function(value, expression) {
  return expression.test(value?.constructor?.name ?? "");
};

// node_modules/@oscarpalmer/sentinel/dist/helpers/value.mjs
var operations = new Set([
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

// src/bloom/store.ts
function storeNode(node, data) {
  let stored = store4.get(node);
  if (stored == null) {
    stored = {
      effects: new Set,
      events: new Map
    };
    store4.set(node, stored);
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
var store4 = new WeakMap;

// src/bloom/event.ts
function addEvent(element, attribute, value10) {
  element.removeAttribute(attribute);
  if (typeof value10 !== "function") {
    return;
  }
  const parameters = getParameters(attribute);
  element.addEventListener(parameters.name, value10, parameters.options);
  storeNode(element, {
    event: { element, listener: value10, ...parameters }
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
var getIndex = function(value10) {
  const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value10) ?? [];
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
  const { name, value: value10 } = attribute;
  return /^on/i.test(name) || /^(href|src|xlink:href)$/i.test(name) && /(data:text\/html|javascript:)/i.test(value10);
};
function mapAttributes(values, element) {
  const attributes = Array.from(element.attributes);
  const { length } = attributes;
  let index = 0;
  for (;index < length; index += 1) {
    const attribute = attributes[index];
    const value10 = values[getIndex(attribute.value)];
    const badAttribute = isBadAttribute(attribute);
    if (badAttribute) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if (attribute.name.startsWith("@")) {
      addEvent(element, attribute.name, value10);
    } else {
      const isFunction = typeof value10 === "function";
      const fx = getSetter(attribute.name, isFunction)?.(element, attribute.name, isFunction ? value10() : attribute.value);
      if (isEffect(fx)) {
        storeNode(element, { effect: fx });
      }
    }
  }
}
var setAny = function(element, name, value10) {
  if (isReactive(value10)) {
    return effect(() => setAnyAttribute(element, name, value10.get()));
  }
  setAnyAttribute(element, name, value10);
};
var setAnyAttribute = function(element, name, value10) {
  if (value10 == null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, String(value10));
  }
};
var setBoolean = function(element, name, value10) {
  if (isReactive(value10)) {
    return effect(() => setBooleanAttribute(element, name, value10.get()));
  }
  setBooleanAttribute(element, name, value10);
};
var setBooleanAttribute = function(element, name, value10) {
  if (/^(|true)$/i.test(String(value10))) {
    element.setAttribute(name, "");
  } else {
    element.removeAttribute(name);
  }
};
var setClasses = function(element, name, value10) {
  const classes = name.split(".").slice(1).filter((name2) => name2.length > 0);
  if (classes.length === 0) {
    return;
  }
  if (isReactive(value10)) {
    return effect(() => updateClassList(element, classes, value10.get()));
  }
  updateClassList(element, classes, value10);
};
var setStyle = function(element, name, value10) {
  if (!isStylableElement(element)) {
    return;
  }
  const [, first, second] = name.split(".");
  const property = first.trim();
  const suffix = second?.trim();
  if (property.length === 0 || suffix != null && suffix.length === 0) {
    return;
  }
  if (isReactive(value10)) {
    return effect(() => updateStyleProperty(element, property, suffix, value10.get()));
  }
  updateStyleProperty(element, property, suffix, value10);
};
var updateClassList = function(element, classes, value10) {
  if (value10 === true) {
    element.classList.add(...classes);
  } else {
    element.classList.remove(...classes);
  }
};
var updateStyleProperty = function(element, property, suffix, value10) {
  if (value10 == null || value10 === false || value10 === true && suffix == null) {
    element.style.removeProperty(property);
  } else {
    element.style.setProperty(property, value10 === true ? String(suffix) : `${value10}${suffix ?? ""}`);
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
function createNode(value10) {
  if (value10 instanceof Node) {
    return value10;
  }
  if (isBloom(value10)) {
    return value10.grow();
  }
  return document.createTextNode(String(value10));
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
var getIndex2 = function(value10) {
  const [, index] = /^bloom\.(\d+)$/.exec(value10) ?? [];
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
  const value10 = callback();
  if (isReactive(value10)) {
    setReactive(comment, value10);
  } else {
    setNode(comment, value10);
  }
};
var setNode = function(comment, value10) {
  const node2 = createNode(value10);
  comment.replaceWith(.../^documentfragment$/i.test(node2.constructor.name) ? Array.from(node2.childNodes) : [node2]);
};
var setReactive = function(comment, reactive3) {
  const text = document.createTextNode("");
  const fx = effect(() => {
    const value10 = reactive3.get();
    text.textContent = String(value10);
    if (value10 == null && text.parentNode != null) {
      text.replaceWith(comment);
    } else if (value10 != null && text.parentNode == null) {
      comment.replaceWith(text);
    }
  });
  storeNode(comment, { effect: fx });
  storeNode(text, { effect: fx });
};
var setValue2 = function(values, comment) {
  const value10 = values[getIndex2(comment.nodeValue ?? "")];
  if (value10 == null) {
    return;
  }
  if (typeof value10 === "function") {
    setFunction(comment, value10);
  } else {
    setNode(comment, value10);
  }
};

// src/bloom/index.ts
function bloom2(strings, ...expressions) {
  return new Bloom(strings, ...expressions);
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
function isBloom(value10) {
  return value10 instanceof Bloom;
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
      const value10 = values[inner];
      if (!other.includes(value10)) {
        result[outer].push(value10);
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
    const existing = Array.from(elementControllers).find((value10) => value10.constructor === bud);
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
    const none = Array.from(elementControllers).findIndex((value10) => value10.constructor === bud) === -1;
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
  isBloom,
  bloom2 as bloom,
  Petal
};
