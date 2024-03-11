export function bloom(
	strings: TemplateStringsArray,
	...expressions: unknown[]
): string {
	const {length} = strings;

	let html = '';
	let index = 0;

	for (; index < length; index += 1) {
		html += `${strings[index]}${expressions[index] ?? ''}`;
	}

	return html;
}
