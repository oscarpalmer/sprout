import type {PlainObject} from '@oscarpalmer/atoms/models';
import type {Context} from '../controller/context';
import {getEventParameters} from '../helpers/event';
import {
	addController,
	controllers,
	removeController,
} from '../store/controller.store';

type ChangeCallback = (
	element: Element,
	name: string,
	value: string,
	added: boolean,
) => void;

type HandleCallback = (
	context: Context,
	element: Element,
	name: string,
	value: string,
	added: boolean,
	handler?: (event: Event) => void,
) => void;

type HandleParameters = {
	added: boolean;
	callbacks: Record<string, ChangeCallback>;
	element: Element;
	name: string;
	value: string;
};

type ChangesParameters = {
	callback: ChangeCallback;
	element: Element;
	from: string;
	name: string;
	to: string;
};

const actionPattern = /^(?:(\w+)->)?(\w+)@(\w+)$/;
const targetPattern = /^(?:(\w+)->)?(\w+)?\.(\w+)$/;

function getChanges(from: string, to: string): string[][] {
	const fromValues = from
		.split(/\s+/)
		.map(part => part.trim())
		.filter(part => part.length > 0);

	const toValues = to
		.split(/\s+/)
		.map(part => part.trim())
		.filter(part => part.length > 0);

	const attributes: string[][] = [[], []];

	for (let outer = 0; outer < 2; outer += 1) {
		const values = outer === 0 ? fromValues : toValues;
		const other = outer === 1 ? fromValues : toValues;

		const {length} = values;

		for (let inner = 0; inner < length; inner += 1) {
			const value = values[inner];

			if (!other.includes(value)) {
				attributes[outer].push(value);
			}
		}
	}

	return attributes;
}

function handleAction(
	context: Context,
	element: Element,
	_: string,
	value: string,
	added: boolean,
	handler?: (event: Event) => void,
): void {
	if (context.actions.has(value)) {
		if (added) {
			context.actions.add(value, element);
		} else {
			context.actions.remove(value, element);
		}

		return;
	}

	if (!added) {
		return;
	}

	const parameters = getEventParameters(element, value);

	if (parameters == null) {
		return;
	}

	const callback =
		handler ??
		((context.controller as unknown as PlainObject)[parameters.callback] as (
			event: Event,
		) => void);

	if (typeof callback === 'function') {
		context.actions.create({
			callback: callback.bind(context.controller),
			name: value,
			options: parameters.options,
			target: element,
			type: parameters.type,
		});

		context.actions.add(value, element);
	}
}

export function handleActionAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleTarget(element, value, added, actionPattern, handleAction);
}

export function handleAttributeChanges(parameters: HandleParameters): void {
	const callback = parameters.callbacks[parameters.name];

	if (callback == null) {
		return;
	}

	let from = parameters.value;
	let to = parameters.element.getAttribute(parameters.name) ?? '';

	if (from === to) {
		return;
	}

	if (!parameters.added) {
		[from, to] = [to, from];
	}

	handleChanges({
		callback,
		from,
		to,
		element: parameters.element,
		name: parameters.name,
	});
}

function handleChanges(parameters: ChangesParameters): void {
	const changes = getChanges(parameters.from, parameters.to);

	for (const changed of changes) {
		const added = changes.indexOf(changed) === 1;

		for (const change of changed) {
			parameters.callback(parameters.element, parameters.name, change, added);
		}
	}
}

export function handleControllerAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	if (added) {
		addController(value, element);
	} else {
		removeController(value, element);
	}
}

export function handleDataAttribute(
	context: Context,
	name: string,
	value: string,
): void {
	let data: unknown;

	try {
		data = JSON.parse(value);
	} catch (_) {
		data = value;
	}

	context.data.value[name] = data;
}

export function handleAttributes(context: Context): void {
	const attributes = ['action', 'input', 'output', 'target'];
	const callbacks = [
		handleActionAttribute,
		handleInputAttribute,
		handleOutputAttribute,
		handleTargetAttribute,
	];
	const values = [`->${context.identifier}@`, `->${context.identifier}.`];

	for (const attribute of attributes) {
		const index = attributes.indexOf(attribute);
		const callback = callbacks[index];
		const value = index === 0 ? values[0] : values[1];

		const targets = document.querySelectorAll(
			`[data-${attribute}*="${value}"]`,
		);

		if (targets.length === 0) {
			continue;
		}

		for (const target of targets) {
			const attributes = Array.from(target.attributes);

			for (const attribute of attributes) {
				if (attribute.value.includes(value)) {
					callback(target, '', attribute.value, true);
				}
			}
		}
	}
}

export function handleInputAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleTarget(element, value, added, targetPattern, handleInput);
}

export function handleOutputAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleTarget(element, value, added, targetPattern, handleOutput);
}

function handleTarget(
	element: Element,
	value: string,
	added: boolean,
	pattern: RegExp,
	callback: HandleCallback,
): void {
	const [, identifier, controller, name] = pattern.exec(value) ?? [];

	if (controller == null || name == null) {
		return;
	}

	let identified: Element | null;

	if (identifier == null) {
		identified = element.closest(`[data-petal*="${controller}"]`);
	} else {
		identified = document.querySelector(`#${identifier}`);
	}

	if (identified == null) {
		return;
	}

	const context = controllers.get(controller)?.instances.get(identified);

	if (context != null) {
		callback(context, element, '', name, added);
	}
}

export function handleTargetAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleTarget(element, value, added, targetPattern, handleTargetElement);
}

function handleInput(
	context: Context,
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	if (
		context != null &&
		(element instanceof HTMLInputElement ||
			element instanceof HTMLTextAreaElement)
	) {
		const checkbox = element.getAttribute('type') === 'checkbox';

		handleAction(context, element, '', 'input', added, (event: Event) => {
			context.data.value[value] = checkbox
				? (event.target as HTMLInputElement).checked
				: (event.target as HTMLInputElement).value;
		});

		handleTargetElement(context, element, '', `input:${value}`, added);
	}
}

function handleOutput(
	context: Context,
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleTargetElement(context, element, '', `output:${value}`, added);
}

function handleTargetElement(
	context: Context,
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	if (added) {
		context.targets.add(value, element);
	} else {
		context.targets.remove(value, element);
	}
}
