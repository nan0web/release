export class DepsBody {
    static fix: {
        help: string;
        defaultValue: boolean;
    };
    constructor(input?: {});
    /** @type {boolean} */
    fix: boolean;
}
export default class DepsCommand extends Command {
    static name: string;
    static help: string;
    static Body: typeof DepsBody;
    /** @param {Partial<Command> & { body?: Partial<DepsBody> }} [input={}] */
    constructor(input?: (Partial<Command> & {
        body?: Partial<DepsBody> | undefined;
    }) | undefined);
    /** @type {DepsBody} */
    body: DepsBody;
}
import Command from "./Command.js";
