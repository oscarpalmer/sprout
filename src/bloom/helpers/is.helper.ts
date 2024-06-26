import type {Bloom} from '../models';

export function isBadAttribute(attribute: Attr): boolean {
	const {name, value} = attribute;

	return (
		/^on/i.test(name) ||
		(/^(href|src|xlink:href)$/i.test(name) &&
			/(data:text\/html|javascript:)/i.test(value))
	);
}

export function isBloom(value: unknown): value is Bloom {
	return (value as Record<string, unknown>)?.$bloom === true;
}
