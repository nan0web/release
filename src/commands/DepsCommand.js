import { Command, CommandMessage } from "@nan0web/co"
import FS from "@nan0web/db-fs"
import BaseCommand from "./BaseCommand.js"

/** @typedef {import("@nan0web/test/types/exec/runSpawn").SpawnResult} SpawnResult */

/**
 * @extends {CommandMessage}
 */
export class DepsCommandMessage extends CommandMessage {
}

/**
 * @extends {BaseCommand}
 */
export default class PublishCommand extends BaseCommand {
	static Message = DepsCommandMessage

	constructor(input = {}) {
		super({
			name: "deps",
			help: "Check dependencies to avoid publishing workspace:*, link:..",
			...input
		})
		this.addArgument("*", String, "", "Fix command")
	}

	/**
	 * @docs
	 * # `nan0release publish`
	 *
	 * Publishes current package to NPM and creates Git tags.
	 *
	 * Steps performed:
	 * - Verifies no uncommitted changes
	 * - Pulls latest changes
	 * - Runs build and test scripts
	 * - Creates Git tag if not exists
	 * - Publishes to NPM registry
	 * - Pushes changes and tags
	 *
	 * ```bash
	 * nan0release publish
	 * ```
	 * @param {DepsCommandMessage} msg
	 */
	async run(msg) {
		const fs = new FS()
		await fs.connect()

		const category = ["fix"].find(c => msg.args.includes(c))

		const pkg = await fs.loadDocument('package.json', {})
		const deps = {
			devDependencies: pkg?.devDependencies ?? {},
			dependencies: pkg?.dependencies ?? {},
			peerDependencies: pkg?.peerDependencies ?? {},
		}
		const fixes = new Map()
		const fails = new Set()

		const isLocal = ver =>
			["workspace:", "link:"].some(p => String(ver).toLowerCase().startsWith(p))

		const changes = new Map()

		for (const [group, map] of Object.entries(deps)) {
			this.logger.info(`${group} (${Object.keys(map).length} items)`)
			for (const [dep, ver] of Object.entries(map ?? {})) {
				let msg = `${dep}: ${ver}`
				if (isLocal(ver)) {
					this.logger.info("")
					const result = await this._run('npm', ['info', dep, '--json'], 'Unable to retrieve npm info', fs)
					this.logger.cursorUp(1, true)
					try {
						if (result.text.startsWith("{")) {
							const data = JSON.parse(result.text)
							if (data.version) {
								fixes.set(dep, data.version)
								msg += ` → ${data.version}`
							} else {
								fails.add(dep)
								msg += " 404 — not found"
							}
						} else {
							throw new Error("Incorrect response format (not a JSON object)")
						}
					} catch (/** @type {any} */ err) {
						this.logger.error(err.message)
						this.logger.debug(err.stack)
						this.logger.debug(JSON.stringify(result))
					}
					if ("fix" === category && fixes.has(dep)) {
						pkg[group][dep] = fixes.get(dep)
						changes.set(dep, `${group}:${pkg[group][dep]}`)
						this.logger.success(msg)
					} else {
						this.logger.warn(msg)
					}
				} else {
					this.logger.success(msg)
				}
			}
		}

		if (fails.size) {
			this.logger.error(["Some dependencies are not yet published on npm", [...fails].join(", ")].join(": "))
			return
		}

		if (fixes.size && category !== "fix") {
			this.logger.info(
				[
					"You can fix the package.json automatically by using",
					"nan0release deps fix"
				].join(": "))
		}
		if (category === "fix") {
			await fs.saveDocument("package.json", pkg)
			this.logger.success(`Fixes saved in package.json (${changes.size} changes)`)
		}
	}
}
