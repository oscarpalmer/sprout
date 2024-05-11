import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import type {PlainObject} from '@oscarpalmer/atoms/models';
import type {Context} from '../controller/context';
import {getEventParameters} from '../helpers/event';
import {
	addController,
	controllers,
	removeController,
} from '../store/controller.store';

type HandleAttributeCallback = (
	element: Element,
	name: string,
	value: string,
	added: boolean,
	context?: Context,
	handler?: (event: Event) => void,
) => void;

type HandleAttributeParameters = {
	added: boolean;
	callbacks: Record<string, HandleAttributeCallback>;
	context?: Context;
	element: Element;
	name: string;
	value: string;
};

type HandleChangesParameters = {
	callback: HandleAttributeCallback;
	context?: Context;
	element: Element;
	from: string;
	name: string;
	to: string;
};

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

export function handleActionAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
	context?: Context,
	handler?: (event: Event) => void,
): void {
	if (context == null) {
		return;
	}

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

export function handleAttributeChanges(
	parameters: HandleAttributeParameters,
): void {
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
		context: parameters.context,
		element: parameters.element,
		name: parameters.name,
	});
}

function handleChanges(parameters: HandleChangesParameters): void {
	const changes = getChanges(parameters.from, parameters.to);

	for (const changed of changes) {
		const added = changes.indexOf(changed) === 1;

		for (const change of changed) {
			parameters.callback(
				parameters.element,
				parameters.name,
				change,
				added,
				parameters.context,
			);
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

export function handleExternalAttributes(context: Context): void {
	if (isNullableOrWhitespace(context.element.id)) {
		return;
	}

	const prefix = `${context.element.id}->${context.identifier}.`;
	const inputs = document.querySelectorAll(`[data-petal-input^="${prefix}"]`);
	const outputs = document.querySelectorAll(`[data-petal-output^="${prefix}"]`);

	const matrix = [inputs, outputs];

	for (const elements of matrix) {
		const index = matrix.indexOf(elements);

		const attribute = index === 0 ? 'data-petal-input' : 'data-petal-output';
		const callback = index === 0 ? handleInputAttribute : handleOutputAttribute;

		for (const element of elements) {
			const [, , , name] =
				/^(\w+)->(\w+)\.(\w+)$/.exec(element.getAttribute(attribute) ?? '') ??
				[];

			if (name != null) {
				callback(element, '', name, true, context);
			}
		}
	}
}

export function handleExternalInputAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleExternalTargetAttribute(element, value, true, added);
}

export function handleExternalOutputAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
): void {
	handleExternalTargetAttribute(element, value, false, added);
}

function handleExternalTargetAttribute(
	element: Element,
	value: string,
	input: boolean,
	added: boolean,
): void {
	const [, identifier, controller, name] =
		/^(\w+)->(\w+)\.(\w+)$/.exec(value) ?? [];

	if (identifier == null || controller == null || name == null) {
		return;
	}

	const identified = document.querySelector(`#${identifier}`);

	const context =
		identified && controllers.get(controller)?.instances.get(element);

	if (context != null) {
		(input ? handleInputAttribute : handleOutputAttribute)(
			element,
			'',
			name,
			added,
			context,
		);
	}
}

export function handleInputAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
	context?: Context,
): void {
	if (context != null && element instanceof HTMLInputElement) {
		handleActionAttribute(
			element,
			'',
			'input',
			added,
			context,
			(event: Event) => {
				context.data.value[value] = (event.target as HTMLInputElement).value;
			},
		);
		handleTargetAttribute(element, '', `input:${value}`, added, context);
	}
}

export function handleOutputAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
	context?: Context,
): void {
	handleTargetAttribute(element, '', `output:${value}`, added, context);
}

export function handleTargetAttribute(
	element: Element,
	_: string,
	value: string,
	added: boolean,
	context?: Context,
): void {
	if (added) {
		context?.targets.add(value, element);
	} else {
		context?.targets.remove(value, element);
	}
}
