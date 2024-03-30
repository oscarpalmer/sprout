import {type Effect, isReactive, effect, isEffect} from '@oscarpalmer/sentinel';
import {isStylableElement} from './node';
import {addEvent} from './event';
import {storeNode} from './store';

const booleanAttributes = new Set([
	'checked',
	'disabled',
	'hidden',
	'inert',
	'multiple',
	'open',
	'readonly',
	'required',
	'selected',
]);

function getIndex(value: string): number {
	const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value) ?? [];

	return index == null ? -1 : +index;
}

function getSetter(
	name: string,
	allowAny: boolean,
):
	| ((element: Element, name: string, value: unknown) => Effect | undefined)
	| undefined {
	switch (true) {
		case booleanAttributes.has(name.toLowerCase()):
			return setBoolean;

		case /^class\.\w/.test(name):
			return setClasses;

		case /^style\.\w/.test(name):
			return setStyle;

		default:
			return allowAny ? setAny : undefined;
	}
}

function isBadAttribute(attribute: Attr): boolean {
	const {name, value} = attribute;

	return (
		/^on/i.test(name) ||
		(/^(href|src|xlink:href)$/i.test(name) &&
			/(data:text\/html|javascript:)/i.test(value))
	);
}

export function mapAttributes(values: unknown[], element: Element): void {
	const attributes = Array.from(element.attributes);
	const {length} = attributes;

	let index = 0;

	for (; index < length; index += 1) {
		const attribute = attributes[index];
		const value = values[getIndex(attribute.value)];

		const badAttribute = isBadAttribute(attribute);

		if (badAttribute) {
			element.removeAttribute(attribute.name);

			continue;
		}

		if (attribute.name.startsWith('@')) {
			addEvent(element, attribute.name, value);
		} else {
			const isFunction = typeof value === 'function';

			const fx = getSetter(attribute.name, isFunction)?.(
				element,
				attribute.name,
				isFunction ? value() : attribute.value,
			);

			if (isEffect(fx)) {
				storeNode(element, {effect: fx});
			}
		}
	}
}

function setAny(
	element: Element,
	name: string,
	value: unknown,
): Effect | undefined {
	if (isReactive(value)) {
		return effect(() => setAnyAttribute(element, name, value.get()));
	}

	setAnyAttribute(element, name, value);
}

function setAnyAttribute(element: Element, name: string, value: unknown): void {
	if (value == null) {
		element.removeAttribute(name);
	} else {
		element.setAttribute(name, String(value));
	}
}

function setBoolean(
	element: Element,
	name: string,
	value: unknown,
): Effect | undefined {
	if (isReactive(value)) {
		return effect(() => setBooleanAttribute(element, name, value.get()));
	}

	setBooleanAttribute(element, name, value);
}

function setBooleanAttribute(
	element: Element,
	name: string,
	value: unknown,
): void {
	if (/^(|true)$/i.test(String(value))) {
		element.setAttribute(name, '');
	} else {
		element.removeAttribute(name);
	}
}

function setClasses(
	element: Element,
	name: string,
	value: unknown,
): Effect | undefined {
	const classes = name
		.split('.')
		.slice(1)
		.filter(name => name.length > 0);

	if (classes.length === 0) {
		return;
	}

	if (isReactive(value)) {
		return effect(() => updateClassList(element, classes, value.get()));
	}

	updateClassList(element, classes, value);
}

function setStyle(
	element: Element,
	name: string,
	value: unknown,
): Effect | undefined {
	if (!isStylableElement(element)) {
		return;
	}

	const [, first, second] = name.split('.');

	const property = first.trim();
	const suffix = second?.trim();

	if (property.length === 0 || (suffix != null && suffix.length === 0)) {
		return;
	}

	if (isReactive(value)) {
		return effect(() =>
			updateStyleProperty(element, property, suffix, value.get()),
		);
	}

	updateStyleProperty(element, property, suffix, value);
}

function updateClassList(
	element: Element,
	classes: string[],
	value: unknown,
): void {
	if (value === true) {
		element.classList.add(...classes);
	} else {
		element.classList.remove(...classes);
	}
}

function updateStyleProperty(
	element: HTMLElement | SVGElement,
	property: string,
	suffix: string | undefined,
	value: unknown,
): void {
	if (value == null || value === false || (value === true && suffix == null)) {
		element.style.removeProperty(property);
	} else {
		element.style.setProperty(
			property,
			value === true ? String(suffix) : `${value}${suffix ?? ''}`,
		);
	}
}
