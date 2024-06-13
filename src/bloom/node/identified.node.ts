import type {Key} from '@oscarpalmer/atoms/models';
import {compareArrayOrder} from '../helpers';
import type {Bloom, IdentifiedNodes} from '../models';
import {disableStoredNode} from '../store';
import {getNodes} from './index';

export function createIdentified(template: Bloom): IdentifiedNodes {
	return {
		identifier: template.id,
		nodes: createIdentifieds(template.grow()).flatMap(item => item.nodes),
	};
}

export function createIdentifieds(value: Node | Node[]): IdentifiedNodes[] {
	return (Array.isArray(value) ? value : [value]).map(item => ({
		nodes: getNodes(item) as ChildNode[],
	}));
}

export function replaceIdentified(
	from: IdentifiedNodes[],
	to: IdentifiedNodes[],
	setNodes: boolean,
) {
	const nodes = from.flatMap(item => item.nodes);

	for (const node of nodes) {
		if (nodes.indexOf(node) === 0) {
			node.before(...to.flatMap(item => item.nodes));
		}

		disableStoredNode(node, true);
	}

	return setNodes ? to : null;
}

export function updateIdentified(
	identified: IdentifiedNodes[],
	identifiers: Key[],
	templates: Bloom[],
): IdentifiedNodes[] {
	const observed: IdentifiedNodes[] = [];

	for (const template of templates) {
		observed.push(
			identified.find(item => item.identifier === template.id) ??
				createIdentified(template),
		);
	}

	const oldIdentifiers = identified.map(item => item.identifier);

	const comparison = compareArrayOrder(
		oldIdentifiers as never,
		identifiers as never,
	);

	let position = identified[0].nodes[0];

	if (comparison !== 'removed') {
		const items = observed.flatMap(item =>
			item.nodes.map(node => ({
				id: item.identifier,
				value: node,
			})),
		);

		const before =
			comparison === 'added' &&
			!oldIdentifiers.includes(observed[0].identifier);

		for (const item of items) {
			if (comparison === 'dissimilar' || !oldIdentifiers.includes(item.id)) {
				if (items.indexOf(item) === 0 && before) {
					position.before(item.value);
				} else {
					position.after(item.value);
				}
			}

			position = item.value;
		}
	}

	const nodes = identified
		.filter(item => !identifiers.includes(item.identifier as never))
		.flatMap(item => item.nodes);

	for (const node of nodes) {
		disableStoredNode(node, true);
	}

	return observed;
}
