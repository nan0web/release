import SubCommand from "./SubCommand.js"
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * ServeCommand – runs a tiny static file server that serves all files
 * inside the current release folder.  It is useful for quick local
 * inspection of assets, markdown, and generated test files.
 *
 * Usage:
 *   release serve [--port <number>]
 */
export default class ServeCommand extends SubCommand {
	constructor(options = {}) {
		super(options)
		this.addOption("port", Number, 8080, "Port for static server")
	}

	/**
	 * Start the static server.
	 *
	 * @param {Object} ctx – command context
	 */
	async run(ctx) {
		if (!this.db) {
			this.logger.error("No DB – cannot serve files")
			return
		}

		const root = this.db.cwd
		const port = ctx.opts.port

		const server = createServer(async (req, res) => {
			const safePath = req.url?.split("?")[0] || "/"
			const filePath = join(root, safePath)

			try {
				const data = await readFile(filePath)
				res.writeHead(200)
				res.end(data)
			} catch (_) {
				res.writeHead(404)
				res.end("Not found")
			}
		})

		server.listen(port, () => {
			this.logger.success(`Static server listening on http://localhost:${port}`)
			this.logger.info(`Serving ${root}`)
		})
	}
}