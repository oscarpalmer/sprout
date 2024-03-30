import {createNodes, mapNodes} from './node';

type Data = {
	expressions: unknown[];
	html: string;
	strings: TemplateStringsArray;
	values: unknown[];
};

class Bloom {
	private declare readonly data: Data;

	constructor(strings: TemplateStringsArray, ...expressions: unknown[]) {
		this.data = {
			expressions,
			strings,
			html: '',
			values: [],
		};
	}

	grow(): Node {
		const html = getHtml(this.data);
		const nodes = createNodes(html);

		return mapNodes(this.data.values, nodes);
	}
}

export function bloom(
	strings: TemplateStringsArray,
	...expressions: unknown[]
): Bloom {
	return new Bloom(strings, ...expressions);
}

function getHtml(data: Data): string {
	if (data.html.length > 0) {
		return data.html;
	}

	const {length} = data.strings;

	let index = 0;

	for (; index < length; index += 1) {
		data.html += getPart(data, data.strings[index], data.expressions[index]);
	}

	return data.html;
}

function getPart(data: Data, prefix: string, expression: unknown): string {
	if (expression == null) {
		return prefix;
	}

	if (
		typeof expression === 'function' ||
		expression instanceof Node ||
		expression instanceof Bloom
	) {
		data.values.push(expression);

		return `${prefix}<!--bloom.${data.values.length - 1}-->`;
	}

	if (Array.isArray(expression)) {
		const {length} = expression;

		let html = '';
		let index = 0;

		for (; index < length; index += 1) {
			html += getPart(data, '', expression[index]);
		}

		return `${prefix}${html}`;
	}

	return `${prefix}${expression}`;
}

export function isBloom(value: unknown): value is Bloom {
	return value instanceof Bloom;
}
