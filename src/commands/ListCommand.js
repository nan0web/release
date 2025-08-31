import SubCommand from "./SubCommand.js"
import { join } from "node:path"
import { createReadStream } from "node:fs"

/**
 * ListCommand – prints a concise list of releases found in the current
 * working directory.  It works against the {@link ReleaseDB} instance
 * passed through the `db` option of the parent CLI.
 *
 * Usage:
 *   release list
 *
 * Options:
 *   --json – output JSON instead of a human‑readable list
 */
export default class ListCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("json", Boolean, false, "Output as JSON")
	}

	/**
	 * Execute the command.
	 *
	 * @param {Object} ctx – command context (contains parsed args)
	 * @returns {Promise<void>}
	 */
	async run(ctx) {
		if (!this.db) {
			this.logger.warn("No database attached – nothing to list")
			return
		}

		const releases = []
		for await (const entry of this.db.findStream("")) {
			// Only keep top‑level release directories (e.g. 1/0/v1.0.0)
			const parts = entry.file.path.split("/")
			if (parts.length === 3 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
				releases.push(entry.file.path)
			}
		}

		if (ctx.opts.json) {
			this.logger.info(JSON.stringify(releases, null, "\t"))
		} else {
			if (releases.length === 0) {
				this.logger.info("No releases found")
			} else {
				this.logger.info("Releases:")
				for (const r of releases) {
					this.logger.info(` • ${r}`)
				}
			}
		}
	}
}