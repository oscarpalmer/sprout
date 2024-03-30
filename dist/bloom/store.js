// src/bloom/store.ts
function disableNode(node) {
  updateNode("disable", node);
}
function enableNode(node) {
  updateNode("enable", node);
}
function removeNode(node) {
  disableNode(node);
  node.parentNode?.removeChild(node);
}
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
var updateNode = function(type, node) {
  const stored = store.get(node);
  if (stored == null) {
    updateNodes(type, node);
    return;
  }
  for (const effect of stored.effects) {
    if (type === "disable") {
      effect.stop();
    } else {
      effect.start();
    }
  }
  const callback = type === "disable" ? node.removeEventListener : node.addEventListener;
  for (const [name, listeners] of stored.events) {
    for (const [listener, data] of listeners) {
      callback(name, listener, data.options);
    }
  }
  updateNodes(type, node);
};
var updateNodes = function(type, node) {
  if (!node.hasChildNodes()) {
    return;
  }
  const children = Array.from(node.childNodes);
  const { length } = children;
  let index = 0;
  for (;index < length; index += 1) {
    updateNode(type, children[index]);
  }
};
var store = new WeakMap;
export {
  storeNode,
  removeNode,
  enableNode,
  disableNode
};
