/** @typedef {import("@nan0web/test/types/exec/runSpawn").SpawnResult} SpawnResult */
/**
 * @extends {CommandMessage}
 */
export class DepsCommandMessage extends CommandMessage {
}
/**
 * @extends {BaseCommand}
 */
export default class PublishCommand extends BaseCommand {
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
     * @param {DepsCommandMessage} msg
     */
    run(msg: DepsCommandMessage): Promise<void>;
}
export type SpawnResult = import("@nan0web/test/types/exec/runSpawn").SpawnResult;
import { CommandMessage } from "@nan0web/co";
import BaseCommand from "./BaseCommand.js";
