export class PublishCommandOptions {
    /**
     * @param {any} input
     * @returns {PublishCommandOptions}
     */
    static from(input: any): PublishCommandOptions;
    constructor(input?: {});
    /** @type {string} */
    tag: string;
}
/**
 * @extends {CommandMessage}
 */
export class PublishCommandMessage extends CommandMessage {
    constructor(input?: {});
    set opts(arg: PublishCommandOptions);
    /** @returns {PublishCommandOptions} */
    get opts(): PublishCommandOptions;
}
/**
 * @extends {Command}
 */
export default class PublishCommand extends Command {
    static Message: typeof PublishCommandMessage;
    constructor(input?: {});
    /**
     * @docs
     * # `nan0release publish`
     *
     * Publishes current package to NPM and creates Git tags.
     *
     * Steps performed:
     * - Verifies no uncommitted changes
     * - Pulls latest changes
     * - Runs build and test scripts
     * - Creates Git tag if not exists
     * - Publishes to NPM registry
     * - Pushes changes and tags
     *
     * ```bash
     * nan0release publish
     * ```
     * @param {PublishCommandMessage} msg
     */
    run(msg: PublishCommandMessage): Promise<void>;
    #private;
}
import { CommandMessage } from "@nan0web/co";
import { Command } from "@nan0web/co";
