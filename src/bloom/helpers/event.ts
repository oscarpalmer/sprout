import type {EventParameters} from '../models';
import {storeNode} from '../store';

export function addEvent(
	element: Element,
	attribute: string,
	value: unknown,
): void {
	element.removeAttribute(attribute);

	if (typeof value !== 'function') {
		return;
	}

	const parameters = getParameters(attribute);

	element.addEventListener(parameters.name, value as never, parameters.options);

	storeNode(element, {
		event: {element, listener: value as never, ...parameters},
	});
}

function getParameters(attribute: string): EventParameters {
	const parts = attribute.slice(1).toLowerCase().split(':');

	const name = parts.shift() as string;

	const options: AddEventListenerOptions = {
		capture: parts.includes('capture'),
		once: parts.includes('once'),
		passive: !parts.includes('active'),
	};

	return {name, options};
}
