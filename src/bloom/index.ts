import {createNodes, mapNodes} from './node';

type Data = {
	expressions: unknown[];
	html: string;
	strings: TemplateStringsArray;
	values: unknown[];
};

type Bloom = {
	grow(): Node;
};

export function bloom(
	strings: TemplateStringsArray,
	...expressions: unknown[]
): Bloom {
	const data: Data = {
		expressions,
		strings,
		html: '',
		values: [],
	};

	const instance = Object.create({
		grow(): Node {
			const html = getHtml(data);
			const nodes = createNodes(html);

			return mapNodes(data.values, nodes);
		},
	});

	Object.defineProperty(instance, '$bloom', {
		value: true,
	});

	return instance;
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
			html += getPart(data, '', expression[index]);
		}

		return `${prefix}${html}`;
	}

	return `${prefix}${expression}`;
}

export function isBloom(value: unknown): value is Bloom {
	return (value as any)?.$sentinel === true;
}
