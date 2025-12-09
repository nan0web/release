/** @typedef {import("@nan0web/test/types/exec/runSpawn").SpawnResult} SpawnResult */
export default class Command extends UiMessage {
    /**
     * @param {Partial<UiMessage> & {  }} [input={}]
     */
    constructor(input?: Partial<UiMessage> | undefined);
    /** @type {DB} */
    fs: DB;
    /** @type {Logger} */
    logger: Logger;
    get Body(): new () => {};
    /**
     * Run the command.
     * @param {string} cmd
     * @param {string[]} [args=[]]
     * @param {string} [fail=""]
     * @returns {Promise<SpawnResult>}
     * @throws {Error}
     */
    _run(cmd: string, args?: string[] | undefined, fail?: string | undefined): Promise<SpawnResult>;
    /** @returns {AsyncGenerator<OutputMessage>} */
    run(): AsyncGenerator<OutputMessage>;
}
export type SpawnResult = import("@nan0web/test/types/exec/runSpawn").SpawnResult;
import { UiMessage } from "@nan0web/ui";
import DB from "@nan0web/db";
import Logger from "@nan0web/log";
import { OutputMessage } from "@nan0web/co";
