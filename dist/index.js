// src/bloom/helpers/is.ts
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

// node_modules/@oscarpalmer/sentinel/node_modules/@oscarpalmer/atoms/dist/js/queue.mjs
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

// src/bloom/helpers/event.ts
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

// src/bloom/attribute/any.ts
function setAny(element, name, value9) {
  const isBoolean = booleanAttributes.has(name) && name in element;
  const isValue = name === "value" && name in element;
  const callback = isBoolean ? setBooleanAttribute : setAnyAttribute;
  if (isReactive(value9)) {
    return effect(() => callback(element, name, value9.get(), isValue));
  }
  callback(element, name, value9, isValue);
}
var setAnyAttribute = function(element, name, value9, isValue) {
  if (isValue) {
    element.value = String(value9);
    return;
  }
  if (value9 == null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, String(value9));
  }
};
var setBooleanAttribute = function(element, name, value9) {
  element[name] = /^(|true)$/i.test(String(value9));
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

// src/bloom/attribute/classes.ts
function setClasses(element, name, value9) {
  const classes = name.split(".").slice(1).filter((name2) => name2.length > 0);
  if (classes.length === 0) {
    return;
  }
  if (isReactive(value9)) {
    return effect(() => updateClassList(element, classes, value9.get()));
  }
  updateClassList(element, classes, value9);
}
var updateClassList = function(element, classes, value9) {
  if (value9 === true) {
    element.classList.add(...classes);
  } else {
    element.classList.remove(...classes);
  }
};

// src/bloom/attribute/style.ts
function setStyle(element, name, value9) {
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
}
var updateStyleProperty = function(element, property, suffix, value9) {
  if (value9 == null || value9 === false || value9 === true && suffix == null) {
    element.style.removeProperty(property);
  } else {
    element.style.setProperty(property, value9 === true ? String(suffix) : `${value9}${suffix ?? ""}`);
  }
};

// src/bloom/attribute/index.ts
var getAttributeEffect = function(name, allowAny) {
  switch (true) {
    case /^class\.\w/.test(name):
      return setClasses;
    case /^style\.\w/.test(name):
      return setStyle;
    case allowAny:
    case booleanAttributes.has(name):
      return setAny;
    default:
      break;
  }
};
var getIndex = function(value9) {
  const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value9) ?? [];
  return index == null ? -1 : +index;
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
      const fx = getAttributeEffect(attribute.name, isFunction)?.(element, attribute.name, isFunction ? value9() : attribute.value);
      if (isEffect(fx)) {
        storeNode(element, { effect: fx });
      }
    }
  }
}

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
// src/petal/controllers/controller.ts
var attribute2 = "data-petal";

class Controller {
  context;
  get element() {
    return this.context.element;
  }
  get identifier() {
    return this.context.identifier;
  }
  constructor(context) {
    this.context = context;
  }
}

// src/petal/helpers/event.ts
function getEventParameters(element, action) {
  const matches = action.match(pattern);
  if (matches == null) {
    return;
  }
  const [, type, callback, options] = matches;
  const parameters = {
    callback,
    options: getOptions(options ?? ""),
    type: type ?? getType(element)
  };
  if (parameters.type == null) {
    return;
  }
  return parameters;
}
var getOptions = function(options) {
  const items = options.toLowerCase().split(":");
  return {
    capture: items.includes("capture") || items.includes("c"),
    once: items.includes("once") || items.includes("o"),
    passive: items.includes("passive") || items.includes("p")
  };
};
var getType = function(element) {
  if (element instanceof HTMLInputElement) {
    return element.type === "submit" ? "submit" : "input";
  }
  return defaultEvents[element.tagName.toLowerCase()];
};
var defaultEvents = {
  a: "click",
  button: "click",
  details: "toggle",
  form: "submit",
  select: "change",
  textarea: "input"
};
var pattern = /^(?:(\w+)@)?(\w+)(?::([a-z:]+))?$/i;

// src/petal/observer/observer.ts
function getAttributes(from, to) {
  const fromValues = from.split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 0);
  const toValues = to.split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 0);
  const attributes = [[], []];
  for (let outer = 0;outer < 2; outer += 1) {
    const values = outer === 0 ? fromValues : toValues;
    const other = outer === 1 ? fromValues : toValues;
    const { length } = values;
    for (let inner = 0;inner < length; inner += 1) {
      const value9 = values[inner];
      if (!other.includes(value9)) {
        attributes[outer].push(value9);
      }
    }
  }
  return attributes;
}
function createObserver(element, options, handlers) {
  let frame;
  const observer = new MutationObserver((entries) => {
    for (const entry of entries) {
      if (entry.type === "childList") {
        instance.handleNodes(entry.addedNodes, true);
        instance.handleNodes(entry.removedNodes, false);
      } else if (entry.target instanceof Element) {
        instance.handleAttribute(entry.target, entry.attributeName ?? "", entry.oldValue ?? "", false);
      }
    }
  });
  const instance = Object.create({
    ...handlers,
    handleNodes(nodes, added) {
      for (const node2 of nodes) {
        if (node2 instanceof Element) {
          this.handleElement(node2, added);
          this.handleNodes(node2.childNodes, added);
        }
      }
    },
    start() {
      observer.observe(element, options);
      this.update();
    },
    stop() {
      observer.disconnect();
    },
    update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        this.handleNodes([element], true);
      });
    }
  });
  instance.start();
  return instance;
}
var options = {
  attributeOldValue: true,
  attributes: true,
  childList: true,
  subtree: true
};

// src/petal/observer/controller.observer.ts
var handleAction = function(context, element, action, added) {
  if (context.actions.has(action)) {
    if (added) {
      context.actions.add(action, element);
    } else {
      context.actions.remove(action, element);
    }
    return;
  }
  if (!added) {
    return;
  }
  const parameters = getEventParameters(element, action);
  if (parameters == null) {
    return;
  }
  const callback = context.controller[parameters.callback];
  if (typeof callback !== "function") {
    return;
  }
  context.actions.create({
    callback: callback.bind(context.controller),
    name: action,
    options: parameters.options,
    target: element,
    type: parameters.type
  });
  context.actions.add(action, element);
};
var handleChanges = function(context, element, oldValue, newValue, callback) {
  const attributes = getAttributes(oldValue, newValue);
  for (const names of attributes) {
    const added = attributes.indexOf(names) === 1;
    for (const name of names) {
      callback(context, element, name, added);
    }
  }
};
var handleTarget = function(context, element, target, added) {
  if (added) {
    context.targets.add(target, element);
  } else {
    context.targets.remove(target, element);
  }
};
function observeController(context, attributes) {
  const { action: actionAttribute, target: targetAttribute } = attributes;
  const attributeFilter = [actionAttribute, targetAttribute];
  const callbacks = {
    [actionAttribute]: handleAction,
    [targetAttribute]: handleTarget
  };
  return createObserver(context.element, {
    ...options,
    attributeFilter
  }, {
    handleAttribute(element, name, value9, removed) {
      let oldValue = value9;
      let newValue = element.getAttribute(name) ?? "";
      if (newValue === oldValue) {
        return;
      }
      if (removed) {
        oldValue = newValue;
        newValue = "";
      }
      handleChanges(context, element, oldValue, newValue, callbacks[name]);
    },
    handleElement(element, added) {
      const attributes2 = Array.from(element.attributes);
      const { length } = attributes2;
      let index = 0;
      for (;index < length; index += 1) {
        const attribute3 = attributes2[index].name;
        if (attributeFilter.includes(attribute3)) {
          this.handleAttribute(element, attribute3, "", !added);
        }
      }
    }
  });
}

// src/petal/store/action.store.ts
function createActions() {
  const actions = new Map;
  const instance = Object.create({
    add(name, element) {
      const action = actions.get(name);
      if (action == null) {
        return;
      }
      action.targets.add(element);
      element.addEventListener(action.type, action.callback, action.options);
    },
    clear() {
      for (const [, action] of actions) {
        for (const target of action.targets) {
          target.removeEventListener(action.type, action.callback, action.options);
        }
        action.targets.clear();
      }
      actions.clear();
    },
    create(parameters) {
      if (!actions.has(parameters.name)) {
        actions.set(parameters.name, {
          callback: parameters.callback,
          options: parameters.options,
          targets: new Set,
          type: parameters.type
        });
      }
    },
    has(name) {
      return actions.has(name);
    },
    remove(name, element) {
      const action = actions.get(name);
      if (action == null) {
        return;
      }
      element.removeEventListener(action.type, action.callback);
      action.targets.delete(element);
      if (action.targets.size === 0) {
        actions.delete(name);
      }
    }
  });
  return instance;
}

// src/petal/store/target.store.ts
function createTargets() {
  const store5 = new Map;
  const instance = Object.create({
    add(name, element) {
      let targets = store5.get(name);
      if (targets == null) {
        targets = new Set;
        store5.set(name, targets);
      }
      targets.add(element);
    },
    clear() {
      for (const [, targets] of store5) {
        targets.clear();
      }
      store5.clear();
    },
    get(name) {
      return Array.from(store5.get(name) ?? []);
    },
    remove(name, element) {
      store5.get(name)?.delete(element);
    }
  });
  return instance;
}

// src/petal/controllers/context.ts
function createContext(name, element, ctor) {
  const context = Object.create(null);
  Object.defineProperties(context, {
    actions: {
      value: createActions()
    },
    element: {
      value: element
    },
    identifier: {
      value: name
    },
    targets: {
      value: createTargets()
    }
  });
  const controller2 = new ctor(context);
  Object.defineProperties(context, {
    controller: {
      value: controller2
    },
    observer: {
      value: observeController(context, {
        action: `data-${name}-action`,
        target: `data-${name}-target`
      })
    }
  });
  controller2.connected?.();
  return context;
}

// src/petal/store/controller.store.ts
function addController(name, element) {
  const controller2 = controllers.get(name);
  if (controller2 != null && !controller2.instances.has(element)) {
    controller2.instances.set(element, createContext(name, element, controller2.constructor));
  }
}
function createController(name, ctor) {
  if (!controllers.has(name)) {
    controllers.set(name, {
      constructor: ctor,
      instances: new Map
    });
  }
}
function removeController(name, element) {
  const stored = controllers.get(name);
  if (stored == null) {
    return;
  }
  const instance = stored.instances.get(element);
  if (instance == null) {
    return;
  }
  stored.instances.delete(element);
  instance.actions.clear();
  instance.observer.stop();
  instance.targets.clear();
  instance.controller.disconnected?.();
}
var controllers = new Map;

// src/petal/observer/document.observer.ts
var handleChanges2 = function(element, newValue, oldValue) {
  const attributes = getAttributes(oldValue, newValue);
  for (const names of attributes) {
    const added = attributes.indexOf(names) === 1;
    for (const name of names) {
      if (added) {
        addController(name, element);
      } else {
        removeController(name, element);
      }
    }
  }
};
function observeDocument() {
  return createObserver(document.body, {
    ...options,
    attributeFilter: [attribute2]
  }, {
    handleAttribute(element, name, value9, removed) {
      let oldValue = value9;
      let newValue = element.getAttribute(name) ?? "";
      if (newValue === oldValue) {
        return;
      }
      if (removed) {
        oldValue = newValue;
        newValue = "";
      }
      handleChanges2(element, newValue, oldValue);
    },
    handleElement(element, added) {
      if (element.hasAttribute(attribute2)) {
        this.handleAttribute(element, attribute2, "", !added);
      }
    }
  });
}

// src/petal/index.ts
function petal(name, ctor) {
  if (controllers.has(name)) {
    throw new Error(`Petal '${name}' already exists`);
  }
  createController(name, ctor);
  documentObserver.update();
}
var documentObserver = observeDocument();
export {
  petal,
  bloom,
  Controller
};
