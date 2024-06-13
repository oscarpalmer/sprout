// src/bloom/helpers/is.helper.ts
function isBadAttribute(attribute) {
  const { name, value } = attribute;
  return /^on/i.test(name) || /^(href|src|xlink:href)$/i.test(name) && /(data:text\/html|javascript:)/i.test(value);
}
function isBloom(value) {
  return value?.$bloom === true;
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
if (globalThis._atomic_queued == null) {
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
          reactive.callbacks.any.delete(state);
          for (const [key, keyed] of reactive.callbacks.values) {
            keyed.delete(state);
            if (keyed.size === 0) {
              reactive.callbacks.keys.delete(key);
            }
          }
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
var isArray = function(value) {
  return isSentinel(value, /^array$/i);
};
var isEffect = function(value) {
  return isSentinel(value, /^effect$/i);
};
var isReactive = function(value) {
  return isSentinel(value, /^array|computed|signal|store$/i);
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

// node_modules/@oscarpalmer/atoms/dist/js/string.mjs
var camelCase = function(value10) {
  return toCase(value10, "", true, false);
};
var capitalise = function(value10) {
  if (value10.length === 0) {
    return value10;
  }
  return value10.length === 1 ? value10.toLocaleUpperCase() : `${value10.charAt(0).toLocaleUpperCase()}${value10.slice(1).toLocaleLowerCase()}`;
};
var words = function(value10) {
  return value10.match(/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g) ?? [];
};
var toCase = function(value10, delimiter, capitaliseAny, capitaliseFirst) {
  return words(value10).map((word, index) => {
    const parts = word.replace(/(\p{Lu}*)(\p{Lu})(\p{Ll}+)/gu, (full, one, two, three) => three === "s" ? full : `${one}-${two}${three}`).replace(/(\p{Ll})(\p{Lu})/gu, "$1-$2").split("-");
    return parts.filter((part) => part.length > 0).map((part, partIndex) => !capitaliseAny || partIndex === 0 && index === 0 && !capitaliseFirst ? part.toLocaleLowerCase() : capitalise(part)).join(delimiter);
  }).join(delimiter);
};

// node_modules/@oscarpalmer/sentinel/dist/reactive/index.mjs
var primitives = new Set(["boolean", "number", "string"]);

// src/bloom/store.ts
function disableStoredNode(node, remove) {
  updateStoredNode("disable", node, remove ?? false);
  if (remove) {
    node.parentNode?.removeChild(node);
  }
}
function storeNode(node, data) {
  let stored = store3.get(node);
  if (stored == null) {
    stored = {
      effects: new Set,
      events: new Map
    };
    store3.set(node, stored);
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
var updateStoredNode = function(type, node, clear) {
  const stored = store3.get(node);
  if (stored != null) {
    const name = type === "disable" ? "stop" : "start";
    for (const effect5 of stored.effects) {
      effect5[name]();
    }
    const callback = type === "disable" ? node.removeEventListener : node.addEventListener;
    for (const [name2, listeners] of stored.events) {
      for (const [listener, data] of listeners) {
        callback(name2, listener, data.options);
      }
    }
    if (clear) {
      stored.effects.clear();
      stored.events.clear();
      store3.delete(node);
    }
  }
  updateStoredNodes(type, node, clear);
};
var updateStoredNodes = function(type, node, clear) {
  if (node.hasChildNodes()) {
    const children = [...node.childNodes];
    const { length } = children;
    let index = 0;
    for (;index < length; index += 1) {
      updateStoredNode(type, children[index], clear);
    }
  }
};
var store3 = new WeakMap;

// src/bloom/helpers/event.helper.ts
function addEvent(element, attribute, value10) {
  element.removeAttribute(attribute);
  if (typeof value10 === "function") {
    const parameters = getParameters(attribute);
    element.addEventListener(parameters.name, value10, parameters.options);
    storeNode(element, {
      event: { element, listener: value10, ...parameters }
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

// src/bloom/attribute/boolean.attribute.ts
function setBooleanAttribute(element, name, value10) {
  element[name] = /^(|true)$/i.test(String(value10));
}
function setSelectedAttribute(element) {
  const select = element.closest("select");
  return (element2, name, value10) => {
    setBooleanAttribute(element2, name, value10);
    if (select != null && [...select.options].includes(element2)) {
      updateSelect(select);
    }
  };
}
var updateSelect = function(select) {
  cancelAnimationFrame(frames.get(select));
  frames.set(select, requestAnimationFrame(() => {
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }));
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
var frames = new WeakMap;

// src/bloom/attribute/any.attribute.ts
function setAnyAttribute(element, name, value10) {
  const isBoolean = booleanAttributes.has(name) && name in element;
  const isValue = name === "value" && name in element;
  const callback = isBoolean ? name === "selected" ? setSelectedAttribute : setBooleanAttribute : setAttribute;
  if (isReactive(value10)) {
    return effect(() => callback(element, name, value10.get(), isValue));
  }
  callback(element, name, value10, isValue);
}
var setAttribute = function(element, name, value10, isValue) {
  switch (true) {
    case isValue:
      element.value = String(value10);
      break;
    case value10 == null:
      element.removeAttribute(name);
      break;
    default:
      element.setAttribute(name, String(value10));
  }
};

// src/bloom/attribute/class.attribute.ts
function setClasses(element, name, value10) {
  const classes = name.split(".").slice(1).filter((name2) => name2.length > 0).filter((name2, index, array4) => array4.indexOf(name2) === index);
  if (classes.length === 0) {
    return;
  }
  if (isReactive(value10)) {
    return effect(() => updateClassList(element, classes, value10.get()));
  }
  updateClassList(element, classes, value10);
}
var updateClassList = function(element, classes, value10) {
  element.classList[value10 === true ? "add" : "remove"](...classes);
};

// src/bloom/attribute/data.attribute.ts
function setDataAttribute(element, name, value10) {
  const kebabCased = name.split("-").slice(1).join("-");
  const camelCased = camelCase(kebabCased);
  if (isReactive(value10)) {
    return effect(() => setValue2(element, camelCased, value10.get()));
  }
  setValue2(element, camelCased, value10);
}
var setValue2 = function(element, key, value10) {
  element.dataset[key] = JSON.stringify(value10);
};

// src/bloom/attribute/style.attribute.ts
function setStyle(element, name, value10) {
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
}
var updateStyleProperty = function(element, property, suffix, value10) {
  if (value10 == null || value10 === false || value10 === true && suffix == null) {
    element.style.removeProperty(property);
  } else {
    element.style.setProperty(property, value10 === true ? String(suffix) : `${value10}${suffix ?? ""}`);
  }
};

// src/bloom/attribute/index.ts
var getAttributeCallback = function(name, allowAny) {
  switch (true) {
    case /^class\.\w/.test(name):
      return setClasses;
    case /^data-\w/.test(name):
      return setDataAttribute;
    case /^style\.\w/.test(name):
      return setStyle;
    case allowAny:
    case booleanAttributes.has(name):
      return setAnyAttribute;
    default:
      break;
  }
};
var getIndex = function(value10) {
  const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value10) ?? [];
  return index == null ? -1 : +index;
};
function mapAttributes(values, element) {
  const attributes = [...element.attributes];
  const { length } = attributes;
  let index = 0;
  for (;index < length; index += 1) {
    const attribute = attributes[index];
    const value10 = values[getIndex(attribute.value)];
    const badAttribute = isBadAttribute(attribute);
    switch (true) {
      case badAttribute:
        element.removeAttribute(attribute.name);
        continue;
      case attribute.name.startsWith("@"):
        addEvent(element, attribute.name, value10);
        continue;
      case (element instanceof HTMLElement || element instanceof SVGElement):
        setAttribute2(element, attribute, value10);
        continue;
      default:
        continue;
    }
  }
}
var setAttribute2 = function(element, attribute, value10) {
  const isFunction = typeof value10 === "function";
  const callback = getAttributeCallback(attribute.name, isFunction);
  if (callback != null) {
    element.removeAttribute(attribute.name);
  }
  const fx = callback?.(element, attribute.name, isFunction ? value10() : attribute.value);
  if (isEffect(fx)) {
    storeNode(element, { effect: fx });
  }
};

// src/bloom/helpers/index.ts
function compareArrayOrder(first, second) {
  const firstIsLarger = first.length > second.length;
  const from = firstIsLarger ? first : second;
  const to = firstIsLarger ? second : first;
  if (!from.filter((key) => to.includes(key)).every((key, index) => to[index] === key)) {
    return "dissimilar";
  }
  return firstIsLarger ? "removed" : "added";
}

// src/bloom/node/identified.ts
function createIdentified(template) {
  return {
    identifier: template.id,
    nodes: createIdentifieds(template.grow()).flatMap((item) => item.nodes)
  };
}
function createIdentifieds(value10) {
  return (Array.isArray(value10) ? value10 : [value10]).map((item) => ({
    nodes: getNodes(item)
  }));
}
function replaceIdentified(from, to, setNodes) {
  const nodes = from.flatMap((item) => item.nodes);
  for (const node of nodes) {
    if (nodes.indexOf(node) === 0) {
      node.before(...to.flatMap((item) => item.nodes));
    }
    disableStoredNode(node, true);
  }
  return setNodes ? to : null;
}
function updateIdentified(identified, identifiers, templates) {
  const observed = [];
  for (const template of templates) {
    observed.push(identified.find((item) => item.identifier === template.id) ?? createIdentified(template));
  }
  const oldIdentifiers = identified.map((item) => item.identifier);
  const comparison = compareArrayOrder(oldIdentifiers, identifiers);
  let position = identified[0].nodes[0];
  if (comparison !== "removed") {
    const items = observed.flatMap((item) => item.nodes.map((node) => ({
      id: item.identifier,
      value: node
    })));
    const before = comparison === "added" && !oldIdentifiers.includes(observed[0].identifier);
    for (const item of items) {
      if (comparison === "dissimilar" || !oldIdentifiers.includes(item.id)) {
        if (items.indexOf(item) === 0 && before) {
          position.before(item.value);
        } else {
          position.after(item.value);
        }
      }
      position = item.value;
    }
  }
  const nodes = identified.filter((item) => !identifiers.includes(item.identifier)).flatMap((item) => item.nodes);
  for (const node of nodes) {
    disableStoredNode(node, true);
  }
  return observed;
}

// src/bloom/node/value.ts
var setFunctionValue = function(comment, callback) {
  const value10 = callback();
  (isReactive(value10) ? setReactiveValue : setNodeValue)(comment, value10);
};
var setNodeValue = function(comment, value10) {
  comment.replaceWith(...getNodes(createNode(value10)));
};
var setReactiveList = function(comment, reactive3) {
  let identified2;
  effect(() => {
    const list = reactive3.get();
    if (list.length === 0) {
      identified2 = replaceIdentified(identified2 ?? [], [{ nodes: [comment] }], false);
      return;
    }
    let templates = list.filter((item) => isBloom(item) && item.id != null);
    const identifiers = templates.map((item) => item.id);
    if (new Set(identifiers).size !== identifiers.length) {
      templates = [];
    }
    identified2 = identified2 == null || templates.length === 0 ? replaceIdentified(identified2 ?? [{ nodes: [comment] }], templates.length > 0 ? templates.map((template) => createIdentified(template)) : createIdentifieds(list.map(createNode)), true) : updateIdentified(identified2, identifiers, templates);
  });
};
var setReactiveText = function(comment, reactive3) {
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
var setReactiveValue = function(comment, reactive3) {
  if (isArray(reactive3) || Array.isArray(reactive3.peek())) {
    setReactiveList(comment, reactive3);
  } else {
    setReactiveText(comment, reactive3);
  }
};
function setValue3(values, comment) {
  const value10 = values[getIndex2(comment.nodeValue ?? "")];
  if (typeof value10 === "function") {
    setFunctionValue(comment, value10);
  } else if (value10 != null) {
    setNodeValue(comment, value10);
  }
}

// src/bloom/node/index.ts
function createFragment(nodes) {
  const fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
}
function createNode(value11) {
  if (value11 instanceof Node) {
    return value11;
  }
  return isBloom(value11) ? value11.grow() : document.createTextNode(String(value11));
}
function createNodes(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const cloned = template.content.cloneNode(true);
  const scripts = [
    ...cloned instanceof Element ? cloned.querySelectorAll("script") : []
  ];
  for (const script of scripts) {
    script.remove();
  }
  cloned.normalize();
  return cloned;
}
function getIndex2(value11) {
  const [, index] = /^bloom\.(\d+)$/.exec(value11) ?? [];
  return index == null ? -1 : +index;
}
function getNodes(node) {
  return /^documentfragment$/i.test(node.constructor.name) ? [...node.childNodes] : [node];
}
function mapNodes(values, node) {
  const children = [...node.childNodes];
  const { length } = children;
  let index = 0;
  for (;index < length; index += 1) {
    const child = children[index];
    if (child.nodeType === 8) {
      setValue3(values, child);
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

// src/bloom/index.ts
function bloom(strings, ...expressions) {
  const data2 = {
    expressions,
    strings,
    html: "",
    nodes: [],
    values: []
  };
  const instance = Object.create({
    grow() {
      this.wither();
      const html2 = getHtml(data2);
      const nodes = createNodes(html2);
      data2.nodes.push(...mapNodes(data2.values, nodes).childNodes);
      return createFragment(data2.nodes);
    },
    identify(identifier) {
      data2.identifier ??= identifier;
      return instance;
    },
    wither() {
      const nodes = data2.nodes.splice(0);
      for (const node2 of nodes) {
        disableStoredNode(node2, true);
      }
      return this;
    }
  });
  Object.defineProperties(instance, {
    $bloom: {
      get() {
        return true;
      }
    },
    id: {
      get() {
        return data2.identifier;
      }
    }
  });
  return instance;
}
export {
  bloom
};
