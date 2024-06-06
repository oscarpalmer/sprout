import type {PlainObject} from '@oscarpalmer/atoms/models';
import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';

export const booleanAttributes = new Set([
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

export function setAny(
	element: Element,
	name: string,
	value: unknown,
): Effect | undefined {
	const isBoolean = booleanAttributes.has(name) && name in element;
	const isValue = name === 'value' && name in element;

	const callback = isBoolean ? setBooleanAttribute : setAnyAttribute;

	if (isReactive(value)) {
		return effect(() => callback(element, name, value.get(), isValue));
	}

	callback(element, name, value, isValue);
}

function setAnyAttribute(
	element: Element,
	name: string,
	value: unknown,
	isValue: boolean,
): void {
	switch (true) {
		case isValue:
			(element as HTMLInputElement).value = String(value);
			break;
		case value == null:
			element.removeAttribute(name);
			break;
		default:
			element.setAttribute(name, String(value));
	}
}

function setBooleanAttribute(
	element: Element,
	name: string,
	value: unknown,
): void {
	(element as unknown as PlainObject)[name] = /^(|true)$/i.test(String(value));
}
