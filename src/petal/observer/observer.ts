type Handlers = {
	handleAttribute(
		element: Element,
		name: string,
		value: string,
		removed: boolean,
	): void;
	handleElement(element: Element, added: boolean): void;
};

export type Observer = {
	handleNodes(nodes: NodeList | Node[], added: boolean): void;
	start(): void;
	stop(): void;
	update(): void;
} & Handlers;

export const options: MutationObserverInit = {
	attributeOldValue: true,
	attributes: true,
	childList: true,
	subtree: true,
};

export function getAttributes(from: string, to: string): string[][] {
	const fromValues = from
		.split(/\s+/)
		.map(part => part.trim())
		.filter(part => part.length > 0);

	const toValues = to
		.split(/\s+/)
		.map(part => part.trim())
		.filter(part => part.length > 0);

	const attributes: string[][] = [[], []];

	for (let outer = 0; outer < 2; outer += 1) {
		const values = outer === 0 ? fromValues : toValues;
		const other = outer === 1 ? fromValues : toValues;

		const {length} = values;

		for (let inner = 0; inner < length; inner += 1) {
			const value = values[inner];

			if (!other.includes(value)) {
				attributes[outer].push(value);
			}
		}
	}

	return attributes;
}

export function createObserver(
	element: Element,
	options: MutationObserverInit,
	handlers: Handlers,
): Observer {
	let frame: number;

	const observer = new MutationObserver(entries => {
		for (const entry of entries) {
			if (entry.type === 'childList') {
				instance.handleNodes(entry.addedNodes, true);
				instance.handleNodes(entry.removedNodes, false);
			} else if (entry.target instanceof Element) {
				instance.handleAttribute(
					entry.target,
					entry.attributeName ?? '',
					entry.oldValue ?? '',
					false,
				);
			}
		}
	});

	const instance: Observer = Object.create({
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
		},
	} as Observer);

	instance.start();

	return instance;
}
