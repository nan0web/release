import SubCommand from "./SubCommand.js"
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * HostCommand – starts a minimal HTTP server that serves the current
 * release markdown and a tiny JSON status endpoint.
 *
 * Usage:
 *   release host [--port <number>] [--webui]
 */
export default class HostCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("port", Number, 3000, "Port for the HTTP server")
		this.addOption("webui", Boolean, false, "Serve a simple web UI")
	}

	/**
	 * Run the host server.
	 *
	 * @param {Object} ctx – command context
	 */
	async run(ctx) {
		const port = ctx.opts.port
		const releasePath = this.db?.cwd
		if (!releasePath) {
			this.logger.error("No release directory (db.cwd) – cannot host")
			return
		}

		const mdPath = join(releasePath, "release.md")

		const server = createServer(async (req, res) => {
			if (req.url === "/") {
				// simple UI – just render markdown as preformatted text
				try {
					const md = await readFile(mdPath, "utf8")
					const body = ctx.opts.webui
						? `<html><body><pre>${md}</pre></body></html>`
						: md
					res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
					res.end(body)
				} catch (e) {
					res.writeHead(404)
					res.end("release.md not found")
				}
			} else if (req.url === "/status") {
				res.writeHead(200, { "Content-Type": "application/json" })
				res.end(JSON.stringify({ version: ctx.opts.version || "unknown" }))
			} else {
				res.writeHead(404)
				res.end("Not found")
			}
		})

		server.listen(port, () => {
			this.logger.success(`Release hosted at http://localhost:${port}`)
			if (ctx.opts.webui) this.logger.info("Web UI enabled")
		})
	}
}