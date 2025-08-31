import { CommandMessage } from "@nan0web/co"
import AppCommandOptions from "./AppCommandOptions.js"

class AppCommandMessage extends CommandMessage {
	/** @type {AppCommandOptions} */
	opts = new AppCommandOptions()
	/**
	 * @param {*} input
	 * @returns {AppCommandMessage}
	 */
	static from(input) {
		if (input instanceof AppCommandMessage) return input
		return new AppCommandMessage(input)
	}
}

export default AppCommandMessage
