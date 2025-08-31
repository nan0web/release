#!/usr/bin/env node

import ReleaseCLI from '../src/ReleaseCLI.js'

/**
 * Entry point for the release CLI application
 */
const cli = new ReleaseCLI()
cli.run(process.argv.slice(2)).catch(error => {
	console.error(error)
	process.exit(1)
})
