import SubCommand from "./SubCommand.js"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import Release from "../../src/Release.js"

/**
 * ValidateCommand – runs the {@link Release.validate} method for the
 * currently checked‑out release and prints a short summary.
 *
 * Usage:
 *   release validate
 *
 * Options:
 *   --ignore-fail – do not treat failed tasks as a validation error
 */
export default class ValidateCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("ignoreFailTests", Boolean, false, "Ignore failed tests")
	}

	/**
	 * Execute validation.
	 *
	 * @param {Object} ctx – command context
	 */
	async run(ctx) {
		if (!this.db) {
			this.logger.error("No DB – cannot locate current release")
			return
		}

		const releaseJsPath = join(this.db.cwd, "release.js")
		const releaseMdPath = join(this.db.cwd, "release.md")

		let releaseInst
		try {
			const { default: rel } = await import(releaseJsPath)
			releaseInst = rel
		} catch (e) {
			this.logger.error(`Failed to import release.js – ${e.message}`)
			return
		}

		// Attach a mock document – the real implementation would parse markdown
		try {
			const md = await readFile(releaseMdPath, "utf8")
			// Very naïve parsing – just store the raw markdown
			releaseInst.document = md
		} catch (_) {
			// ignore – document is optional for validation
		}

		const result = await releaseInst.validate()
		const { passed, failed, pending } = result

		if (passed.length) this.logger.success(`✅ Passed: ${passed.join(", ")}`)
		if (failed.length) this.logger.error(`❌ Failed: ${failed.map(f => f.taskId).join(", ")}`)
		if (pending.length) this.logger.warn(`● Pending: ${pending.map(p => p.taskId).join(", ")}`)

		if (!ctx.opts.ignoreFailTests && failed.length) {
			this.logger.error(`Validation failed – ${failed.length} tasks did not pass`)
			process.exit(1)
		}
	}
}