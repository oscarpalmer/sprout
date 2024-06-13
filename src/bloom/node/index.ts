import {mapAttributes} from '../attribute/index';
import {isBloom} from '../helpers/is.helper';
import {setValue} from './value';

export function createFragment(nodes: Node[]): DocumentFragment {
	const fragment = document.createDocumentFragment();

	fragment.append(...nodes);

	return fragment;
}

export function createNode(value: unknown): Node {
	if (value instanceof Node) {
		return value;
	}

	return isBloom(value) ? value.grow() : document.createTextNode(String(value));
}

export function createNodes(html: string): Node {
	const template = document.createElement('template');

	template.innerHTML = html;

	const cloned = template.content.cloneNode(true);

	const scripts = [
		...(cloned instanceof Element ? cloned.querySelectorAll('script') : []),
	];

	for (const script of scripts) {
		script.remove();
	}

	cloned.normalize();

	return cloned;
}

export function getIndex(value: string): number {
	const [, index] = /^bloom\.(\d+)$/.exec(value) ?? [];

	return index == null ? -1 : +index;
}

export function getNodes(node: Node): Node[] {
	return /^documentfragment$/i.test(node.constructor.name)
		? [...node.childNodes]
		: [node];
}

export function mapNodes(values: unknown[], node: Node): Node {
	const children = [...node.childNodes];
	const {length} = children;

	let index = 0;

	for (; index < length; index += 1) {
		const child = children[index];

		if (child.nodeType === 8) {
			setValue(values, child as Comment);

			continue;
		}

		if (child instanceof Element) {
			mapAttributes(values, child);
		}

		if (child.hasChildNodes()) {
			mapNodes(values, child);
		}
	}

	return node;
}
