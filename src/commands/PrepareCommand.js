import { execSync } from 'node:child_process'
import DB from '@nan0web/db-fs'
import Logger from '@nan0web/log'
import { Changelog } from '@nan0web/markdown'
import { Command } from '@nan0web/co'

/**
 * @typedef {Object} PrepareCommandOpts
 * @property {boolean} laconic
 * @property {boolean} descriptive
 * @property {string} template
 */
/**
 * Prepare command class
 */
class PrepareCommand extends Command {
	/** @type {Logger} */
	logger
	/** @type {PrepareCommandOpts}  */
	opts
	/** @type {string} */
	cwd
	/** @type {DB} */
	db

	constructor(options = {}) {
		const {
			logger = new Logger(),
			cwd = ".",
		} = options
		super(options)
		this.logger = Logger.from(logger)
		this.cwd = String(cwd)
		this.options = new Map([
			["laconic", [false, "Generate laconic changelog"]],
			["descriptive", [false, "Generate descriptive changelog"]],
			["template", [String, "Template file or message for a changelog"]],
		])
		this.db = new DB({ cwd: this.cwd })
	}

	/**
	 * Run the prepare command
	 * @param {string[]} args - Command arguments
	 * @returns {Promise<void>}
	 */
	async run(args) {
		let content = await this.db.loadDocument('CHANGELOG.md', '')

		const changelog = new Changelog()
		changelog.parse(content)
		changelog.init()
		const latest = changelog.getLatestVersion()
		const versions = changelog.getVersions()

		// Get git changes
		const changes = this.getGitChanges()

		if (changes.length > 0) {
			const promptContent = await this.generateChangelogPrompt(changes)
			await this.db.writeDocument("me.md", String(promptContent))
		}

		// Save updated changelog
		await this.db.saveDocument('CHANGELOG.md', String(changelog.document))
	}

	/**
	 * Get list of new and modified files from git
	 * @returns {string[]} - Array of file paths
	 */
	getGitChanges() {
		try {
			// Get uncommitted changes
			const statusOutput = execSync('git status --porcelain', {
				cwd: this.cwd,
				encoding: 'utf8'
			})

			const changes = statusOutput
				.split('\n')
				.filter(line => line.trim() !== '')
				.map(line => {
					const parts = line.trim().split(/\s+/)
					return parts[1]
				})

			return changes
		} catch (e) {
			this.logger.warn('Git repository not found or git command failed')
			return []
		}
	}

	/**
	 * Generate changelog prompt from file changes
	 * @param {string[]} changes - Array of changed file paths
	 * @returns {Promise<string>} - Prompt content
	 */
	async generateChangelogPrompt(changes) {
		const fileStats = []
		for (const filePath of changes) {
			try {
				const stat = await this.db.statDocument(filePath)
				fileStats.push({ path: filePath, isFile: stat.isFile })
			} catch {
				fileStats.push({ path: filePath, isFile: false })
			}
		}

		const files = fileStats
			.filter(item => item.isFile)
			.map(item => item.path)

		if (files.length === 0) {
			return ''
		}

		const promptLines = [
			"Based on the following changed files, please provide changelog entries:",
		]

		const diffOutput = execSync('git diff --no-color HEAD', {
			cwd: this.cwd,
			encoding: 'utf8'
		})

		if (diffOutput.trim() !== '') {
			promptLines.push('\n```diff\n' + diffOutput.trim() + '\n```')
		}

		const newFiles = execSync('git ls-files --others --exclude-standard', {
			cwd: this.cwd,
			encoding: 'utf8'
		}).split('\n').filter(line => line.trim() !== '')

		for (const file of newFiles) {
			try {
				const content = await this.db.loadDocumentAs(".txt", file)
				promptLines.push(`\n#### \`${file}\``)
				promptLines.push('```')
				promptLines.push(content)
				promptLines.push('```')
			} catch {
				// ignore files that can't be read
				this.logger.warn("Could not read file", file)
			}
		}

		return promptLines.join('\n')
	}
}

export default PrepareCommand
