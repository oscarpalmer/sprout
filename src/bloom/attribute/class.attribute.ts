import {getString} from '@oscarpalmer/atoms/string';
import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';
import type {ProperElement} from '../models';

export function setClasses(
	element: ProperElement,
	name: string,
	value: unknown,
): Effect | undefined {
	const classes = name
		.split('.')
		.slice(1)
		.filter(name => name.length > 0)
		.filter((name, index, array) => array.indexOf(name) === index);

	if (classes.length > 0) {
		if (isReactive(value)) {
			return effect(() => updateClassList(element, classes, value.get()));
		}

		updateClassList(element, classes, value);
	}
}

function updateClassList(
	element: Element,
	classes: string[],
	value: unknown,
): void {
	element.classList[/^true$/i.test(getString(value)) ? 'add' : 'remove'](
		...classes,
	);
}
