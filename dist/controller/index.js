// src/controller/index.ts
function controller(name, value) {
  if (constructors.has(name)) {
    throw new Error(`Controller '${name}' already exists`);
  }
  constructors.set(name, value);
}
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
var update = function(element, from) {
  const attributes = getAttributes(from, element.getAttribute("data-controller") ?? "");
  let elementControllers = controllers.get(element);
  if (elementControllers === undefined) {
    elementControllers = new Set;
    controllers.set(element, elementControllers);
  }
  let { length } = attributes[0];
  let index = 0;
  for (;index < length; index += 1) {
    const name = attributes[0][index];
    const cnstrctr = constructors.get(name);
    const existing = Array.from(elementControllers).find((value) => value.constructor === cnstrctr);
    if (existing !== undefined) {
      elementControllers.delete(existing);
    }
  }
  length = attributes[1].length;
  index = 0;
  for (;index < length; index += 1) {
    const name = attributes[1][index];
    const cnstrctr = constructors.get(name);
    const none = Array.from(elementControllers).findIndex((value) => value.constructor === cnstrctr) === -1;
    if (cnstrctr !== undefined && none) {
      const controller2 = new cnstrctr(element);
      elementControllers.add(controller2);
    }
  }
};

class Controller {
  element;
  constructor(element) {
    this.element = element;
  }
}
var constructors = new Map;
var controllers = new Map;
var options = {
  attributeFilter: ["data-controller"],
  attributeOldValue: true,
  attributes: true,
  childList: true,
  subtree: true
};
new MutationObserver(observer).observe(document, options);
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll("[data-controller]");
  const { length } = elements;
  let index = 0;
  for (;index < length; index += 1) {
    update(elements[index], "");
  }
});
export {
  controller,
  Controller
};
