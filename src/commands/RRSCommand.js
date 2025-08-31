import SubCommand from "./SubCommand.js"
import calculateRRS from "../tools/calculateRRS.js"

/**
 * RRSCommand – calculates and displays the Release Readiness Score
 * for the current project.
 *
 * Usage:
 *   release rrs
 */
class RRSCommand extends SubCommand {
	/**
	 * Execute RRS calculation.
	 *
	 * @param {Object} ctx – command context
	 */
	async run(ctx) {
		if (!this.db) {
			this.logger.error("No DB – cannot locate project root")
			return
		}

		const projectPath = this.db.cwd
		const rrsResult = await calculateRRS(projectPath)

		this.logger.info(`=== Release Readiness Score ===`)
		this.logger.info(`Status: ${rrsResult.status}`)
		this.logger.info(`Score: ${rrsResult.score.total}/424`)
		this.logger.info(`Required: ${rrsResult.score.required}/400`)
		this.logger.info(`Optional: ${rrsResult.score.optional}/24`)

		this.logger.info(`\nCriteria checks:`)
		for (const [criteria, passed] of Object.entries(rrsResult.checks)) {
			const statusIcon = passed ? "✅" : "❌"
			this.logger.info(`  ${statusIcon} ${criteria}`)
		}
	}
}

export default RRSCommand
