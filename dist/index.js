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
  if (typeof value9 === "function") {
    const parameters = getParameters(attribute);
    element.addEventListener(parameters.name, value9, parameters.options);
    storeNode(element, {
      event: { element, listener: value9, ...parameters }
    });
  }
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
  switch (true) {
    case isValue:
      element.value = String(value9);
      break;
    case value9 == null:
      element.removeAttribute(name);
      break;
    default:
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
  element.classList[value9 === true ? "add" : "remove"](...classes);
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
  return isBloom(value9) ? value9.grow() : document.createTextNode(String(value9));
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
  (isReactive(value9) ? setReactive : setNode)(comment, value9);
};
var setNode = function(comment, value9) {
  const node = createNode(value9);
  comment.replaceWith(.../^documentfragment$/i.test(node.constructor.name) ? [...node.childNodes] : [node]);
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
  if (typeof value9 === "function") {
    setFunction(comment, value9);
  } else if (value9 != null) {
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
// src/petal/controller/controller.ts
var attribute2 = "data-petal";

class Controller {
  context;
  get element() {
    return this.context.element;
  }
  get data() {
    return this.context.data.value;
  }
  get identifier() {
    return this.context.identifier;
  }
  constructor(context) {
    this.context = context;
  }
}

// src/petal/observer/attributes/data.attribute.ts
function handleDataAttribute(context, name, value9) {
  let data;
  try {
    data = JSON.parse(value9);
  } catch (_) {
    data = value9;
  }
  context.data.value[name] = data;
}

// src/petal/observer/observer.ts
function createObserver(element, options, attributeHandler) {
  let frame;
  const observer = new MutationObserver((entries) => {
    for (const entry of entries) {
      if (entry.type === "childList") {
        instance.handleNodes(entry.addedNodes, true);
        instance.handleNodes(entry.removedNodes, false);
      } else if (entry.type === "attributes" && entry.target instanceof Element) {
        attributeHandler(entry.target, entry.attributeName ?? "", entry.oldValue ?? "", true);
      }
    }
  });
  const instance = Object.create({
    handleElement(element2, added) {
      const attributes = Array.from(element2.attributes);
      for (const attribute3 of attributes) {
        attributeHandler(element2, attribute3.name, "", added);
      }
    },
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
  if (element.ownerDocument.readyState === "complete") {
    instance.start();
  } else {
    element.ownerDocument.addEventListener("DOMContentLoaded", () => {
      instance.start();
    });
  }
  return instance;
}
var options = {
  attributeOldValue: true,
  attributes: true,
  childList: true,
  subtree: true
};

// src/petal/observer/controller.observer.ts
function observeController(context) {
  const prefix = `data-${context.identifier}-`;
  const { length } = prefix;
  return createObserver(context.element, {
    ...options
  }, (element, name) => {
    if (name.startsWith(prefix)) {
      handleDataAttribute(context, name.slice(length), element.getAttribute(name) ?? "");
    }
  });
}

// src/petal/store/action.store.ts
function createActions() {
  const store5 = new Map;
  return Object.create({
    add(name, element) {
      const action = store5.get(name);
      if (action != null) {
        action.targets.add(element);
        element.addEventListener(action.type, action.callback, action.options);
      }
    },
    clear() {
      for (const [, action] of store5) {
        for (const target of action.targets) {
          target.removeEventListener(action.type, action.callback, action.options);
        }
        action.targets.clear();
      }
      store5.clear();
    },
    create(parameters) {
      if (!store5.has(parameters.name)) {
        store5.set(parameters.name, {
          callback: parameters.callback,
          options: parameters.options,
          targets: new Set,
          type: parameters.type
        });
      }
    },
    has(name) {
      return store5.has(name);
    },
    remove(name, element) {
      const action = store5.get(name);
      if (action != null) {
        element.removeEventListener(action.type, action.callback);
        action.targets.delete(element);
        if (action.targets.size === 0) {
          store5.delete(name);
        }
      }
    }
  });
}

// node_modules/@oscarpalmer/atoms/dist/js/string.mjs
var getString2 = function(value9) {
  if (typeof value9 === "string") {
    return value9;
  }
  if (typeof value9 !== "object" || value9 == null) {
    return String(value9);
  }
  const valueOff = value9.valueOf?.() ?? value9;
  const asString = valueOff?.toString?.() ?? String(valueOff);
  return asString.startsWith("[object ") ? JSON.stringify(value9) : asString;
};

// node_modules/@oscarpalmer/atoms/dist/js/is.mjs
var isNullableOrWhitespace = function(value9) {
  return value9 == null || /^\s*$/.test(getString2(value9));
};

// src/petal/store/data.store.ts
var setValue3 = function(context, prefix, name, original, stringified) {
  const { element } = context;
  if (isNullableOrWhitespace(original)) {
    element.removeAttribute(`${prefix}${name}`);
  } else {
    element.setAttribute(`${prefix}${name}`, stringified);
  }
  const inputs = context.targets.get(`input:${name}`);
  for (const input of inputs) {
    if ((input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) && input.value !== stringified) {
      input.value = stringified;
    }
  }
  const outputs = context.targets.get(`output:${name}`);
  for (const output of outputs) {
    output.textContent = stringified;
  }
};
function createData(identifier, context) {
  const frames = {};
  const prefix = `data-${identifier}-`;
  const instance = Object.create(null);
  Object.defineProperty(instance, "value", {
    value: new Proxy({}, {
      set(target, property, value9) {
        const previous = getString2(Reflect.get(target, property));
        const next = getString2(value9);
        if (Object.is(previous, next)) {
          return true;
        }
        const result = Reflect.set(target, property, value9);
        if (result) {
          const name = String(property);
          cancelAnimationFrame(frames[name]);
          frames[name] = requestAnimationFrame(() => {
            setValue3(context, prefix, name, value9, next);
          });
        }
        return result;
      }
    })
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

// src/petal/controller/context.ts
function createContext(name, element, ctor) {
  const context = Object.create(null);
  Object.defineProperties(context, {
    actions: {
      value: createActions()
    },
    data: {
      value: createData(name, context)
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
      value: observeController(context)
    }
  });
  handleAttributes(context);
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
  const instance = stored?.instances.get(element);
  if (instance != null) {
    stored?.instances.delete(element);
    instance.actions.clear();
    instance.observer.stop();
    instance.targets.clear();
    instance.controller.disconnected?.();
  }
}
var controllers = new Map;

// src/petal/helpers/event.ts
function getEventParameters(element, action2) {
  const matches = action2.match(pattern);
  if (matches != null) {
    const [, type, callback, options2] = matches;
    const parameters = {
      callback,
      options: getOptions(options2 ?? ""),
      type: type ?? getType(element)
    };
    return parameters.type == null ? undefined : parameters;
  }
}
var getOptions = function(options2) {
  const items = options2.toLowerCase().split(":");
  return {
    capture: items.includes("capture") || items.includes("c"),
    once: items.includes("once") || items.includes("o"),
    passive: !items.includes("active") && !items.includes("a")
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

// src/petal/observer/attributes/target.attribute.ts
function handleInputAttribute(element, _, value9, added) {
  handleTarget(element, value9, added, attributeTargetPattern, handleInput);
}
function handleOutputAttribute(element, _, value9, added) {
  handleTarget(element, value9, added, attributeTargetPattern, handleOutput);
}
function handleTarget(element, value9, added, pattern2, callback) {
  const [, identifier, controller3, name] = pattern2.exec(value9) ?? [];
  if (controller3 == null || name == null) {
    return;
  }
  let identified;
  if (identifier == null) {
    identified = element.closest(`[data-petal*="${controller3}"]`);
  } else {
    identified = document.querySelector(`#${identifier}`);
  }
  if (identified == null) {
    return;
  }
  const context2 = controllers.get(controller3)?.instances.get(identified);
  if (context2 != null) {
    callback(context2, element, "", name, added);
  }
}
function handleTargetAttribute(element, _, value9, added) {
  handleTarget(element, value9, added, attributeTargetPattern, handleTargetElement);
}
var handleInput = function(context2, element, _, value9, added) {
  if (context2 != null && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    const checkbox = element.getAttribute("type") === "checkbox";
    handleAction(context2, element, "", "input", added, (event5) => {
      context2.data.value[value9] = checkbox ? event5.target.checked : event5.target.value;
    });
    handleTargetElement(context2, element, "", `input:${value9}`, added);
  }
};
var handleOutput = function(context2, element, _, value9, added) {
  handleTargetElement(context2, element, "", `output:${value9}`, added);
};
var handleTargetElement = function(context2, element, _, value9, added) {
  if (added) {
    context2.targets.add(value9, element);
  } else {
    context2.targets.remove(value9, element);
  }
};

// src/petal/observer/attributes/action.attribute.ts
function handleAction(context2, element, _, value9, added, handler) {
  if (context2.actions.has(value9)) {
    if (added) {
      context2.actions.add(value9, element);
    } else {
      context2.actions.remove(value9, element);
    }
    return;
  }
  if (!added) {
    return;
  }
  const parameters = getEventParameters(element, value9);
  if (parameters == null) {
    return;
  }
  const callback = handler ?? context2.controller[parameters.callback];
  if (typeof callback === "function") {
    context2.actions.create({
      callback: callback.bind(context2.controller),
      name: value9,
      options: parameters.options,
      target: element,
      type: parameters.type
    });
    context2.actions.add(value9, element);
  }
}
function handleActionAttribute(element, _, value9, added) {
  handleTarget(element, value9, added, attributeActionPattern, handleAction);
}

// src/petal/observer/attributes/index.ts
var getChanges = function(from, to) {
  const fromValues = from.split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 0);
  const toValues = to.split(/\s+/).map((part) => part.trim()).filter((part) => part.length > 0);
  const attributes2 = [[], []];
  for (let outer = 0;outer < 2; outer += 1) {
    const values = outer === 0 ? fromValues : toValues;
    const other = outer === 1 ? fromValues : toValues;
    const { length } = values;
    for (let inner = 0;inner < length; inner += 1) {
      const value9 = values[inner];
      if (!other.includes(value9)) {
        attributes2[outer].push(value9);
      }
    }
  }
  return attributes2;
};
function handleAttributeChanges(parameters) {
  const callback = parameters.callbacks[parameters.name];
  if (callback == null) {
    return;
  }
  let from = parameters.value;
  let to = parameters.element.getAttribute(parameters.name) ?? "";
  if (from === to) {
    return;
  }
  if (!parameters.added) {
    [from, to] = [to, from];
  }
  handleChanges({
    callback,
    from,
    to,
    element: parameters.element,
    name: parameters.name
  });
}
var handleChanges = function(parameters) {
  const changes = getChanges(parameters.from, parameters.to);
  for (const changed of changes) {
    const added = changes.indexOf(changed) === 1;
    for (const change of changed) {
      parameters.callback(parameters.element, parameters.name, change, added);
    }
  }
};
function handleControllerAttribute(element, _, value9, added) {
  if (added) {
    addController(value9, element);
  } else {
    removeController(value9, element);
  }
}
function handleAttributes(context2) {
  const attributes2 = ["action", "input", "output", "target"];
  const callbacks = [
    handleActionAttribute,
    handleInputAttribute,
    handleOutputAttribute,
    handleTargetAttribute
  ];
  const values = [`->${context2.identifier}@`, `->${context2.identifier}.`];
  for (const attribute3 of attributes2) {
    const index = attributes2.indexOf(attribute3);
    const callback = callbacks[index];
    const value9 = index === 0 ? values[0] : values[1];
    const targets = document.querySelectorAll(`[data-${attribute3}*="${value9}"]`);
    if (targets.length === 0) {
      continue;
    }
    for (const target4 of targets) {
      const attributes3 = Array.from(target4.attributes);
      for (const attribute4 of attributes3) {
        if (attribute4.value.includes(value9)) {
          callback(target4, "", attribute4.value, true);
        }
      }
    }
  }
}
var attributeActionPattern = /^(?:(\w+)->)?(\w+)@(\w+)$/;
var attributeTargetPattern = /^(?:(\w+)->)?(\w+)?\.(\w+)$/;

// src/petal/observer/document.observer.ts
function observeDocument() {
  const actionAttribute = "data-action";
  const inputAttribute = "data-input";
  const outputAttribute = "data-output";
  const targetAttribute = "data-target";
  const attributes3 = [
    actionAttribute,
    attribute2,
    inputAttribute,
    outputAttribute,
    targetAttribute
  ];
  const callbacks = {
    [actionAttribute]: handleActionAttribute,
    [attribute2]: handleControllerAttribute,
    [inputAttribute]: handleInputAttribute,
    [outputAttribute]: handleOutputAttribute,
    [targetAttribute]: handleTargetAttribute
  };
  return createObserver(document.body, {
    ...options,
    attributeFilter: attributes3
  }, (element, name, value9, added) => {
    handleAttributeChanges({
      added,
      callbacks,
      element,
      name,
      value: value9
    });
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
