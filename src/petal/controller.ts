export const constructors = new Map<string, ControllerConstructor>();
export const controllers = new Map<Element, Set<Controller>>();

export type ControllerConstructor = new (element: Element) => Controller;

export abstract class Controller {
	constructor(readonly element: Element) {}

	abstract connected(): void;

	abstract disconnected(): void;
}
