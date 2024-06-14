import {expect, test} from 'bun:test';
import {wait} from '@oscarpalmer/atoms';
import {bloom} from '../../src/bloom';

const html = bloom;

test('bloom: event', done => {
	let many = 0;
	let once = 0;

	const fragment = document.createDocumentFragment();

	fragment.append(
		html`<button
	id="many"
	type="button"
	@click="${() => {
		many += 1;
	}}"
>Many</button>
<button
	id="once"
	type="button"
	@click:once="${() => {
		once += 1;
	}}"
>Many</button>`.grow(),
	);

	wait(() => {
		const manyButton = fragment.querySelector('#many') as HTMLButtonElement;
		const onceButton = fragment.querySelector('#once') as HTMLButtonElement;

		for (let index = 0; index < 3; index += 1) {
			manyButton.click();
			onceButton.click();
		}

		wait(() => {
			expect(many).toBe(3);
			expect(once).toBe(1);

			done();
		});
	});
});
