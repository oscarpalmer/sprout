import {handleExternalAttributes} from '../observer/attributes';
import {observeController} from '../observer/controller.observer';
import type {Observer} from '../observer/observer';
import {createActions, type Actions} from '../store/action.store';
import {createData, type Data} from '../store/data.store';
import {createTargets, type Targets} from '../store/target.store';
import type {Controller, ControllerConstructor} from './controller';

export type Context = {
		readonly actions: Actions;
		readonly controller: Controller;
		readonly data: Data;
		readonly element: Element;
		readonly identifier: string;
		readonly observer: Observer;
		readonly targets: Targets;
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
		data: {
			value: createData(name, context),
		},
		element: {
			value: element,
		},
		identifier: {
			value: name,
		},
		targets: {
			value: createTargets(),
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
				data: `data-${name}-data-`,
				input: `data-${name}-input`,
				output: `data-${name}-output`,
				target: `data-${name}-target`,
			}),
		},
	});

	handleExternalAttributes(context);

	controller.connected?.();

	return context;
}
