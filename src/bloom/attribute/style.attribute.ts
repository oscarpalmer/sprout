import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';
import type {ProperElement} from '../models';

export function setStyle(
	element: ProperElement,
	name: string,
	value: unknown,
): Effect | undefined {
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

function updateStyleProperty(
	element: ProperElement,
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