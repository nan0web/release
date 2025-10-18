export default InitCommand;
/**
 * InitCommand – scaffolds a new release directory with the minimal set of
 * files required for a functional release (release.js, release.md and a
 * placeholder task folder).  The command is deliberately tiny – it only
 * creates the filesystem layout and writes a tiny starter release object.
 *
 * Usage:
 *   release init v1.0.0
 */
declare class InitCommand extends SubCommand {
    /**
     * Run the init process.
     *
     * @param {AppCommandMessage} msg – command context (contains parsed options)
     */
    run(msg: AppCommandMessage): Promise<void>;
}
import SubCommand from "./SubCommand.js";
import AppCommandMessage from "../co/AppCommandMessage.js";
