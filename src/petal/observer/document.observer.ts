import {attribute} from '../controller/controller';
import {
	handleAttributeChanges,
	handleControllerAttribute,
	handleExternalInputAttribute,
	handleExternalOutputAttribute,
} from './attributes';
import {type Observer, createObserver, options} from './observer';

export function observeDocument(): Observer {
	const inputAttribute = `${attribute}-input`;
	const outputAttribute = `${attribute}-output`;

	const attributes = [attribute, inputAttribute, outputAttribute];

	const callbacks = {
		[attribute]: handleControllerAttribute,
		[inputAttribute]: handleExternalInputAttribute,
		[outputAttribute]: handleExternalOutputAttribute,
	};

	return createObserver(
		document.body,
		{
			...options,
			attributeFilter: attributes,
		},
		(element, name, value, added) => {
			handleAttributeChanges({
				added,
				callbacks,
				element,
				name,
				value,
			});
		},
	);
}
