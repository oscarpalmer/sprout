import {effect, isList, isReactive, type Reactive} from '@oscarpalmer/sentinel';
import {isBloom} from '../helpers/is';
import type {Bloom, IdentifiedNodes} from '../models';
import {storeNode} from '../store';
import {
	createIdentified,
	createIdentifieds,
	replaceIdentified,
	updateIdentified,
} from './identified';
import {createNode, getIndex, getNodes} from './index';

function setFunctionValue(comment: Comment, callback: () => unknown): void {
	const value = callback();

	(isReactive(value) ? setReactiveValue : setNodeValue)(
		comment,
		value as never,
	);
}

function setNodeValue(comment: Comment, value: unknown): void {
	comment.replaceWith(...getNodes(createNode(value)));
}

function setReactiveList(comment: Comment, reactive: Reactive): void {
	let identified: IdentifiedNodes[] | null;

	effect(() => {
		const list = reactive.get() as unknown[];

		if (list.length === 0) {
			identified = replaceIdentified(
				identified ?? [],
				[{nodes: [comment]}],
				false,
			);

			return;
		}

		let templates = list.filter(
			item => isBloom(item) && item.id != null,
		) as Bloom[];

		const identifiers = templates.map(item => item.id) as (number | string)[];

		if (new Set(identifiers).size !== identifiers.length) {
			templates = [];
		}

		identified =
			identified == null || templates.length === 0
				? replaceIdentified(
						identified ?? [{nodes: [comment]}],
						templates.length > 0
							? templates.map(template => createIdentified(template))
							: createIdentifieds(list.map(createNode)),
						true,
					)
				: updateIdentified(identified, identifiers, templates);
	});
}

function setReactiveText(comment: Comment, reactive: Reactive): void {
	const text = document.createTextNode('');

	const fx = effect(() => {
		const value = reactive.get();

		text.textContent = String(value);

		if (value == null && text.parentNode != null) {
			text.replaceWith(comment);
		} else if (value != null && text.parentNode == null) {
			comment.replaceWith(text);
		}
	});

	storeNode(comment, {effect: fx});
	storeNode(text, {effect: fx});
}

function setReactiveValue(comment: Comment, reactive: Reactive): void {
	if (isList(reactive) || Array.isArray(reactive.peek())) {
		setReactiveList(comment, reactive);
	} else {
		setReactiveText(comment, reactive);
	}
}

export function setValue(values: unknown[], comment: Comment): void {
	const value = values[getIndex(comment.nodeValue ?? '')];

	if (typeof value === 'function') {
		setFunctionValue(comment, value as never);
	} else if (value != null) {
		setNodeValue(comment, value);
	}
}
