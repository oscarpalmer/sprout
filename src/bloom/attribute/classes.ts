import {type Effect, effect, isReactive} from '@oscarpalmer/sentinel';

export function setClasses(
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

function updateClassList(
	element: Element,
	classes: string[],
	value: unknown,
): void {
	element.classList[value === true ? 'add' : 'remove'](...classes);
}
