import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import type {PlainObject} from '@oscarpalmer/atoms/models';
import type {Context} from '../controller/context';

export type Data = {
	value: PlainObject;
};

export function createData(identifier: string, context: Context): Data {
	const prefix = `data-${identifier}-data-`;

	const instance = Object.create(null);

	Object.defineProperty(instance, 'value', {
		value: new Proxy(
			{},
			{
				set(target, property, value) {
					const previous = JSON.stringify(Reflect.get(target, property));
					const next = JSON.stringify(value);

					if (Object.is(previous, next)) {
						return true;
					}

					const result = Reflect.set(target, property, value);

					if (result) {
						requestAnimationFrame(() => {
							if (isNullableOrWhitespace(value)) {
								context.element.removeAttribute(`${prefix}${String(property)}`);
							} else {
								context.element.setAttribute(
									`${prefix}${String(property)}`,
									next,
								);
							}
						});
					}

					return result;
				},
			},
		),
	});

	return instance;
}
