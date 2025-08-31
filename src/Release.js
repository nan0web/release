import ReleaseDocument from "./Release/Document.js"

/**
 * @typedef {Object} ReleaseConfig
 * @property {string} [version] - Release version
 * @property {string | number | Date | undefined} [createdAt] -
 * @property {string | number | Date | undefined} [startAt] -
 * @property {string | number | Date | undefined} [planAt] -
 * @property {string | number | Date | undefined} [completeAt] -
 * @property {string | ReleaseDocument} [document] -
 */

/**
 * Release management class that coordinates task validation and release execution
 */
class Release {
	/** @type {string} */
	version
	/** @type {Date} */
	createdAt
	/** @type {Date?} */
	startAt
	/** @type {Date?} */
	planAt
	/** @type {Date?} */
	completeAt
	// /** @type {Map<string, Function>} */
	/** @type {ReleaseDocument} */
	document
	// tasks

	/**
	 * Creates a Release instance
	 * @param {ReleaseConfig} config - Release configuration
	 */
	constructor(config = {}) {
		const {
			version = '0.0.0',
			createdAt = new Date(),
			startAt,
			planAt,
			completeAt,
			document,
		} = config

		this.version = String(version)
		this.createdAt = new Date(createdAt)
		this.startAt = startAt ? new Date(startAt) : null
		this.planAt = planAt ? new Date(planAt) : null
		this.completeAt = completeAt ? new Date(completeAt) : null
		this.document = ReleaseDocument.from(document)
	}

	get path() {
		return [...this.version.replace("v", "").split(".").slice(0, 2), this.version].join("/")
	}

	/**
	 * Validate release by running all task tests
	 * @returns {Promise<Object>} Validation results
	 */
	async validate() {
		const results = {
			passed: [],
			failed: [],
			pending: []
		}

		for (const [taskId, testFn] of this.tasks.entries()) {
			try {
				await testFn()
				results.passed.push(taskId)
			} catch (error) {
				results.failed.push({ taskId, error: error.message })
			}
		}

		return results
	}

	/**
	 * Execute release process
	 * @param {Object} options - Release options
	 * @param {boolean} [options.ignoreFailTests=false] - Ignore failed tests
	 * @returns {Promise<boolean>} Release success status
	 */
	async execute(options = {}) {
		const { ignoreFailTests = false } = options
		const validation = await this.validate()

		if (!ignoreFailTests && validation.failed.length > 0) {
			this.logger.error(`Release blocked: ${validation.failed.length} tasks failed`)
			for (const failure of validation.failed) {
				this.logger.error(`  ${failure.taskId}: ${failure.error}`)
			}
			return false
		}

		this.logger.info(`Release ${this.version} executed successfully`)
		return true
	}

	/**
	 * Get release progress statistics
	 * @returns {Promise<Object>} Progress statistics
	 */
	async getProgress() {
		const validation = await this.validate()
		const totalTasks = this.tasks.size
		const completedTasks = validation.passed.length
		const failedTasks = validation.failed.length
		const pendingTasks = validation.pending.length

		return {
			version: this.version,
			total: totalTasks,
			completed: completedTasks,
			failed: failedTasks,
			pending: pendingTasks,
			progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
		}
	}
}

export default Release
