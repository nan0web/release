import process from "node:process"
import { Command, CommandMessage } from "@nan0web/co"
import FS from "@nan0web/db-fs"
import { runSpawn } from '@nan0web/test'

export class PublishCommandOptions {
	/** @type {string} */
	tag
	constructor(input = {}) {
		const {
			tag = ""
		} = input
		this.tag = String(tag)
	}
	/**
	 * @param {any} input
	 * @returns {PublishCommandOptions}
	 */
	static from(input) {
		if (input instanceof PublishCommandOptions) return input
		return new PublishCommandOptions(input)
	}
}

/**
 * @extends {CommandMessage}
 */
export class PublishCommandMessage extends CommandMessage {
	/** @type {PublishCommandOptions} */
	opts
	constructor(input = {}) {
		super(input)
		const { opts = {} } = input
		this.opts = PublishCommandOptions.from(opts)
	}
}

/**
 * @extends {Command}
 */
export default class PublishCommand extends Command {
	static Message = PublishCommandMessage

	constructor(input = {}) {
		super({
			name: "publish",
			help: "Publish package to NPM and create Git tag",
			...input
		})
		this.addArgument("*", String, "", "Category of new version: major, minor, patch, or empty.")
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
	 * @param {PublishCommandMessage} msg
	 */
	async run(msg) {
		const fs = new FS()
		await fs.connect()

		const category = ["major", "minor", "patch"].find(c => msg.args.includes(c))
		if (category) {
			await this.#run('npm', ["version", category], "Unable to change version", fs)
		}

		const pkg = await fs.loadDocument('package.json', {})
		const tag = `v${pkg.version}`

		await this.#run('git', ["diff", "--quiet"], 'Uncommitted changes found. Commit or stash first.', fs)

		this.logger.info(`🛜 nan0release: publishing @${pkg.name}@${pkg.version}`)

		await this.#run('git', ["pull"], 'Failed to pull latest changes', fs)
		await this.#run('npm', ["run", "clean"], 'Clean failed', fs)
		await this.#run('npm', ["run", "build"], 'Build failed', fs)
		await this.#run('npm', ["test"], 'Tests failed', fs)

		const tagsResult = await this.#run('git', ["tag"], "Failed to get tags", fs)
		const tags = tagsResult.text.split('\n').filter(Boolean)

		if (!tags.includes(tag)) {
			await this.#run('git', ['tag', '-a', tag, '-m', `Release ${pkg.version}`], 'Tag creation failed', fs)
		} else {
			this.logger.warn(`Tag ${tag} already exists`)
		}

		await this.#run('npm', ['publish', '--access', 'public'], 'Publish to npm failed', fs)

		await this.#run('git', ['push', 'origin', 'main', '--no-verify'], 'Git push failed', fs)
		await this.#run('git', ['push', 'origin', '--tags', '--no-verify'], 'Tag push failed', fs)

		this.logger.success(`@${pkg.name}@${pkg.version} published. Zero becomes script of a life 🌱`)
	}

	/**
	 * @param {string} cmd
	 * @param {string[]} args
	 * @param {string} errorMsg
	 * @param {FS} fs
	 */
	async #run(cmd, args, errorMsg, fs) {
		let content = ""
		const onData = (chunk) => {
			content += String(chunk)
			const rows = content.split("\n").filter(Boolean)
			const recent = rows.slice(-1)
			if (recent.length) {
				this.logger.cursorUp(1, true)
				this.logger.info(recent[0])
			}
		}

		const cwd = fs.absolute()
		const response = await runSpawn(cmd, args, { onData, cwd })

		if (0 !== response.code) {
			this.logger.error(errorMsg)
			process.exit(1)
		}

		return response
	}
}
