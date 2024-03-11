export class Petal {
	constructor(readonly element: Element) {}

	connected(): void {}

	disconnected(): void {}
}

type Bud = new (element: Element) => Petal;

const attribute = 'data-petal';

const buds = new Map<string, Bud>();

const petals = new Map<Element, Set<Petal>>();

const options: MutationObserverInit = {
	attributeFilter: [attribute],
	attributeOldValue: true,
	attributes: true,
	childList: true,
	subtree: true,
};

function getAttributes(from: string, to: string): string[][] {
	const fromValues = from
		.split(/\s+/)
		.map(part => part.trim())
		.filter(part => part.length > 0);

	const toValues = to
		.split(/\s+/)
		.map(part => part.trim())
		.filter(part => part.length > 0);

	const result: string[][] = [[], []];

	for (let outer = 0; outer < 2; outer += 1) {
		const values = outer === 0 ? fromValues : toValues;
		const other = outer === 1 ? fromValues : toValues;

		const {length} = values;

		for (let inner = 0; inner < length; inner += 1) {
			const value = values[inner];

			if (!other.includes(value)) {
				result[outer].push(value);
			}
		}
	}

	return result;
}

function observer(mutations: MutationRecord[]): void {
	const {length} = mutations;

	let index = 0;

	for (; index < length; index += 1) {
		const mutation = mutations[index];

		if (mutation.type === 'attributes' && mutation.target instanceof Element) {
			update(mutation.target, mutation.oldValue ?? '');
		}
	}
}

export function petal(name: string, bud: Bud): void {
	if (buds.has(name)) {
		throw new Error(`Petal '${name}' already exists`);
	}

	buds.set(name, bud);
}

function update(element: Element, from: string): void {
	const attributes = getAttributes(from, element.getAttribute(attribute) ?? '');

	let elementControllers = petals.get(element);

	if (elementControllers === undefined) {
		elementControllers = new Set();

		petals.set(element, elementControllers);
	}

	let {length} = attributes[0];
	let index = 0;

	for (; index < length; index += 1) {
		const name = attributes[0][index];
		const bud = buds.get(name);

		const existing = Array.from(elementControllers).find(
			value => value.constructor === bud,
		);

		if (existing !== undefined) {
			existing.disconnected();

			elementControllers.delete(existing);
		}
	}

	length = attributes[1].length;
	index = 0;

	for (; index < length; index += 1) {
		const name = attributes[1][index];
		const bud = buds.get(name);

		const none =
			Array.from(elementControllers).findIndex(
				value => value.constructor === bud,
			) === -1;

		if (bud !== undefined && none) {
			const petal = new bud(element);

			petal.connected();

			elementControllers.add(petal);
		}
	}
}

new MutationObserver(observer).observe(document, options);

document.addEventListener('DOMContentLoaded', () => {
	const elements = document.querySelectorAll(`[${attribute}]`);
	const {length} = elements;

	let index = 0;

	for (; index < length; index += 1) {
		update(elements[index], '');
	}
});
