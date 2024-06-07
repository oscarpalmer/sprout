export function compareArrayOrder(
	first: (number | string)[],
	second: (number | string)[],
): 'added' | 'dissimilar' | 'removed' {
	const firstIsLarger = first.length > second.length;
	const from = firstIsLarger ? first : second;
	const to = firstIsLarger ? second : first;

	if (
		!from
			.filter(key => to.includes(key))
			.every((key, index) => to[index] === key)
	) {
		return 'dissimilar';
	}

	return firstIsLarger ? 'removed' : 'added';
}
