import { Command, CommandMessage } from "@nan0web/co"
import FS from "@nan0web/db-fs"
import BaseCommand from "./BaseCommand.js"

/** @typedef {import("@nan0web/test/types/exec/runSpawn").SpawnResult} SpawnResult */

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
	/** @returns {PublishCommandOptions} */
	get opts() {
		const opts = super.opts
		return PublishCommandOptions.from(opts)
	}
	set opts(value) {
		super.opts = value
	}
	constructor(input = {}) {
		super(input)
	}
}

/**
 * @extends {BaseCommand}
 */
export default class PublishCommand extends BaseCommand {
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
			await this._run('npm', ["version", category], "Unable to change version", fs)
		}

		const pkg = await fs.loadDocument('package.json', {})
		const tag = `v${pkg.version}`

		await this._run('git', ["diff", "--quiet"], 'Uncommitted changes found. Commit or stash first.', fs)

		this.logger.info(`🛜 nan0release: publishing @${pkg.name}@${pkg.version}`)

		await this._run('git', ["pull"], 'Failed to pull latest changes', fs)
		await this._run('npm', ["run", "clean"], 'Clean failed', fs)
		await this._run('npm', ["run", "build"], 'Build failed', fs)
		await this._run('npm', ["test"], 'Tests failed', fs)

		const tagsResult = await this._run('git', ["tag"], "Failed to get tags", fs)
		const tags = tagsResult.text.split('\n').filter(Boolean)

		if (!tags.includes(tag)) {
			await this._run('git', ['tag', '-a', tag, '-m', `Release ${pkg.version}`], 'Tag creation failed', fs)
		} else {
			this.logger.warn(`Tag ${tag} already exists`)
		}

		await this._run('npm', ['publish', '--access', 'public'], 'Publish to npm failed', fs)

		await this._run('git', ['push', 'origin', 'main', '--no-verify'], 'Git push failed', fs)
		await this._run('git', ['push', 'origin', '--tags', '--no-verify'], 'Tag push failed', fs)

		this.logger.success(`${pkg.name}@${pkg.version} published. Zero becomes script of a life 🌱`)
	}
}
