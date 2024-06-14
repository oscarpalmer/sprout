import {expect, test} from 'bun:test';
import {wait} from '@oscarpalmer/atoms';
import {signal} from '@oscarpalmer/sentinel';
import {bloom} from '../../src/bloom/index';

function getHtml(nodes: NodeListOf<ChildNode>): string {
	return [...nodes]
		.map(node => (node instanceof Element ? node.outerHTML : node.textContent))
		.join('');
}

const html = bloom;

test('bloom', done => {
	const first = document.createDocumentFragment();
	const second = document.createDocumentFragment();

	const array = [1, 2, 3];
	const flower = html`<p>bloom</p>`;
	const node = document.createElement('p');
	const sig = signal('hello');

	node.textContent = 'node';

	const template = html`<div>${array}${flower}${node}${() => sig}${true}</div>`;

	first.append(template.grow());

	wait(() => {
		expect(first.childNodes.length).toBe(1);
		expect(first.childNodes[0].childNodes.length).toBe(5);
		expect(first.childNodes[0].textContent).toBe('123bloomnodehellotrue');

		expect(getHtml(first.childNodes)).toBe(
			'<div>123<p>bloom</p><p>node</p>hellotrue</div>',
		);

		second.append(template.grow());

		wait(() => {
			expect(first.childNodes.length).toBe(0);
			expect(getHtml(first.childNodes)).toBe('');

			expect(second.childNodes.length).toBe(1);
			expect(second.childNodes[0].childNodes.length).toBe(5);
			expect(second.childNodes[0].textContent).toBe('123bloomnodehellotrue');

			expect(getHtml(second.childNodes)).toBe(
				'<div>123<p>bloom</p><p>node</p>hellotrue</div>',
			);

			done();
		});
	});
});
