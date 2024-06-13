import type {PlainObject} from '@oscarpalmer/atoms/models';
import type {ProperElement} from '../models';

export const booleanAttributes = new Set([
	'checked',
	'disabled',
	'hidden',
	'inert',
	'multiple',
	'open',
	'readonly',
	'required',
	'selected',
]);

const frames = new WeakMap<ProperElement, number>();

export function setBooleanAttribute(
	element: ProperElement,
	name: string,
	value: unknown,
): void {
	(element as unknown as PlainObject)[name] = /^(|true)$/i.test(String(value));
}

export function setSelectedAttribute(element: ProperElement) {
	const select = element.closest('select');

	return (element: ProperElement, name: string, value: unknown) => {
		setBooleanAttribute(element, name, value);

		if (select != null && [...select.options].includes(element as never)) {
			updateSelect(select);
		}
	};
}

function updateSelect(select: HTMLSelectElement): void {
	cancelAnimationFrame(frames.get(select) as never);

	frames.set(
		select,
		requestAnimationFrame(() => {
			select.dispatchEvent(new Event('change', {bubbles: true}));
		}),
	);
}
