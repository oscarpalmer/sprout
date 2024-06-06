import {effect, isReactive, type Effect} from '@oscarpalmer/sentinel';

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
	if (value === true) {
		element.classList.add(...classes);
	} else {
		element.classList.remove(...classes);
	}
}
