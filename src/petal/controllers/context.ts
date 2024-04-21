import {observeController} from '../observer/controller.observer';
import type {Observer} from '../observer/observer';
import {createActions, type Actions} from '../store/action.store';
import type {Controller, ControllerConstructor} from './controller';

export type Context = {
	readonly actions: Actions;
	readonly controller: Controller;
	readonly element: Element;
	readonly identifier: string;
	readonly observer: Observer;
};

export function createContext(
	name: string,
	element: Element,
	ctor: ControllerConstructor,
): Context {
	const context = Object.create(null);

	Object.defineProperties(context, {
		actions: {
			value: createActions(),
		},
		element: {
			value: element,
		},
		identifier: {
			value: name,
		},
	});

	const controller = new ctor(context);

	Object.defineProperties(context, {
		controller: {
			value: controller,
		},
		observer: {
			value: observeController(context, {
				action: `data-${name}-action`,
			}),
		},
	});

	controller.connected?.();

	return context;
}
