#!/usr/bin/env node

import { Command } from '@nan0web/co'
import Logger from '@nan0web/log'
import Release from './Release.js'
import DB from '@nan0web/db-fs'
import { resolve } from 'node:path'

/**
 * CLI application for release management
 */
class ReleaseCLI extends Command {
	/** @type {Logger} */
	logger
	/** @type {DB} */
	db

	constructor() {
		super({
			name: 'release',
			help: 'Release management CLI tool'
		})

		this.logger = new Logger()
		this.db = new DB({ cwd: process.cwd() })

		this.addOption('project', String, '.', 'Project path')
		this.addOption('version', String, '0.0.0', 'Release version')
	}

	/**
	 * Run CLI application
	 * @param {string[]} argv - Command line arguments
	 * @returns {Promise<void>}
	 */
	async run(argv) {
		const msg = this.parse(argv)
		const { project, version } = msg.opts

		// For MVP, create a simple release with example tasks
		const release = new Release({
			version,
			projectPath: project,
			tasks: new Map([
				['example-task-1', async () => {
					if (Math.random() > 0.5) throw new Error('Random failure')
				}],
				['example-task-2', async () => {
					// Always pass for demo purposes
				}]
			])
		})

		if (msg.args.length === 0) {
			// Show release progress by default
			const progress = await release.getProgress()
			this.logger.info(`Release ${progress.version} Progress:`)
			this.logger.info(`  Total Tasks: ${progress.total}`)
			this.logger.info(`  Completed: ${progress.completed}`)
			this.logger.info(`  Failed: ${progress.failed}`)
			this.logger.info(`  Pending: ${progress.pending}`)
			this.logger.info(`  Progress: ${progress.progress.toFixed(2)}%`)
			return
		}

		const [action] = msg.args

		switch (action) {
			case 'execute':
				await release.execute({ ignoreFailTests: msg.opts.ignoreFailTests })
				break
			case 'validate':
				const validation = await release.validate()
				this.logger.info('Validation Results:')
				this.logger.info(`  Passed: ${validation.passed.length}`)
				this.logger.info(`  Failed: ${validation.failed.length}`)
				this.logger.info(`  Pending: ${validation.pending.length}`)
				break
			default:
				this.logger.error(`Unknown action: ${action}`)
				this.logger.info(this.generateHelp())
		}
	}
}

// Execute CLI application
const cli = new ReleaseCLI()
cli.run(process.argv.slice(2)).catch(error => {
	console.error(error)
	process.exit(1)
})
