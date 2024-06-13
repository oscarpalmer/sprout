import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';
import type {ProperElement} from '../models';
import {
	booleanAttributes,
	setBooleanAttribute,
	setSelectedAttribute,
} from './boolean.attribute';

export function setAnyAttribute(
	element: ProperElement,
	name: string,
	value: unknown,
): Effect | undefined {
	const isBoolean = booleanAttributes.has(name) && name in element;
	const isValue = name === 'value' && name in element;

	const callback = isBoolean
		? name === 'selected'
			? setSelectedAttribute
			: setBooleanAttribute
		: setAttribute;

	if (isReactive(value)) {
		return effect(() => callback(element, name, value.get(), isValue));
	}

	callback(element, name, value, isValue);
}

function setAttribute(
	element: ProperElement,
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
