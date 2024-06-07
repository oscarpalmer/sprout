import type {StoredData, StoredParameters} from './models';

const store = new WeakMap<Node, StoredData>();

export function disableStoredNode(node: Node, remove?: boolean): void {
	updateStoredNode('disable', node, remove ?? false);

	if (remove) {
		node.parentNode?.removeChild(node);
	}
}

export function enableStoredNode(node: Node): void {
	updateStoredNode('enable', node, false);
}

export function storeNode(node: Node, data: Partial<StoredParameters>): void {
	let stored = store.get(node);

	if (stored == null) {
		stored = {
			effects: new Set(),
			events: new Map(),
		};

		store.set(node, stored);
	}

	if (data.effect != null) {
		stored.effects.add(data.effect);
	}

	if (data.event != null) {
		let events = stored.events.get(data.event.name);

		if (events == null) {
			events = new Map();

			stored.events.set(data.event.name, events);
		}

		if (!events.has(data.event.listener)) {
			events.set(data.event.listener, data.event);
		}
	}
}

function updateStoredNode(
	type: 'disable' | 'enable',
	node: Node,
	clear: boolean,
): void {
	const stored = store.get(node);

	if (stored != null) {
		const name = type === 'disable' ? 'stop' : 'start';

		for (const effect of stored.effects) {
			effect[name]();
		}

		const callback =
			type === 'disable' ? node.removeEventListener : node.addEventListener;

		for (const [name, listeners] of stored.events) {
			for (const [listener, data] of listeners) {
				callback(name, listener, data.options);
			}
		}

		if (clear) {
			stored.effects.clear();
			stored.events.clear();
			store.delete(node);
		}
	}

	updateStoredNodes(type, node, clear);
}

function updateStoredNodes(
	type: 'disable' | 'enable',
	node: Node,
	clear: boolean,
): void {
	if (node.hasChildNodes()) {
		const children = [...node.childNodes];
		const {length} = children;

		let index = 0;

		for (; index < length; index += 1) {
			updateStoredNode(type, children[index], clear);
		}
	}
}
