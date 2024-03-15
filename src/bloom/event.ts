// TODO: remove events for element

type Parameters = {
	name: string;
	options: AddEventListenerOptions;
};

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
}

function getParameters(attribute: string): Parameters {
	const parts = attribute.slice(1).toLowerCase().split(':');

	const name = parts.shift() as string;

	const options: AddEventListenerOptions = {
		capture: parts.includes('capture'),
		once: parts.includes('once'),
		passive: !parts.includes('active'),
	};

	return {name, options};
}
