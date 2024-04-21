import {createContext, type Context} from '../controllers/context';
import type {ControllerConstructor} from '../controllers/controller';

type StoredController = {
	constructor: ControllerConstructor;
	instances: Map<Element, Context>;
};

export const controllers = new Map<string, StoredController>();

export function addController(name: string, element: Element): void {
	const controller = controllers.get(name);

	if (controller != null && !controller.instances.has(element)) {
		controller.instances.set(
			element,
			createContext(name, element, controller.constructor),
		);
	}
}

export function createController(
	name: string,
	ctor: ControllerConstructor,
): void {
	if (!controllers.has(name)) {
		controllers.set(name, {
			constructor: ctor,
			instances: new Map(),
		});
	}
}

export function removeController(name: string, element: Element): void {
	const stored = controllers.get(name);

	if (stored == null) {
		return;
	}

	const instance = stored.instances.get(element);

	if (instance == null) {
		return;
	}

	stored.instances.delete(element);

	instance.actions.clear();
	instance.observer.stop();

	instance.controller.disconnected?.();
}
