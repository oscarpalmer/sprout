import {expect, test} from 'bun:test';
import {wait} from '@oscarpalmer/atoms';
import {signal, store, type Signal} from '@oscarpalmer/sentinel';
import {bloom} from '../../src/bloom';

Object.defineProperty(HTMLSelectElement.prototype, 'options', {
	get() {
		return this.querySelectorAll('option');
	},
});

type BooleanAttribute =
	| 'checked'
	| 'disabled'
	| 'hidden'
	| 'inert'
	| 'multiple'
	| 'open'
	| 'readonly'
	| 'required'
	| 'selected';

type BooleanAttributes = Record<BooleanAttribute, Signal<boolean>>;

const attributes = new Set<BooleanAttribute>([
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

const html = bloom;

test('bloom, attribute: any', done => {
	const id = signal<unknown>('id');
	const value = signal<unknown>('value');

	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<input id="${() => id}" value="${() => value}" />`.grow(),
	);

	wait(() => {
		const input = fragment.querySelector('input') as HTMLInputElement;

		expect(input.id).toBe('id');
		expect(input.value).toBe('value');

		id.set('new-id');
		value.set('new-value');

		wait(() => {
			expect(input.id).toBe('new-id');
			expect(input.value).toBe('new-value');

			id.set(null);
			value.set(null);

			wait(() => {
				expect(input.id).toBe('');
				expect(input.value).toBe('');

				done();
			});
		});
	});
});

test('bloom, attribute: boolean', done => {
	const values: BooleanAttributes = {
		checked: signal(false),
		disabled: signal(false),
		hidden: signal(false),
		inert: signal(false),
		multiple: signal(false),
		open: signal(false),
		readonly: signal(false),
		required: signal(false),
		selected: signal(false),
	};

	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<input
	type="checkbox"
	checked="${() => values.checked}"
	disabled="${() => values.disabled}"
	hidden="${() => values.hidden}"
	inert="${() => values.inert}"
>
<input
	type="text"
	readonly="${() => values.readonly}"
	required="${() => values.required}"
>
<select multiple="${() => values.multiple}">
	<option>1</option>
	<option selected="${() => values.selected}">2</option>
</select>
<details open="${() => values.open}">
	<summary>...</summary>
	<p>...</p>
</details>`.grow(),
	);

	wait(() => {
		const checkbox = fragment.querySelector(
			'input[type="checkbox"]',
		) as HTMLInputElement;

		const details = fragment.querySelector('details') as HTMLDetailsElement;
		const select = fragment.querySelector('select') as HTMLSelectElement;

		const text = fragment.querySelector(
			'input[type="text"]',
		) as HTMLInputElement;

		expect(checkbox.checked).toBe(false);
		expect(checkbox.disabled).toBe(false);
		expect(checkbox.hidden).toBe(false);
		expect(checkbox.inert).toBe(false);
		// expect(details.open).toBe(false);
		expect(text.readOnly).toBe(false);
		expect(text.required).toBe(false);
		expect(select.multiple).toBe(false);

		for (const attribute of attributes) {
			values[attribute].set(true);
		}

		wait(() => {
			expect(checkbox.checked).toBe(true);
			expect(checkbox.disabled).toBe(true);
			expect(checkbox.hidden).toBe(true);
			expect(checkbox.inert).toBe(true);
			// expect(details.open).toBe(true);
			expect(text.readOnly).toBe(true);
			expect(text.required).toBe(true);
			expect(select.multiple).toBe(true);

			done();
		});
	});
});

test('bloom, attribute: class', done => {
	const many = signal(false);
	const one = signal(false);

	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<div
	class.basic="${one}"
	class.one="${() => one}"
	class.many.other.classes="${() => many}"
></div>`.grow(),
	);

	wait(() => {
		const div = fragment.querySelector('div') as HTMLDivElement;

		expect(div.classList.contains('basic')).toBe(false);
		expect(div.classList.contains('one')).toBe(false);
		expect(div.classList.contains('many')).toBe(false);
		expect(div.classList.contains('other')).toBe(false);
		expect(div.classList.contains('classes')).toBe(false);

		one.set(true);
		many.set(true);

		wait(() => {
			expect(div.classList.contains('basic')).toBe(false);
			expect(div.classList.contains('one')).toBe(true);
			expect(div.classList.contains('many')).toBe(true);
			expect(div.classList.contains('other')).toBe(true);
			expect(div.classList.contains('classes')).toBe(true);

			done();
		});
	});
});

test('bloom, attribute: data', done => {
	const stored = store({
		a: 1,
		b: true,
		c: ['d', 2, false],
	});

	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<div
	data-basic="${() => true}"
	data-value="${() => stored}"
></div>`.grow(),
	);

	wait(() => {
		const div = fragment.querySelector('div') as HTMLDivElement;

		expect(div.dataset.basic).toBe('true');
		expect(div.dataset.value).toBe('{"a":1,"b":true,"c":["d",2,false]}');

		stored.set('a', 2);
		stored.set('b', false);
		stored.set('c', ['e', 3, true]);

		wait(() => {
			expect(div.dataset.value).toBe('{"a":2,"b":false,"c":["e",3,true]}');

			done();
		});
	});
});

test('bloom, attribute: invalid', done => {
	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<div
	onclick="${() => {}}"
	href="javascript:alert('xss')"
	src="data:text/html"
	xlink:href="data:text/html"
></div>`.grow(),
	);

	wait(() => {
		const div = fragment.querySelector('div') as HTMLDivElement;

		expect(div.getAttribute('onclick')).toBe(null);
		expect(div.getAttribute('href')).toBe(null);
		expect(div.getAttribute('src')).toBe(null);
		expect(div.getAttribute('xlink:href')).toBe(null);

		done();
	});
});

test('bloom, attribute: style', done => {
	const color = signal('red');
	const display = signal('block');
	const fontSize = signal(16);

	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<div
	style.background.blue="${true}"
	style.color="${() => color}"
	style.display="${() => display}"
	style.font-size.px="${() => fontSize}"
></div>`.grow(),
	);

	wait(() => {
		const div = fragment.querySelector('div') as HTMLDivElement;

		expect(div.style.color).toBe('red');
		expect(div.style.display).toBe('block');
		expect(div.style.fontSize).toBe('16px');

		color.set('blue');
		display.set('flex');
		fontSize.set(32);

		wait(() => {
			expect(div.style.color).toBe('blue');
			expect(div.style.display).toBe('flex');

			done();
		});
	});
});
