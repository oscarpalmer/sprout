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

// src/bloom/attribute.ts
var getIndex = function(value) {
  const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value) ?? [];
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
  const { name, value } = attribute;
  return /^on/i.test(name) || /^(href|src|xlink:href)$/i.test(name) && /(data:text\/html|javascript:)/i.test(value);
};
function mapAttributes(values, element) {
  const attributes = Array.from(element.attributes);
  const { length } = attributes;
  let index = 0;
  for (;index < length; index += 1) {
    const attribute = attributes[index];
    const value = values[getIndex(attribute.value)];
    const badAttribute = isBadAttribute(attribute);
    if (badAttribute) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if (attribute.name.startsWith("@")) {
    } else {
      const isFunction = typeof value === "function";
      getSetter(attribute.name, isFunction)?.(element, attribute.name, isFunction ? value() : attribute.value);
    }
  }
}
var setAny = function(element, name, value) {
  if (isReactive(value)) {
    return effect(() => setAnyAttribute(element, name, value.value));
  }
  setAnyAttribute(element, name, value);
};
var setAnyAttribute = function(element, name, value) {
  if (value == null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, String(value));
  }
};
var setBoolean = function(element, name, value) {
  if (isReactive(value)) {
    return effect(() => setBooleanAttribute(element, name, value.value));
  }
  setBooleanAttribute(element, name, value);
};
var setBooleanAttribute = function(element, name, value) {
  if (/^(|true)$/i.test(String(value))) {
    element.setAttribute(name, "");
  } else {
    element.removeAttribute(name);
  }
};
var setClasses = function(element, name, value) {
  const classes = name.split(".").slice(1).filter((name2) => name2.length > 0);
  if (classes.length === 0) {
    return;
  }
  if (isReactive(value)) {
    return effect(() => updateClassList(element, classes, value.value));
  }
  updateClassList(element, classes, value);
};
var setStyle = function(element, name, value) {
  if (!isStylableElement(element)) {
    return;
  }
  const [, first, second] = name.split(".");
  const property = first.trim();
  const suffix = second?.trim();
  if (property.length === 0 || suffix != null && suffix.length === 0) {
    return;
  }
  if (isReactive(value)) {
    return effect(() => updateStyleProperty(element, property, suffix, value.value));
  }
  updateStyleProperty(element, property, suffix, value);
};
var updateClassList = function(element, classes, value) {
  if (value === true) {
    element.classList.add(...classes);
  } else {
    element.classList.remove(...classes);
  }
};
var updateStyleProperty = function(element, property, suffix, value) {
  if (value == null || value === false || value === true && suffix == null) {
    element.style.removeProperty(property);
  } else {
    element.style.setProperty(property, value === true ? String(suffix) : `${value}${suffix ?? ""}`);
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
var getIndex2 = function(value) {
  const [, index] = /^bloom\.(\d+)$/.exec(value) ?? [];
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
      setValue(values, child);
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
  const value = values[getIndex2(comment.nodeValue ?? "")];
  if (value == null) {
    return;
  }
  if (typeof value === "function") {
    setFunction(comment, value);
  } else {
    setNode(comment, value);
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
      const value = values[inner];
      if (!other.includes(value)) {
        result[outer].push(value);
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
    const existing = Array.from(elementControllers).find((value) => value.constructor === bud);
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
    const none = Array.from(elementControllers).findIndex((value) => value.constructor === bud) === -1;
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
