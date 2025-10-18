#!/usr/bin/env node

import { Command } from '@nan0web/co'
import Logger from '@nan0web/log'
import { resolve } from 'node:path'
import DB from "./db/ReleaseDB.js"
import FS from "@nan0web/db-fs"
import Release from './Release.js'
import ChatCommand from './commands/ChatCommand.js'
import HostCommand from './commands/HostCommand.js'
import InitCommand from './commands/InitCommand.js'
import ListCommand from './commands/ListCommand.js'
import SealCommand from './commands/SealCommand.js'
import ServeCommand from './commands/ServeCommand.js'
import ShowCommand from './commands/ShowCommand.js'
import AppCommandMessage from './co/AppCommandMessage.js'

/**
 * CLI application for release management
 */
export default class ReleaseCLI extends Command {
	static Message = AppCommandMessage
	/** @type {Logger} */
	logger
	/** @type {DB?} */
	db
	/** @type {FS} */
	fs
	/** @type {Record<string, Release>} */
	releases = {}
	/** @type {Release?} */
	current = null

	constructor() {
		super({
			name: 'release',
			help: 'Release management CLI tool'
		})
		this.logger = new Logger({ icons: true })
		this.fs = new FS()
		this.db = null
		this.addOption('releaseDir', String, '.', 'Release dir')
		this.addOption('version', String, '0.0.0', 'Release version')
	}

	/**
	 * @param {string[] | string} argv
	 * @returns {AppCommandMessage}
	 */
	parse(argv = []) {
		return AppCommandMessage.from(super.parse(argv))
	}

	/**
	 * Run CLI application
	 * @param {string[]} argv - Command line arguments
	 * @returns {Promise<void>}
	 */
	async run(argv) {
		const msg = this.parse(argv)
		await this.fs.connect()

		const rootDb = this.fs.extract(/** @type {string} */(msg.opts.releaseDir))

		const indexJs = rootDb.absolute("index.js")
		const currentJs = rootDb.absolute("current.js")
		this.releases = (await import(indexJs)).default
		this.current = (await import(currentJs)).default
		this.logger.info(Object.keys(this.releases).length, "release(s) found")

		const globalOpts = { logger: this.logger }
		this.addSubcommand(new ListCommand(globalOpts))
		this.addSubcommand(new HostCommand(globalOpts))
		this.addSubcommand(new ServeCommand(globalOpts))

		if (this.current) {
			this.logger.info("Current release", this.current.version)
			this.db = DB.from(rootDb.extract(this.current.path))
			await this.db.connect()
			const document = await this.db.loadDocument("release.md")
			const release = new Release({ document, version: this.current.version })
			const currentOpts = { ...globalOpts, db: this.db }
			this.addSubcommand(new InitCommand(currentOpts))
			this.addSubcommand(new ShowCommand(currentOpts))
			this.addSubcommand(new ChatCommand(currentOpts))
			this.addSubcommand(new SealCommand(currentOpts))
		}
		else {
			this.logger.info("Provide a release version")
			this.logger.info(this.generateHelp())
		}
		return
	}

	async loadReleaseFiles() {
		if (!this.db) return
		const stream = this.db.findStream("")
		const started = Date.now()
		for await (const entry of stream) {
			const spent = ((Date.now() - started) / 1000).toFixed(3)
			this.logger.clearLine(this.logger.cursorUp())
			this.logger.info("Loading ..", spent + "s", this.db.data.size, entry.file.path)
		}
		const spent = ((Date.now() - started) / 1000).toFixed(3)
		this.logger.clearLine(this.logger.cursorUp(/** @type {DB} */(this.db).data.size & 1))
		const info = [
			["Loaded in", spent + "s", /** @type {DB} */(this.db).data.size, "document(s)"],
			["", "", /** @type {DB} */(this.db).releases.length, "release(s)"],
		]
		this.logger.table(info, [], { padding: 1 })
	}
}