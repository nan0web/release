import { Command } from '@nan0web/co'
import ReleaseDB from '../db/ReleaseDB.js'
import Logger from '@nan0web/log'

class SubCommand extends Command {
	/** @type {Logger} */
	logger
	/** @type {ReleaseDB?} */
	db
	constructor(options = {}) {
		const {
			logger = new Logger(),
			db,
		} = options
		super(options)
		this.logger = Logger.from(logger)
		this.db = db ? ReleaseDB.from(db) : null
	}
}

export default SubCommand