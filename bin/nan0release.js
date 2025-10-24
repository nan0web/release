#!/usr/bin/env node

import process from "node:process"
import { Command } from "@nan0web/co"
import Logger from '@nan0web/log'
import PublishCommand from "../src/commands/PublishCommand.js"

class PrefixedLogger extends Logger {
	static PREFIX = Logger.style("nan0release", { bgColor: "magenta", color: "white" })
	get PREFIX() {
		return /** @type {typeof PrefixedLogger} */ (this.constructor).PREFIX
	}
	info(...args) {
		return super.info(this.PREFIX, ...args)
	}
	error(...args) {
		return super.error(this.PREFIX, ...args)
	}
	warn(...args) {
		return super.warn(this.PREFIX, ...args)
	}
	success(...args) {
		return super.success(this.PREFIX, ...args)
	}
	debug(...args) {
		const dimPrefix = Logger.DIM + this.PREFIX
		return super.debug(dimPrefix, ...args)
	}
}

const logger = new PrefixedLogger(Logger.detectLevel(process.argv))

const mainCommand = new Command({
	name: "nan0release",
	help: "Release utilities for nan0web packages",
	logger,
	subcommands: [
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
