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
): void {
	const attributes = getAttributes(oldValue, newValue);

	for (const names of attributes) {
		const added = attributes.indexOf(names) === 1;

		for (const name of names) {
			handleAction(context, element, name, added);
		}
	}
}

export function observeController(
	context: Context,
	attributes: Attributes,
): Observer {
	const {action: actionAttribute} = attributes;

	return createObserver(
		context.element,
		{
			...options,
			attributeFilter: [actionAttribute],
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

				handleChanges(context, element, oldValue, newValue);
			},
			handleElement(element, added) {
				const attributes = Array.from(element.attributes);
				const {length} = attributes;

				let index = 0;

				for (; index < length; index += 1) {
					const attribute = attributes[index].name;

					if (attribute === actionAttribute) {
						this.handleAttribute(element, attribute, '', !added);
					}
				}
			},
		},
	);
}
