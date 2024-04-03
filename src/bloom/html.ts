import {isBloom} from './is';
import type {BloomData} from './models';

export function getHtml(data: BloomData): string {
	if (data.html.length > 0) {
		return data.html;
	}

	const {length} = data.strings;

	let index = 0;

	for (; index < length; index += 1) {
		data.html += getPartial(data, data.strings[index], data.expressions[index]);
	}

	return data.html;
}

function getPartial(
	data: BloomData,
	prefix: string,
	expression: unknown,
): string {
	if (expression == null) {
		return prefix;
	}

	if (
		typeof expression === 'function' ||
		expression instanceof Node ||
		isBloom(expression)
	) {
		data.values.push(expression);

		return `${prefix}<!--bloom.${data.values.length - 1}-->`;
	}

	if (Array.isArray(expression)) {
		const {length} = expression;

		let html = '';
		let index = 0;

		for (; index < length; index += 1) {
			html += getPartial(data, '', expression[index]);
		}

		return `${prefix}${html}`;
	}

	return `${prefix}${expression}`;
}
