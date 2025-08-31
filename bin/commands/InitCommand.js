import { Command } from "@nan0web/co"

export default class InitCommand extends Command {
	constructor() {
		super({
			name: "init",
			help: "Initializes the release version by creating file structure and default release.md"
		})
	}
}
