// src/petal/controllers/controller.ts
var attribute = "data-petal";

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

// src/petal/controllers/context.ts
function createContext(name, element, ctor) {
  const context = Object.create(null);
  Object.defineProperties(context, {
    element: {
      value: element
    },
    identifier: {
      value: name
    }
  });
  const controller = new ctor(context);
  Object.defineProperty(context, "controller", {
    value: controller
  });
  controller.connected?.();
  return context;
}

// src/petal/store/controller.store.ts
function addController(name, element) {
  const controller = controllers.get(name);
  if (controller != null && !controller.instances.has(element)) {
    controller.instances.set(element, createContext(name, element, controller.constructor));
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
  instance.controller.disconnected?.();
}
var controllers = new Map;

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
      } else if (entry.target instanceof Element) {
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

// src/petal/observer/document.observer.ts
var handleChanges = function(element, newValue, oldValue) {
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
      let newValue = element.getAttribute(name) || "";
      if (newValue === oldValue) {
        return;
      }
      if (removed) {
        oldValue = newValue;
        newValue = "";
      }
      handleChanges(element, newValue, oldValue);
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
