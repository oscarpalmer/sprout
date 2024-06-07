import {getHtml} from './html';
import type {Bloom, BloomData} from './models';
import {createFragment, createNodes, mapNodes} from './node/index';
import {disableStoredNode} from './store';

export function bloom(
	strings: TemplateStringsArray,
	...expressions: unknown[]
): Bloom {
	const data: BloomData = {
		expressions,
		strings,
		html: '',
		nodes: [],
		values: [],
	};

	const instance = Object.create({
		grow() {
			this.wither();

			const html = getHtml(data);
			const nodes = createNodes(html);

			data.nodes.push(...mapNodes(data.values, nodes).childNodes);

			return createFragment(data.nodes);
		},
		identify(identifier: number | string) {
			data.identifier ??= identifier;

			return instance;
		},
		wither() {
			const nodes = data.nodes.splice(0);

			for (const node of nodes) {
				disableStoredNode(node, true);
			}

			return this;
		},
	} as Bloom) as Bloom;

	Object.defineProperties(instance, {
		$bloom: {
			get() {
				return true;
			},
		},
		id: {
			get() {
				return data.identifier;
			},
		},
	});

	return instance;
}

export type {Bloom};

