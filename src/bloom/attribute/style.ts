import {effect, isReactive, type Effect} from '@oscarpalmer/sentinel';
import {isStylableElement} from '../helpers/is';

export function setStyle(
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
