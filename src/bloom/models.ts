import type {Effect} from '@oscarpalmer/sentinel';

export type BloomData = {
	expressions: unknown[];
	html: string;
	strings: TemplateStringsArray;
	values: unknown[];
};

export type Bloom = {
	grow(): Node;
};

export type EventData = {
	element: Element;
	listener: EventListener;
} & EventParameters;

export type EventParameters = {
	name: string;
	options: AddEventListenerOptions;
};

export type StoredData = {
	effects: Set<Effect>;
	events: Map<string, Map<EventListener, EventData>>;
};

export type StoredParameters = {
	effect: Effect;
	event: EventData;
};
