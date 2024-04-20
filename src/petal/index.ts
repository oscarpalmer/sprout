import type {ControllerConstructor} from './controllers/controller';
import {observeDocument} from './observer/document.observer';
import {controllers, createController} from './store/controller.store';

const documentObserver = observeDocument();

export function petal(name: string, ctor: ControllerConstructor): void {
	if (controllers.has(name)) {
		throw new Error(`Petal '${name}' already exists`);
	}

	createController(name, ctor);

	documentObserver.update();
}

export {Controller} from './controllers/controller';
