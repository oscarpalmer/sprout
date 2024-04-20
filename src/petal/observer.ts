import {constructors, controllers} from './controller';

const attribute = 'data-petal';

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

export function run(name?: string) {
	const elements = document.querySelectorAll(`[${attribute}]`);
	const {length} = elements;

	let index = 0;

	for (; index < length; index += 1) {
		const element = elements[index];

		if (
			name == null ||
			(element.getAttribute(attribute)?.includes(name) ?? false)
		) {
			update(element, '');
		}
	}
}

function update(element: Element, from: string): void {
	const attributes = getAttributes(from, element.getAttribute(attribute) ?? '');

	let elementControllers = controllers.get(element);

	if (elementControllers == null) {
		elementControllers = new Set();

		controllers.set(element, elementControllers);
	}

	let {length} = attributes[0];
	let index = 0;

	for (; index < length; index += 1) {
		const name = attributes[0][index];
		const ctor = constructors.get(name);

		const existing = Array.from(elementControllers).find(
			value => value.constructor === ctor,
		);

		if (existing != null) {
			existing.disconnected();

			elementControllers.delete(existing);
		}
	}

	length = attributes[1].length;
	index = 0;

	for (; index < length; index += 1) {
		const name = attributes[1][index];
		const ctor = constructors.get(name);

		const none =
			Array.from(elementControllers).findIndex(
				value => value.constructor === ctor,
			) === -1;

		if (ctor != null && none) {
			const petal = new ctor(element);

			petal.connected();

			elementControllers.add(petal);
		}
	}
}

new MutationObserver(observer).observe(document, {
	attributeFilter: [attribute],
	attributeOldValue: true,
	attributes: true,
	childList: true,
	subtree: true,
});
