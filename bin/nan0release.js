#!/usr/bin/env node

import process from "node:process"
import { Command } from "@nan0web/co"
import Logger from '@nan0web/log'
import PublishCommand from "../src/commands/PublishCommand.js"
import DepsCommand from "../src/commands/DepsCommand.js"

class PrefixedLogger extends Logger {
	static name = "nan•release"
	static PREFIXES = {
		norm: Logger.style(PrefixedLogger.name, { bgColor: "magenta", color: "white" }),
		warn: Logger.style(PrefixedLogger.name, { bgColor: "yellow", color: "black" }),
		err: Logger.style(PrefixedLogger.name, { bgColor: "red", color: "white" }),
		success: Logger.style(PrefixedLogger.name, { bgColor: "green", color: "white" }),
	}
	get PREFIXES() {
		return /** @type {typeof PrefixedLogger} */ (this.constructor).PREFIXES
	}
	info(...args) {
		return super.info(this.PREFIXES.norm, ...args, Logger.RESET)
	}
	error(...args) {
		return super.error(this.PREFIXES.err, Logger.RED, ...args, Logger.RESET)
	}
	warn(...args) {
		return super.warn(this.PREFIXES.warn, Logger.YELLOW, ...args, Logger.RESET)
	}
	success(...args) {
		return super.success(this.PREFIXES.success, Logger.GREEN, ...args, Logger.RESET)
	}
	debug(...args) {
		const dimPrefix = Logger.DIM + this.PREFIXES.norm
		return super.debug(dimPrefix, Logger.DIM, ...args, Logger.RESET)
	}
}

const logger = new PrefixedLogger(Logger.detectLevel(process.argv))

const mainCommand = new Command({
	name: PrefixedLogger.name,
	help: "Release utilities for nan0web packages",
	logger,
	subcommands: [
		new DepsCommand({ logger }),
		new PublishCommand({ logger }),
	]
})

async function main(argv = []) {
	const msg = mainCommand.parse(argv.slice(2))
	logger.log(Logger.style(Logger.LOGO, { color: "magenta" }))

	if (msg.subCommand) {
		const cmd = mainCommand.getCommand(msg.subCommand)
		await cmd.run(msg.subCommandMessage)
	} else {
		logger.info(mainCommand.runHelp())
	}
}

main(process.argv).catch(err => {
	logger.error("❌ Unhandled error:", err.message || err)
	if (err.stack) logger.debug(err.stack)
	process.exit(1)
})
