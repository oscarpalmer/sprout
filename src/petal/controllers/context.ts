import type {Controller, ControllerConstructor} from './controller';

export type Context = {
	readonly controller: Controller;
	readonly element: Element;
	readonly identifier: string;
};

export function createContext(
	name: string,
	element: Element,
	ctor: ControllerConstructor,
): Context {
	const context = Object.create(null);

	Object.defineProperties(context, {
		element: {
			value: element,
		},
		identifier: {
			value: name,
		},
	});

	const controller = new ctor(context);

	Object.defineProperty(context, 'controller', {
		value: controller,
	});

	controller.connected?.();

	return context;
}
