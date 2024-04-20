import {constructors, type ControllerConstructor} from './controller';
import {run} from './observer';

export function petal(name: string, ctor: ControllerConstructor): void {
	if (constructors.has(name)) {
		throw new Error(`Petal '${name}' already exists`);
	}

	constructors.set(name, ctor);

	run(name);
}

document.addEventListener('DOMContentLoaded', () => {
	run();
});

export {Controller} from './controller';
