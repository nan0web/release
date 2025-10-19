import { CommandMessage } from "@nan0web/co"
import AppCommandOptions from "./AppCommandOptions.js"

export default class AppCommandMessage extends CommandMessage {
	/** @returns {AppCommandOptions} */
	get opts() {
		return /** @type {AppCommandOptions} */ (super.opts)
	}

	set opts(value) {
		super.opts = value
	}

	/**
	 * @param {*} input
	 * @returns {AppCommandMessage}
	 */
	static from(input) {
		if (input instanceof AppCommandMessage) return input
		return new AppCommandMessage(input)
	}
}
