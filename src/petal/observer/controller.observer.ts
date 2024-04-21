import type {Context} from '../controllers/context';
import {getEventParameters} from '../helpers/event';
import {
	type Observer,
	createObserver,
	options,
	getAttributes,
} from './observer';

type Attributes = {
	action: string;
	data: string;
	target: string;
};

function handleAction(
	context: Context,
	element: Element,
	action: string,
	added: boolean,
): void {
	if (context.actions.has(action)) {
		if (added) {
			context.actions.add(action, element);
		} else {
			context.actions.remove(action, element);
		}

		return;
	}

	if (!added) {
		return;
	}

	const parameters = getEventParameters(element, action);

	if (parameters == null) {
		return;
	}

	const callback = (context.controller as any)[parameters.callback] as (
		event: Event,
	) => void;

	if (typeof callback !== 'function') {
		return;
	}

	context.actions.create({
		callback: callback.bind(context.controller),
		name: action,
		options: parameters.options,
		target: element,
		type: parameters.type,
	});

	context.actions.add(action, element);
}

function handleChanges(
	context: Context,
	element: Element,
	oldValue: string,
	newValue: string,
	callback: (
		context: Context,
		element: Element,
		name: string,
		added: boolean,
	) => void,
): void {
	const attributes = getAttributes(oldValue, newValue);

	for (const names of attributes) {
		const added = attributes.indexOf(names) === 1;

		for (const name of names) {
			callback(context, element, name, added);
		}
	}
}

function handleData(context: Context, name: string, value: string): void {
	let data: unknown;

	try {
		data = JSON.parse(value);
	} catch (_) {
		data = value;
	}

	context.data.value[name] = data;
}

function handleTarget(
	context: Context,
	element: Element,
	target: string,
	added: boolean,
): void {
	if (added) {
		context.targets.add(target, element);
	} else {
		context.targets.remove(target, element);
	}
}

export function observeController(
	context: Context,
	attributes: Attributes,
): Observer {
	const {
		action: actionAttribute,
		data: dataAttribute,
		target: targetAttribute,
	} = attributes;

	const callbacks = {
		[actionAttribute]: handleAction,
		[targetAttribute]: handleTarget,
	};

	const names = [actionAttribute, targetAttribute];

	return createObserver(
		context.element,
		{
			...options,
		},
		{
			handleAttribute(element, name, value, removed) {
				let oldValue = value;
				let newValue = element.getAttribute(name) ?? '';

				if (newValue === oldValue) {
					return;
				}

				if (removed) {
					oldValue = newValue;
					newValue = '';
				}

				if (names.includes(name)) {
					handleChanges(context, element, oldValue, newValue, callbacks[name]);
				} else if (name.startsWith(dataAttribute)) {
					handleData(context, name.slice(dataAttribute.length), newValue);
				}
			},
			handleElement(element, added) {
				const attributes = Array.from(element.attributes);
				const {length} = attributes;

				let index = 0;

				for (; index < length; index += 1) {
					this.handleAttribute(element, attributes[index].name, '', !added);
				}
			},
		},
	);
}
