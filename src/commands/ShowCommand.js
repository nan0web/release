import SubCommand from "./SubCommand.js"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * ShowCommand – prints basic information about the current release
 * (version, creation date, and a short excerpt of the markdown notes).
 *
 * Usage:
 *   release show
 *
 * Options:
 *   --full – dump the whole release.md file
 */
export default class ShowCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("full", Boolean, false, "Show complete release.md")
	}

	/**
	 * Render the release information.
	 *
	 * @param {Object} ctx – command context
	 */
	async run(ctx) {
		if (!this.db) {
			this.logger.error("No DB – cannot locate current release")
			return
		}

		// `cwd` points to the current release directory (see CLI)
		const releaseJsPath = join(this.db.cwd, "release.js")
		const releaseMdPath = join(this.db.cwd, "release.md")

		try {
			const { default: release } = await import(releaseJsPath)
			this.logger.info(`Version      : ${release.version}`)
			this.logger.info(`Created at   : ${release.createdAt.toISOString()}`)
			this.logger.info(`Path         : ${this.db.cwd}`)
		} catch (/** @type {any} */ e) {
			this.logger.warn(`Unable to import release.js – ${e.message}`)
		}

		try {
			const md = await readFile(releaseMdPath, "utf8")
			if (ctx.opts.full) {
				this.logger.info("\n=== release.md ===\n")
				this.logger.info(md)
			} else {
				const firstLine = md.split("\n")[0]
				this.logger.info(`Release note : ${firstLine}`)
			}
		} catch (/** @type {any} */ e) {
			this.logger.warn(`release.md not found – ${e.message}`)
		}
	}
}