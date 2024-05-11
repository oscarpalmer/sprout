import type {Context} from '../controller/context';
import {type Observer, createObserver, options} from './observer';
import {
	handleActionAttribute,
	handleAttributeChanges,
	handleDataAttribute,
	handleInputAttribute,
	handleOutputAttribute,
	handleTargetAttribute,
} from './attributes';

type Attributes = {
	action: string;
	data: string;
	input: string;
	output: string;
	target: string;
};

export function observeController(
	context: Context,
	attributes: Attributes,
): Observer {
	const {
		action: actionAttribute,
		data: dataAttribute,
		input: inputAttribute,
		output: outputAttribute,
		target: targetAttribute,
	} = attributes;

	const callbacks = {
		[actionAttribute]: handleActionAttribute,
		[inputAttribute]: handleInputAttribute,
		[outputAttribute]: handleOutputAttribute,
		[targetAttribute]: handleTargetAttribute,
	};

	const {length} = dataAttribute;

	return createObserver(
		context.element,
		{
			...options,
		},
		(element, name, value, added) => {
			if (name.startsWith(dataAttribute)) {
				handleDataAttribute(
					context,
					name.slice(length),
					element.getAttribute(name) ?? '',
				);
			} else {
				handleAttributeChanges({
					added,
					callbacks,
					context,
					element,
					name,
					value,
				});
			}
		},
	);
}
