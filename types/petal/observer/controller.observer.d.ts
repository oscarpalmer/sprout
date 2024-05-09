import type { Context } from '../controller/context';
import { type Observer } from './observer';
type Attributes = {
    action: string;
    data: string;
    target: string;
};
export declare function observeController(context: Context, attributes: Attributes): Observer;
export {};
