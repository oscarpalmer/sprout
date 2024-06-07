import {type Effect, isEffect} from '@oscarpalmer/sentinel';
import {addEvent} from '../helpers/event';
import {isBadAttribute} from '../helpers/is';
import {storeNode} from '../store';
import {booleanAttributes, setAny} from './any';
import {setClasses} from './classes';
import {setStyle} from './style';

function getAttributeEffect(
	name: string,
	allowAny: boolean,
):
	| ((
			element: Element,
			name: string,
			value: unknown,
			isBoolean?: boolean,
	  ) => Effect | undefined)
	| undefined {
	switch (true) {
		case /^class\.\w/.test(name):
			return setClasses;

		case /^style\.\w/.test(name):
			return setStyle;

		case allowAny:
		case booleanAttributes.has(name):
			return setAny;

		default:
			break;
	}
}

function getIndex(value: string): number {
	const [, index] = /^<!--bloom\.(\d+)-->$/.exec(value) ?? [];

	return index == null ? -1 : +index;
}

export function mapAttributes(values: unknown[], element: Element): void {
	const attributes = [...element.attributes];
	const {length} = attributes;

	let index = 0;

	for (; index < length; index += 1) {
		const attribute = attributes[index];
		const value = values[getIndex(attribute.value)];

		const badAttribute = isBadAttribute(attribute);

		if (badAttribute) {
			element.removeAttribute(attribute.name);

			continue;
		}

		if (attribute.name.startsWith('@')) {
			addEvent(element, attribute.name, value);
		} else {
			const isFunction = typeof value === 'function';

			const fx = getAttributeEffect(attribute.name, isFunction)?.(
				element,
				attribute.name,
				isFunction ? value() : attribute.value,
			);

			if (isEffect(fx)) {
				storeNode(element, {effect: fx});
			}
		}
	}
}
