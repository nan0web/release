/**
 * ReleaseCLI – UI‑CLI driven entry point that registers the
 * Message‑based release commands.
 *
 * Usage (from terminal):
 *
 *   npx nan0release <subcommand> [options] [args]
 *
 * Subcommands:
 *   init, deps, publish, seal, host, serve, list, validate, chat
 *
 * Each subcommand is a Message class exporting a `run` async generator
 * that yields {@link OutputMessage}s.
 *
 * @module release/cli/ReleaseCLI
 */
import process from "node:process"

import { CLI } from "@nan0web/ui-cli"
import Logger from "@nan0web/log"

// import InitMessage from "../../commands/InitMessage.js"
import DepsCommand from "../../commands/DepsCommand.js"
import PublishCommand from "../../commands/PublishCommand.js"
import DBFS from "@nan0web/db-fs"
// import SealMessage from "../../commands/SealMessage.js"
// import HostMessage from "../../commands/HostMessage.js"
// import ServeMessage from "../../commands/ServeMessage.js"
// import ListMessage from "../../commands/ListMessage.js"
// import ValidateMessage from "../../commands/ValidateMessage.js"
// import ChatMessage from "../../commands/ChatMessage.js"

class ReleaseCLi extends CLI {
	/** @type {DBFS} */
	fs
	constructor(input) {
		super(input)
		const {
			fs,
		} = input
		this.fs = fs ?? DBFS.from({})
	}
}

export default function createReleaseCLI(argv = process.argv.slice(2), logger = new Logger(), fs = {}) {
	const cli = new ReleaseCLi({
		argv,
		commands: {}, // no map‑based commands
		Messages: [
			// InitMessage,
			DepsCommand,
			PublishCommand,
			// SealMessage,
			// HostMessage,
			// ServeMessage,
			// ListMessage,
			// ValidateMessage,
			// ChatMessage,
		],
		logger,
		fs: DBFS.from(fs),
	})
	return cli
}
