import {attribute} from '../controllers/controller';
import {addController, removeController} from '../store/controller.store';
import {
	type Observer,
	createObserver,
	getAttributes,
	options,
} from './observer';

function handleChanges(
	element: Element,
	newValue: string,
	oldValue: string,
): void {
	const attributes = getAttributes(oldValue, newValue);

	for (const names of attributes) {
		const added = attributes.indexOf(names) === 1;

		for (const name of names) {
			if (added) {
				addController(name, element);
			} else {
				removeController(name, element);
			}
		}
	}
}

export function observeDocument(): Observer {
	return createObserver(
		document.body,
		{
			...options,
			attributeFilter: [attribute],
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

				handleChanges(element, newValue, oldValue);
			},
			handleElement(element, added) {
				if (element.hasAttribute(attribute)) {
					this.handleAttribute(element, attribute, '', !added);
				}
			},
		},
	);
}
