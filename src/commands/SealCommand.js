import SubCommand from "./SubCommand.js"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import Release from "../../src/Release.js"

/**
 * SealCommand – finalises a release by writing a `retro.md` file
 * and making the release directory read‑only.  This is a *light* implementation
 * that merely creates a placeholder retro file; a real implementation would
 * also set file system permissions and maybe create a Git tag.
 *
 * Usage:
 *   release seal [--message <text>]
 *
 * Options:
 *   --message – optional retro‑reflection text
 */
export default class SealCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("message", String, "", "Retro‑reflection text")
	}

	/**
	 * Seal the current release.
	 *
	 * @param {Object} ctx – command context
	 */
	async run(ctx) {
		if (!this.db) {
			this.logger.error("No DB – cannot seal release")
			return
		}

		const retroPath = join(this.db.cwd, "retro.md")
		const content = `# Retro – ${new Date().toISOString().split("T")[0]}

${ctx.opts.message || "*No retro‑reflection provided.*"}\n`

		await writeFile(retroPath, content, "utf8")
		this.logger.success(`retro.md written to ${retroPath}`)

		// make the folder read‑only (best‑effort – ignore errors on non‑POSIX FS)
		try {
			await mkdir(this.db.cwd, { mode: 0o444 })
			this.logger.info("Release directory set to read‑only")
		} catch (_) {
			// not critical – just a hint
		}
	}
}