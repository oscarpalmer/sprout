import {getString} from '@oscarpalmer/atoms/string';
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
	const property = name === 'readonly' ? 'readOnly' : name;
	const isBoolean = booleanAttributes.has(property) && property in element;
	const isValue = property === 'value' && property in element;

	const callback = isBoolean
		? property === 'selected'
			? setSelectedAttribute(element)
			: setBooleanAttribute
		: setAttribute;

	if (isReactive(value)) {
		return effect(() => callback(element, property, value.get(), isValue));
	}

	callback(element, property, value, isValue);
}

function setAttribute(
	element: ProperElement,
	name: string,
	value: unknown,
	isValue: boolean,
): void {
	switch (true) {
		case isValue:
			(element as HTMLInputElement).value =
				value == null ? '' : getString(value);
			break;
		case value == null:
			element.removeAttribute(name);
			break;
		default:
			element.setAttribute(name, getString(value));
	}
}
