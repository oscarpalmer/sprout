import type {Key} from '@oscarpalmer/atoms/models';
import {getString} from '@oscarpalmer/atoms/string';
import {
	type Reactive,
	effect,
	isArray,
	isReactive,
} from '@oscarpalmer/sentinel';
import {getExpressionIndex} from '../helpers';
import {isBloom} from '../helpers/is.helper';
import type {Bloom, IdentifiedNodes} from '../models';
import {storeNode} from '../store';
import {
	createIdentified,
	createIdentifieds,
	replaceIdentified,
	updateIdentified,
} from './identified.node';
import {createNode, getNodes} from './index';

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

		const identifiers = templates.map(item => item.id) as Key[];

		if (new Set(identifiers).size !== list.length) {
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

		text.textContent = getString(value);

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
	if (isArray(reactive) || Array.isArray(reactive.peek())) {
		setReactiveList(comment, reactive);
	} else {
		setReactiveText(comment, reactive);
	}
}

export function setValue(values: unknown[], comment: Comment): void {
	const value = values[getExpressionIndex(comment.nodeValue ?? '')];

	if (typeof value === 'function') {
		setFunctionValue(comment, value as never);
	} else if (value != null) {
		setNodeValue(comment, value);
	}
}
