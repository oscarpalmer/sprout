// src/petal/controllers/controller.ts
var attribute = "data-petal";

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
      const value = values[inner];
      if (!other.includes(value)) {
        attributes[outer].push(value);
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
      } else if (entry.type === "attributes" && entry.target instanceof Element) {
        instance.handleAttribute(entry.target, entry.attributeName ?? "", entry.oldValue ?? "", false);
      }
    }
  });
  const instance = Object.create({
    ...handlers,
    handleNodes(nodes, added) {
      for (const node of nodes) {
        if (node instanceof Element) {
          this.handleElement(node, added);
          this.handleNodes(node.childNodes, added);
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
var handleData = function(context, name, value) {
  let data;
  try {
    data = JSON.parse(value);
  } catch (_) {
    data = value;
  }
  context.data.value[name] = data;
};
var handleTarget = function(context, element, target, added) {
  if (added) {
    context.targets.add(target, element);
  } else {
    context.targets.remove(target, element);
  }
};
function observeController(context, attributes) {
  const {
    action: actionAttribute,
    data: dataAttribute,
    target: targetAttribute
  } = attributes;
  const callbacks = {
    [actionAttribute]: handleAction,
    [targetAttribute]: handleTarget
  };
  const names = [actionAttribute, targetAttribute];
  return createObserver(context.element, {
    ...options
  }, {
    handleAttribute(element, name, value, removed) {
      let oldValue = value;
      let newValue = element.getAttribute(name) ?? "";
      if (newValue === oldValue) {
        return;
      }
      if (removed) {
        oldValue = newValue;
        newValue = "";
      }
      if (names.includes(name)) {
        handleChanges(context, element, oldValue, newValue, callbacks[name]);
      } else if (name.startsWith(dataAttribute)) {
        handleData(context, name.slice(dataAttribute.length), newValue);
      }
    },
    handleElement(element, added) {
      const attributes2 = Array.from(element.attributes);
      const { length } = attributes2;
      let index = 0;
      for (;index < length; index += 1) {
        this.handleAttribute(element, attributes2[index].name, "", !added);
      }
    }
  });
}

// src/petal/store/action.store.ts
function createActions() {
  const store = new Map;
  return Object.create({
    add(name, element) {
      const action = store.get(name);
      if (action == null) {
        return;
      }
      action.targets.add(element);
      element.addEventListener(action.type, action.callback, action.options);
    },
    clear() {
      for (const [, action] of store) {
        for (const target of action.targets) {
          target.removeEventListener(action.type, action.callback, action.options);
        }
        action.targets.clear();
      }
      store.clear();
    },
    create(parameters) {
      if (!store.has(parameters.name)) {
        store.set(parameters.name, {
          callback: parameters.callback,
          options: parameters.options,
          targets: new Set,
          type: parameters.type
        });
      }
    },
    has(name) {
      return store.has(name);
    },
    remove(name, element) {
      const action = store.get(name);
      if (action == null) {
        return;
      }
      element.removeEventListener(action.type, action.callback);
      action.targets.delete(element);
      if (action.targets.size === 0) {
        store.delete(name);
      }
    }
  });
}

// node_modules/@oscarpalmer/atoms/dist/js/string.mjs
var getString = function(value) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value !== "object" || value == null) {
    return String(value);
  }
  const valueOff = value.valueOf?.() ?? value;
  const asString = valueOff?.toString?.() ?? String(valueOff);
  return asString.startsWith("[object ") ? JSON.stringify(value) : asString;
};

// node_modules/@oscarpalmer/atoms/dist/js/is.mjs
var isNullableOrWhitespace = function(value) {
  return value == null || /^\s*$/.test(getString(value));
};

// src/petal/store/data.store.ts
function createData(identifier, context) {
  const prefix = `data-${identifier}-data-`;
  const instance = Object.create(null);
  Object.defineProperty(instance, "value", {
    value: new Proxy({}, {
      set(target, property, value) {
        const previous = JSON.stringify(Reflect.get(target, property));
        const next = JSON.stringify(value);
        if (Object.is(previous, next)) {
          return true;
        }
        const result = Reflect.set(target, property, value);
        if (result) {
          requestAnimationFrame(() => {
            if (isNullableOrWhitespace(value)) {
              context.element.removeAttribute(`${prefix}${String(property)}`);
            } else {
              context.element.setAttribute(`${prefix}${String(property)}`, next);
            }
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
  const store = new Map;
  const instance = Object.create({
    add(name, element) {
      let targets = store.get(name);
      if (targets == null) {
        targets = new Set;
        store.set(name, targets);
      }
      targets.add(element);
    },
    clear() {
      for (const [, targets] of store) {
        targets.clear();
      }
      store.clear();
    },
    get(name) {
      return Array.from(store.get(name) ?? []);
    },
    remove(name, element) {
      store.get(name)?.delete(element);
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
      value: observeController(context, {
        action: `data-${name}-action`,
        data: `data-${name}-data-`,
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
    attributeFilter: [attribute]
  }, {
    handleAttribute(element, name, value, removed) {
      let oldValue = value;
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
      if (element.hasAttribute(attribute)) {
        this.handleAttribute(element, attribute, "", !added);
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
  Controller
};
