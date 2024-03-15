// src/bloom/event.ts
function addEvent(element, attribute, value) {
  element.removeAttribute(attribute);
  if (typeof value !== "function") {
    return;
  }
  const parameters = getParameters(attribute);
  element.addEventListener(parameters.name, value, parameters.options);
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
export {
  addEvent
};
