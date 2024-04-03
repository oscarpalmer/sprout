import {getHtml} from './html';
import type {Bloom, BloomData} from './models';
import {createNodes, mapNodes} from './node';

export function bloom(
	strings: TemplateStringsArray,
	...expressions: unknown[]
): Bloom {
	const data: BloomData = {
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

export type {Bloom};
