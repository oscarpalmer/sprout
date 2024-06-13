import {type Effect, isEffect} from '@oscarpalmer/sentinel';
import {addEvent} from '../helpers/event.helper';
import {isBadAttribute} from '../helpers/is.helper';
import type {ProperElement} from '../models';
import {storeNode} from '../store';
import {setAnyAttribute} from './any.attribute';
import {booleanAttributes} from './boolean.attribute';
import {setClasses} from './class.attribute';
import {setDataAttribute} from './data.attribute';
import {setStyle} from './style.attribute';

function getAttributeCallback(
	name: string,
	allowAny: boolean,
):
	| ((
			element: ProperElement,
			name: string,
			value: unknown,
	  ) => Effect | undefined)
	| undefined {
	switch (true) {
		case /^class\.\w/.test(name):
			return setClasses;

		case /^data-\w/.test(name):
			return setDataAttribute;

		case /^style\.\w/.test(name):
			return setStyle;

		case allowAny:
		case booleanAttributes.has(name):
			return setAnyAttribute;

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

		switch (true) {
			case badAttribute:
				element.removeAttribute(attribute.name);
				continue;

			case attribute.name.startsWith('@'):
				addEvent(element, attribute.name, value);
				continue;

			case element instanceof HTMLElement || element instanceof SVGElement:
				setAttribute(element, attribute, value);
				continue;

			default:
				continue;
		}
	}
}

function setAttribute(
	element: ProperElement,
	attribute: Attr,
	value: unknown,
): void {
	const isFunction = typeof value === 'function';

	const callback = getAttributeCallback(attribute.name, isFunction);

	if (callback != null) {
		element.removeAttribute(attribute.name);
	}

	const fx = callback?.(
		element,
		attribute.name,
		isFunction ? value() : attribute.value,
	);

	if (isEffect(fx)) {
		storeNode(element, {effect: fx});
	}
}
