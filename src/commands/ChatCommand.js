import SubCommand from "./SubCommand.js"
import { appendFile, readFile } from "node:fs/promises"
import { join } from "node:path"
import AppCommandMessage from "../co/AppCommandMessage.js"

/**
 * ChatCommand – writes a message to the release‑wide chat (chat/…/timestamp.username.md)
 *
 * Usage:
 *   release chat write "your message"
 *
 * Options:
 *   --user <string> – username to embed in the filename (defaults to "anonymous")
 */
class ChatCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("user", String, "anonymous", "Chat username")
		this.addOption("write", Boolean, false, "Write a new chat line")
	}

	/**
	 * Run the chat command.
	 *
	 * @param {AppCommandMessage} ctx – command context (contains args and opts)
	 */
	async run(ctx) {
		if (!ctx.opts.write) {
			this.logger.error("No action specified – use --write to add a message")
			return
		}
		if (!this.db) {
			this.logger.error("No DB – cannot locate chat folder")
			return
		}

		const message = ctx.args.join(" ")
		if (!message) {
			this.logger.error("Empty message – nothing to write")
			return
		}

		const now = Date.now()
		const username = /** @type {string} */(ctx.opts.user)
		const chatPath = join(this.db.cwd, "chat", "2025", "08", `${now}.${username}.md`)

		// ensure directory exists
		const dir = chatPath.split("/").slice(0, -1).join("/")
		await import("node:fs/promises").then(m => m.mkdir(dir, { recursive: true }))

		await appendFile(chatPath, message + "\n", "utf8")
		this.logger.success(`Message written to ${chatPath}`)
	}
}

export default ChatCommand