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
  const attributes = getAttributes(from, element.getAttribute(attribute) ?? "");
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
var attribute = "data-petal";
var buds = new Map;
var petals = new Map;
var options = {
  attributeFilter: [attribute],
  attributeOldValue: true,
  attributes: true,
  childList: true,
  subtree: true
};
new MutationObserver(observer).observe(document, options);
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(`[${attribute}]`);
  const { length } = elements;
  let index = 0;
  for (;index < length; index += 1) {
    update(elements[index], "");
  }
});
export {
  petal,
  Petal
};
