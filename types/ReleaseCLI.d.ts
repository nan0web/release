#!/usr/bin/env node
/**
 * CLI application for release management
 */
export default class ReleaseCLI extends Command {
    static Message: typeof AppCommandMessage;
    constructor();
    /** @type {DB?} */
    db: DB | null;
    /** @type {FS} */
    fs: FS;
    /** @type {Record<string, Release>} */
    releases: Record<string, Release>;
    /** @type {Release?} */
    current: Release | null;
    /**
     * @param {string[] | string} argv
     * @returns {AppCommandMessage}
     */
    parse(argv?: string[] | string): AppCommandMessage;
    /**
     * Run CLI application
     * @param {string[]} argv - Command line arguments
     * @returns {Promise<void>}
     */
    run(argv: string[]): Promise<void>;
    loadReleaseFiles(): Promise<void>;
}
import { Command } from '@nan0web/co';
import DB from "./db/ReleaseDB.js";
import FS from "@nan0web/db-fs";
import Release from './Release.js';
import AppCommandMessage from './co/AppCommandMessage.js';
