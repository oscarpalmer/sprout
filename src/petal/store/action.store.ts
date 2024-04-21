type Action = {
	callback: (event: Event) => void;
	options: AddEventListenerOptions;
	targets: Set<EventTarget>;
	type: string;
};

export type Actions = {
	add(name: string, element: Element): void;
	clear(): void;
	create(parameters: Parameters): void;
	has(name: string): boolean;
	remove(name: string, element: Element): void;
};

type Parameters = {
	callback: (event: Event) => void;
	name: string;
	options: AddEventListenerOptions;
	target: EventTarget;
	type: string;
};

export function createActions() {
	const actions = new Map<string, Action>();

	const instance = Object.create({
		add(name, element) {
			const action = actions.get(name);

			if (action == null) {
				return;
			}

			action.targets.add(element);

			element.addEventListener(action.type, action.callback, action.options);
		},
		clear() {
			for (const [, action] of actions) {
				for (const target of action.targets) {
					target.removeEventListener(
						action.type,
						action.callback,
						action.options,
					);
				}

				action.targets.clear();
			}

			actions.clear();
		},
		create(parameters) {
			if (!actions.has(parameters.name)) {
				actions.set(parameters.name, {
					callback: parameters.callback,
					options: parameters.options,
					targets: new Set(),
					type: parameters.type,
				});
			}
		},
		has(name) {
			return actions.has(name);
		},
		remove(name, element) {
			const action = actions.get(name);

			if (action == null) {
				return;
			}

			element.removeEventListener(action.type, action.callback);

			action.targets.delete(element);

			if (action.targets.size === 0) {
				actions.delete(name);
			}
		},
	} as Actions);

	return instance;
}
