import {type Reactive, isReactive, effect} from '@oscarpalmer/atoms/signal';
import {isBloom} from '../bloom';
import {mapAttributes} from './attribute';

export function createNode(value: unknown): Node {
	if (value instanceof Node) {
		return value;
	}

	if (isBloom(value)) {
		return value.grow();
	}

	return document.createTextNode(String(value));
}

export function createNodes(html: string): Node {
	const template = document.createElement('template');

	template.innerHTML = html;

	const cloned = template.content.cloneNode(true);

	const scripts = Array.from(
		cloned instanceof Element ? cloned.querySelectorAll('script') : [],
	);

	for (const script of scripts) {
		script.remove();
	}

	cloned.normalize();

	return cloned;
}

function getIndex(value: string): number {
	const [, index] = /^bloom\.(\d+)$/.exec(value) ?? [];

	return index == null ? -1 : +index;
}

export function isStylableElement(
	element: Element,
): element is HTMLElement | SVGElement {
	return element instanceof HTMLElement || element instanceof SVGElement;
}

export function mapNodes(values: unknown[], node: Node): Node {
	const children = Array.from(node.childNodes);
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

function setFunction(comment: Comment, callback: () => void): void {
	const value = callback();

	if (isReactive(value)) {
		setReactive(comment, value);
	} else {
		setNode(comment, value);
	}
}

function setNode(comment: Comment, value: unknown): void {
	const node = createNode(value);

	comment.replaceWith(
		...(/^documentfragment$/i.test(node.constructor.name)
			? Array.from(node.childNodes)
			: [node]),
	);
}

function setReactive(comment: Comment, reactive: Reactive): void {
	const text = document.createTextNode('');

	// TODO: stop effects when element is removed
	effect(() => {
		const {value} = reactive;

		text.textContent = String(value);

		if (value == null && text.parentNode != null) {
			text.replaceWith(comment);
		} else if (value != null && text.parentNode == null) {
			comment.replaceWith(text);
		}
	});
}

function setValue(values: unknown[], comment: Comment): void {
	const value = values[getIndex(comment.nodeValue ?? '')];

	if (value == null) {
		return;
	}

	if (typeof value === 'function') {
		setFunction(comment, value as never);
	} else {
		setNode(comment, value);
	}
}
