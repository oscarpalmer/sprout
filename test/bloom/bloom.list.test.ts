import {expect, test} from 'bun:test';
import {wait} from '@oscarpalmer/atoms';
import {array} from '@oscarpalmer/sentinel';
import {bloom} from '../../src/bloom/index';

const html = bloom;

test('bloom: identify', done => {
	const list = array([
		{
			id: 1,
			value: 'one',
		},
		{
			id: 2,
			value: 'two',
		},
		{
			id: 3,
			value: 'three',
		},
	]);

	const items = list.map(item =>
		html`<li id="id_${item.id}">${item.value}</li>`.identify(item.id),
	);

	const fragment = document.createDocumentFragment();

	fragment.append(html`<ul>${() => items}</ul>`.grow());

	wait(() => {
		const one = fragment.querySelector('#id_1');
		const two = fragment.querySelector('#id_2');
		const three = fragment.querySelector('#id_3');

		expect(fragment.childNodes.length).toBe(1);
		expect(fragment.childNodes[0].childNodes.length).toBe(3);

		list.push({
			id: 4,
			value: 'four',
		});

		wait(() => {
			expect(fragment.childNodes.length).toBe(1);
			expect(fragment.childNodes[0].childNodes.length).toBe(4);

			expect(one).toBe(fragment.querySelector('#id_1'));
			expect(two).toBe(fragment.querySelector('#id_2'));
			expect(three).toBe(fragment.querySelector('#id_3'));

			list.insert(0, {
				id: 5,
				value: 'five',
			});

			wait(() => {
				expect(fragment.childNodes.length).toBe(1);
				expect(fragment.childNodes[0].childNodes.length).toBe(5);

				expect(one).toBe(fragment.querySelector('#id_1'));
				expect(two).toBe(fragment.querySelector('#id_2'));
				expect(three).toBe(fragment.querySelector('#id_3'));

				list.splice(0, 1, {value: 'six'} as never);

				wait(() => {
					expect(fragment.childNodes.length).toBe(1);
					expect(fragment.childNodes[0].childNodes.length).toBe(5);

					expect(one).not.toBe(fragment.querySelector('#id_1'));
					expect(two).not.toBe(fragment.querySelector('#id_2'));
					expect(three).not.toBe(fragment.querySelector('#id_3'));

					list.splice(0, list.length);

					wait(() => {
						expect(fragment.childNodes.length).toBe(1);
						expect(fragment.childNodes[0].childNodes.length).toBe(1);

						expect(fragment.childNodes[0].childNodes[0]).toBeInstanceOf(
							Comment,
						);

						done();
					});
				});
			});
		});
	});
});
