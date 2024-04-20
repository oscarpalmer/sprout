import type {Context} from './context';

export const attribute = 'data-petal';

export type ControllerConstructor = new (context: Context) => Controller;

export abstract class Controller {
	get element(): Element {
		return this.context.element;
	}

	get identifier(): string {
		return this.context.identifier;
	}

	constructor(protected readonly context: Context) {}

	abstract connected(): void;

	abstract disconnected(): void;
}
