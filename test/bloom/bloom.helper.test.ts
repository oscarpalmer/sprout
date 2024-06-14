import {expect, test} from 'bun:test';
import {bloom} from '../../src/bloom';
import {compareArrayOrder} from '../../src/bloom/helpers';
import {isBloom} from '../../src/bloom/helpers/is.helper';

test('helpers: compareArrayOrder', () => {
	const first = [
		[1, 2, 3],
		[1, 2, 3],
		[1, 2, 3],
	];

	const second = [
		[1, 2, 3, 4],
		[1, 2],
		[0, 2, 4],
	];

	const expected = ['added', 'removed', 'dissimilar'];

	const {length} = first;

	for (let index = 0; index < length; index += 1) {
		expect(compareArrayOrder(first[index], second[index])).toBe(
			expected[index] as never,
		);
	}
});

test('helpers: isBloom', () => {
	const values = [
		undefined,
		null,
		0,
		'',
		{},
		[],
		() => {},
		document.createElement('div'),
		new Map(),
		new Set(),
		bloom`<div></div>`,
	];

	const {length} = values;

	for (let index = 0; index < length; index += 1) {
		expect(isBloom(values[index])).toBe(index === length - 1);
	}
});
