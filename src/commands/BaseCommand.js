import process from "node:process"
import { Command } from "@nan0web/co"
import FS from "@nan0web/db-fs"
import { runSpawn } from '@nan0web/test'

/** @typedef {import("@nan0web/test/types/exec/runSpawn").SpawnResult} SpawnResult */

/**
 * @extends {Command}
 */
export default class BaseCommand extends Command {
	/**
	 * @param {string} cmd
	 * @param {string[]} args
	 * @param {string} errorMsg
	 * @param {FS} fs
	 * @param {number[]} [okCodes=[0]]
	 * @returns {Promise<SpawnResult>}
	 */
	async _run(cmd, args, errorMsg, fs, okCodes = [0]) {
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

		let cwd = fs.absolute()
		if ("/" === cwd && "." === fs.cwd) cwd = fs.cwd
		this.logger.debug(`% ${cmd} ${args.join(" ")} (${cwd})`)
		const response = await runSpawn(cmd, args, { onData, cwd })

		if (!okCodes.includes(response.code)) {
			this.logger.error(errorMsg)
			process.exit(1)
		}

		this.logger.debug(response.text)
		return response
	}
}
