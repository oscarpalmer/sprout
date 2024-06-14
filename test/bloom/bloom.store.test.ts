import {expect, test} from 'bun:test';
import {wait} from '@oscarpalmer/atoms';
import {addEvent} from '../../src/bloom/helpers/event.helper';
import {disableStoredNode, enableStoredNode} from '../../src/bloom/store';

test('bloom: store', done => {
	const element = document.createElement('button');

	const listener = () => {
		value += 1;
	};

	const name = 'click';

	let value = 0;

	addEvent(element, `@${name}`, listener);

	wait(() => {
		for (let index = 0; index < 3; index += 1) {
			element.click();
		}

		wait(() => {
			expect(value).toBe(3);

			disableStoredNode(element);

			wait(() => {
				for (let index = 0; index < 3; index += 1) {
					element.click();
				}

				wait(() => {
					// expect(value).toBe(3);

					enableStoredNode(element);

					wait(() => {
						for (let index = 0; index < 3; index += 1) {
							element.click();
						}

						wait(() => {
							// expect(value).toBe(6);

							done();
						});
					});
				});
			});
		});
	});
});
