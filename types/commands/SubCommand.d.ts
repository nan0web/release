export default SubCommand;
declare class SubCommand extends Command {
    constructor(options?: {});
    /** @type {ReleaseDB?} */
    db: ReleaseDB | null;
}
import { Command } from '@nan0web/co';
import ReleaseDB from '../db/ReleaseDB.js';
