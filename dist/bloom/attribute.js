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
var isEffect = function(value) {
  return isInstance(/^effect$/i, value);
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

// src/bloom/store.ts
function storeNode(node2, data) {
  let stored = store.get(node2);
  if (stored == null) {
    stored = {
      effects: new Set,
      events: new Map
    };
    store.set(node2, stored);
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

// src/bloom/node.ts
function isStylableElement(element) {
  return element instanceof HTMLElement || element instanceof SVGElement;
}

// src/bloom/event.ts
function addEvent(element, attribute2, value) {
  element.removeAttribute(attribute2);
  if (typeof value !== "function") {
    return;
  }
  const parameters = getParameters(attribute2);
  element.addEventListener(parameters.name, value, parameters.options);
  storeNode(element, {
    event: { element, listener: value, ...parameters }
  });
}
var getParameters = function(attribute2) {
  const parts = attribute2.slice(1).toLowerCase().split(":");
  const name = parts.shift();
  const options = {
    capture: parts.includes("capture"),
    once: parts.includes("once"),
    passive: !parts.includes("active")
  };
  return { name, options };
};

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
var isBadAttribute = function(attribute2) {
  const { name, value } = attribute2;
  return /^on/i.test(name) || /^(href|src|xlink:href)$/i.test(name) && /(data:text\/html|javascript:)/i.test(value);
};
function mapAttributes(values, element) {
  const attributes = Array.from(element.attributes);
  const { length } = attributes;
  let index = 0;
  for (;index < length; index += 1) {
    const attribute2 = attributes[index];
    const value = values[getIndex(attribute2.value)];
    const badAttribute = isBadAttribute(attribute2);
    if (badAttribute) {
      element.removeAttribute(attribute2.name);
      continue;
    }
    if (attribute2.name.startsWith("@")) {
      addEvent(element, attribute2.name, value);
    } else {
      const isFunction = typeof value === "function";
      const fx = getSetter(attribute2.name, isFunction)?.(element, attribute2.name, isFunction ? value() : attribute2.value);
      if (isEffect(fx)) {
        storeNode(element, { effect: fx });
      }
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
export {
  mapAttributes
};
