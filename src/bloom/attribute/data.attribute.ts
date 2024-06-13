import {camelCase} from '@oscarpalmer/atoms/string';
import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';
import type {ProperElement} from '../models';

export function setDataAttribute(
	element: ProperElement,
	name: string,
	value: unknown,
): Effect | undefined {
	const kebabCased = name.split('-').slice(1).join('-');
	const camelCased = camelCase(kebabCased);

	if (isReactive(value)) {
		return effect(() => setValue(element, camelCased, value.get()));
	}

	setValue(element, camelCased, value);
}

function setValue(element: ProperElement, key: string, value: unknown): void {
	element.dataset[key] = JSON.stringify(value);
}
