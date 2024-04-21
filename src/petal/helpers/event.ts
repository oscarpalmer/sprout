export type EventParameters = {
	callback: string;
	options: AddEventListenerOptions;
	type: string;
};

const defaultEvents: Record<string, string> = {
	a: 'click',
	button: 'click',
	details: 'toggle',
	form: 'submit',
	select: 'change',
	textarea: 'input',
};

const pattern = /^(?:(\w+)@)?(\w+)(?::([a-z:]+))?$/i;

export function getEventParameters(element: Element, action: string) {
	const matches = action.match(pattern);

	if (matches == null) {
		return;
	}

	const [, type, callback, options] = matches;

	const parameters: EventParameters = {
		callback,
		options: getOptions(options ?? ''),
		type: type ?? getType(element),
	};

	if (parameters.type == null) {
		return;
	}

	return parameters;
}

function getOptions(options: string): AddEventListenerOptions {
	const items = options.toLowerCase().split(':');

	return {
		capture: items.includes('capture') || items.includes('c'),
		once: items.includes('once') || items.includes('o'),
		passive: items.includes('passive') || items.includes('p'),
	};
}

function getType(element: Element): string | undefined {
	if (element instanceof HTMLInputElement) {
		return element.type === 'submit' ? 'submit' : 'input';
	}

	return defaultEvents[element.tagName.toLowerCase()];
}