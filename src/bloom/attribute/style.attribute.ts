import {camelCase, getString} from '@oscarpalmer/atoms/string';
import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';
import type {ProperElement} from '../models';

function getProperty(
	element: ProperElement,
	property: string,
): string | undefined {
	if (property in element.style) {
		return property;
	}

	const camelCased = camelCase(property);

	return camelCased in element.style ? camelCased : undefined;
}

export function setStyle(
	element: ProperElement,
	name: string,
	value: unknown,
): Effect | undefined {
	const [, property, suffix] = name.split('.');

	const existing = getProperty(element, property);

	if (existing != null) {
		if (isReactive(value)) {
			return effect(() =>
				updateStyleProperty(element, existing, suffix, value.get()),
			);
		}

		updateStyleProperty(element, existing, suffix, value);
	}
}

function updateStyleProperty(
	element: ProperElement,
	property: string,
	suffix: string | undefined,
	value: unknown,
): void {
	if (value == null || value === false || (value === true && suffix == null)) {
		element.style[property as never] = '';
	} else {
		element.style[property as never] =
			value === true ? getString(suffix) : `${value}${suffix ?? ''}`;
	}
}
