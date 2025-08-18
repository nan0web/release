import { applyFilter, findAllFiles, saveFile, findFilesIn } from "nanoweb-fs"
import { readFileSync, statSync } from "node:fs"
import { resolve, relative } from "node:path"
import { execSync } from "node:child_process"
import { packFiles } from "../functions/pack.js"
import Request from "../../src/apps/core/Request.js"
import Response from "../../src/apps/core/Response.js"
import LLMApp from "../../src/apps/cgi/LLMApp.js"
import TestRunner from "../functions/TestRunner.js"

const binaryFileExtensions = [
	'.png', '.webp', '.avif', '.jpg', '.bmp', '.jpeg', '.gif',
	'.tiff', '.ico', '.svg', '.mp3', '.mp4', '.wav', '.ogg',
	'.flac', '.mkv', '.mov', '.avi', '.wmv', '.zip', '.rar',
	'.7z', '.tar', '.gz', '.pdf', '.exe', '.dll', '.bin',
]

function trimQuotes(str) {
	return str.replace(/^"|"$/g, '')
}

/**
 * Reads a file if it passes the provided filter and is not a binary file.
 * @param {string} filePath - The path to the file.
 * @param {Object} filter - An optional filter to apply.
 * @returns {string|false} - The file content as a string or false if skipped.
 */
function readFile(filePath, filter = {}) {
	// Check if the file is binary
	if (binaryFileExtensions.some(ext => filePath.endsWith(ext))) {
		return '@@ BINARY.FILE @@'
	}

	try {
		// Apply additional filter before reading
		if (applyFilter(filePath, filter)) {
			return readFileSync(filePath, 'utf-8')
		}
	} catch (error) {
		console.warn(`⚠️ Could not read file: ${filePath}`, error.message)
	}

	return false
}

/**
 * Changelog application class.
 * @extends LLMApp
 */
class ChangelogApp extends LLMApp {
	static ROUTES = {
		...LLMApp.ROUTES,
		write: "Generate changelog based on the latest changes",
	}
	static DEFAULT_ROUTE = "write"
	static OPTIONS = {
		...LLMApp.OPTIONS,
		keepComments: {
			type: Boolean, prefix: "--", help: "Keep comments from source files for LLM prompt"
		},
		dry: {
			type: Boolean, prefix: "--", help: "Show all the options without making any requests"
		},
		recentCache: {
			type: Boolean, prefix: "--", help: "Use recent cache instead of making a request",
		},
		sourceDir: {
			type: String, prefix: "-", help: "Source directory to analyze for changes"
		},
		targetFile: {
			type: String, prefix: "-", help: "Target file to save prompt"
		},
		inputTokenLimit: { type: Number, prefix: "-", help: "Token count limit" },
		inputSizeLimit: { type: Number, prefix: "-", help: "Size limit in bytes" },
		ignoreTests: { type: Boolean, prefix: "--", help: "Ignore test files when generating changelog" }
	}

	detectVersion(version) {
		if (Array.isArray(version)) {
			const [v] = version.map(v => this.detectVersion(v)).filter(Boolean)
			return v ?? null
		}
		const arr = String(version).split('\n').map(v => v.trim()).filter(v => v.length > 0)
		for (let i = 0; i < arr.length; i++) {
			const v = arr[i]
			if (v.startsWith('## [')) {
				return v.split(']')[0].replace('## [', '').trim()
			}
		}
		return null
	}

	/**
	 * Trims the end of a string.
	 *
	 * @param {string} text - The string to trim.
	 * @returns {string} - The trimmed string.
	 */
	trimEnd(text) {
		return text.replace(/\s+$/, '');
	}

	extractVersions(changelog) {
		const versions = []
		let intro = ""
		const versionsMap = new Map()
		let currentVersion = null

		if (!changelog) {
			return { intro, versions }
		}

		const rows = changelog.split('\n')

		for (const row of rows) {
			const trimmedRow = row.trim()
			if (trimmedRow.startsWith('## [')) {
				if (currentVersion !== null) {
					const text = this.trimEnd(currentVersion.join('\n'))
					versionsMap.set(this.detectVersion(currentVersion), text)
					versions.push(text)
				}
				currentVersion = [this.trimEnd(row)]
			} else if (currentVersion === null) {
				intro += row + "\n"
			} else {
				currentVersion.push(this.trimEnd(row))
			}
		}

		if (currentVersion !== null) {
			const text = this.trimEnd(currentVersion.join('\n'))
			versionsMap.set(this.detectVersion(currentVersion), text)
			versions.push(text)
		}
		return { intro, versions, versionsMap }
	}

	getChangeLogVersions(sourceDir) {
		const changelogFile = resolve(sourceDir, 'CHANGELOG.md')
		let changelog = ''
		try {
			changelog = readFileSync(changelogFile, 'utf-8')
		} catch (error) {
			console.warn(`⚠️ Could not read CHANGELOG.md: ${error.message}`)
		}

		const { intro, versions, versionsMap } = this.extractVersions(changelog)
		return { intro, versions, versionsMap, changelog }
	}

	/**
	 * Reads the CHANGELOG.md file, extracts recent versions, and formats them for LLM input.
	 * @param {string} sourceDir
	 * @param {number} [messageSize=0]
	 * @param {number} [maxSize=Infinity]
	 * @returns {object} - Recent changelog entries and metadata.
	 * @property {string} prompt - The formatted changelog prompt.
	 * @property {Array<string>} intro - Introductory lines from the changelog.
	 * @property {number} pass - Number of versions added to the prompt.
	 * @property {number} recentCount - Number of recent versions included.
	 * @property {Array<string>} recentVersions - Recent version entries.
	 * @property {Array<string>} versions - All version entries from the changelog.
	 */
	getRecentChangeLog(sourceDir, messageSize = 0, maxSize = Infinity) {
		const { intro, versions, changelog } = this.getChangeLogVersions(sourceDir)

		let prompt = ""
		let pass = 0

		if (!changelog) {
			return { prompt, intro, pass, versions }
		}

		const recentCount = 2
		const recentVersions = versions.slice(0, recentCount)

		for (const version of recentVersions) {
			if (prompt.length + version.length > 9_000 || messageSize + prompt.length > maxSize) {
				break
			}
			++pass
			prompt += version.trim() + '\n'
		}

		return { prompt, intro, pass, recentCount, recentVersions, versions }
	}

	getChangedFiles(sourceDir = this.cwd, ignore = []) {
		const changes = execSync(`git status --porcelain`, { cwd: sourceDir }).toString().split("\n")
		const files = changes.map(line => line.trim()).filter(line => '' !== line).map(file => file.split(' '))
		const newDirs = files.filter(([status]) => '??' === status).map(([_, ...args]) => (args.join(' '))).map(trimQuotes).filter(f => !ignore.includes(f))
		const modifiedFiles = files.filter(([status]) => 'M' === status).map(([_, ...args]) => (args.join(' '))).map(trimQuotes).filter(f => !ignore.includes(f))
		const newFiles = findFilesIn(newDirs).map(f => relative(sourceDir, f))
		const allFiles = [...newFiles, ...modifiedFiles]

		if (allFiles.length === 0) {
			return { files: [], errors: [] }
		}

		const errors = []
		const diffs = {}
		newFiles.forEach(file => {
			try {
				const filePath = resolve(sourceDir, file)
				const stat = statSync(filePath)
				if (stat.isDirectory()) {
					const dirFiles = findAllFiles(filePath, {}, ignore)
					dirFiles.forEach(f => {
						const content = readFile(f, /\.+/)
						if (content) diffs[relative(sourceDir, f)] = content
					})
				} else {
					const content = readFile(filePath, /\.+/)
					if (content) diffs[file] = content
				}
			} catch (error) {
				errors.push({ message: `⚠️ Could not read new file: ${file}`, stack: error.stack })
			}
		})

		modifiedFiles.forEach(file => {
			try {
				const diff = execSync(`git diff -- ${file}`, { cwd: sourceDir }).toString().trim()
				if (diff) diffs[file] = diff
			} catch (error) {
				errors.push({ message: `⚠️ Could not fetch git diff for: ${file}`, stack: error.stack })
			}
		})

		const fileBlocks = Object.entries(diffs).map(([file, content]) => ({
			file,
			content
		}))
		return { files: fileBlocks, errors }
	}

	replaceVersion(versionContent, version, at) {
		const rows = versionContent.split('\n').filter(row => !row.trim().startsWith('## ['))
		rows.unshift(`## [${version}] - ${new Date(at).toISOString().split('T')[0]}`)
		return rows.join('\n')
	}

	mergeVersions(current, target, version = null, at = Date.now()) {
		const c = this.extractVersions(current)
		const t = this.extractVersions(target)
		const v = Array.from(t.versionsMap.keys()).filter(Boolean)
		const getContent = () => {
			const versionContent = t.versionsMap.get(version)
			if (!versionContent) {
				throw new Error(`Version ${version} not found in target changelog.`)
			}
			return versionContent
		}
		let result = []
		if (version) {
			if (v.includes(version)) {
				result.push(this.replaceVersion(getContent(), version, at).trim())
			} else {
				throw new Error(`Version ${version} not found in target changelog.`)
			}
		} else if (v.length > 0) {
			version = v[0]
			if (version.includes(".")) {
				result.push(this.replaceVersion(getContent(), version, at).trim())
			}
		}
		c.versions.forEach((versionContent) => {
			const ver = this.detectVersion(versionContent)
			if (ver !== version) {
				result.push(versionContent.trim())
			}
		})
		return (c.intro + result.join('\n\n')).trim()
	}

	async runTests(res) {
		// Example usage
		const testRunner = new TestRunner(this.cwd)
		const format = new Intl.NumberFormat("en-US").format
		const progress = (data, suffix = "") => {
			res.write(`Testing ✅ ${data.pass} ❗️ ${data.errs} | Files: ✅ ${data.filesPass} ❗️ ${data.filesErr} | ⏰ ${format(data.time)}ms${suffix}`)
		}
		testRunner.on("start", (data) => {
			res.write("Running tests... ")
		})
		testRunner.on("data", (data) => {
			progress(data)
		})
		testRunner.on("error", (error) => {
			if (["Debugger attached.", ""].includes(error.line)) {
				return
			}
			if (error.line) {
				return
			}
			res.error(`⚠️ Tests failed: ${error.message}`)
			res.debug(error.stack)
		})
		testRunner.on("end", (data) => {
			progress(data, data.errs ? "" : ` => ✅ ${data.pass} (${data.filesPass})`)
			if (data.errs > 0) {
				res.error(`⚠️ Tests completed with errors: ${data.errs} failed out of ${data.total}`)
				res.debug(data.stderr.filter(s => "" !== s).join("\n"))
			}
		})
		const ok = await testRunner.run()
		return ok
	}

	/**
	 * Generates changelog by analyzing changed files and sending to LLM.
	 * @param {Request} req - Input request.
	 * @param {Response} res - Output response.
	 * @returns {Promise<Response>} Response.
	 */
	async routeWrite(req, res) {
		const { body, config } = req
		const isDry = body?.opts?.dry
		const sourceDir = body.sourceDir || this.cwd
		const targetFile = body.targetFile

		const { driver, model, config: chatConfig = {} } = this.llmDriverFor(["changelog", "learn", "$default"], config.chat)
		if (driver) {
			await driver.init()
		}

		const inputTokenLimit = body.inputTokenLimit || chatConfig?.maxInput || chatConfig?.maxTokens || model?.maxInput || model?.maxTokens || 32_000
		const inputSizeLimit = body.inputSizeLimit || model?.maxInputBytes || model?.maxBytes || (inputTokenLimit ? inputTokenLimit * 3 : 128_000)
		const ignore = body.i || chatConfig?.resolve?.ignore || ['node_modules', 'dist', 'build', '.min.', { endsWith: '.config.js' }, 'CHANGELOG.md']
		const ignoreTests = body.ignoreTests || chatConfig?.ignoreTests || false

		if (!ignoreTests) {
			const ok = await this.runTests(res)
			if (!ok) {
				res.error("⚠️ Tests failed, cannot proceed with changelog generation.")
				res.info("You can either fix the tests or run this command with --ignoreTests option to skip tests")
				res.info("You can also set ignoreTests to true in the config.")
				return res.send()
			}
		}

		const instructions = this.getInstructions(["coder", "changelog"])
		const id = this.getRequestID()
		let cache = this.loadCache(id)

		if (body.recentCache) {
			const arr = this.listCaches()
			cache = this.loadCache(arr.pop())
			res.info("Loaded cache", id)
		}

		if (false === cache) {
			const { files: fileBlocks, errors = [] } = this.getChangedFiles(sourceDir, ignore)
			errors.forEach(err => {
				res.error(err.message)
				res.debug(err.stack)
			})
			if (0 === fileBlocks.length) {
				res.info(`✅ No new or modified files detected.`)
				return res.send()
			}
			const expectedResponseRate = 0.1
			const { maxInput } = this.getMaxInput(model, chatConfig, body)
			const opts = {
				id, instructions, model, driver,
				maxInput,
				expectedResponseRate,
				resolve: {
					target: chatConfig?.resolve?.target || [this.cwd],
					accept: chatConfig?.resolve?.accept || null,
					ignore: body.i || chatConfig?.resolve?.ignore ||
						chatConfig?.resolve?.skip || ['node_modules', 'dist', 'build', '.min.', { endsWith: '.config.js' }]
				},
				concurrent: chatConfig?.concurrent || 1,
				files: fileBlocks
			}
			const { blocks, tokens, size, iCount } = await this.packRequest(opts)

			this.emit("pack.collected", { id, opts, blocks, iCount, tokens, size, model })

			const recentChangelog = this.getRecentChangeLog(sourceDir, 0, inputSizeLimit)
			const changelogPrompt = recentChangelog.prompt ? `## \n### Recent CHANGELOG.md entries\n#### \`./CHANGELOG.md\`\n\`\`\`md\n${recentChangelog.prompt}\n\`\`\`\n\n` : ''
			for (const block of blocks) {
				let tokens = await this.ensureTokensCount(changelogPrompt, driver)
				block.prompts.push({ prompt: changelogPrompt, size: changelogPrompt.length, tokens })
			}

			if (isDry) {
				res.info("Prompt with attached files and their changes:")
				blocks.forEach(block => {
					res.info(String(block.prompts.filter(block => !block.file).map(p => String(p.prompt)).join("\n\n")))
					res.info("## CONTEXT (only file names for dry mode)")
					res.info("- " + String(block.prompts.filter(block => block.file).map(p => String(p.file)).sort().join("\n- ")))
				})
			} else {
				if (!driver) {
					res.warn("Driver not found")
					if (targetFile) {
						const packed = packFiles(fileBlocks, targetFile, { keepComments: body.opts?.keepComments ?? false })
						const related = packed.map(p => ([relative(sourceDir, p[0]), p[1]]))
						res.info("Packed files into:")
						res.table(related, [], { padding: 3, prefix: "- " })
					} else {
						res.warn("Target file not specified, skipping packing")
					}
					return res.send()
				}
				const chunks = await this.completeChunks(blocks, { driver, model, id, config: chatConfig })
				cache = { id, chunks }
			}
		}

		if (cache && !isDry) {
			await this.unpackChunks({ ...cache, noSave: true })
			const changelogPath = resolve(sourceDir, 'CHANGELOG.md')
			const files = cache.chunks.reduce((acc, chunk) => ({ ...acc, ...this.extract(chunk.response) }), {})
			const newContent = files['./CHANGELOG.md'] || files['CHANGELOG.md']
			if (!newContent) {
				res.warn(`No CHANGELOG.md content found in LLM response`)
				return res.send()
			}

			// const newData = this.extractVersions(newContent)
			const current = this.getChangeLogVersions(sourceDir)
			// git tag -l
			const text = this.mergeVersions(current.changelog, newContent)
			saveFile(changelogPath, text)
			res.info(`Updated ./CHANGELOG.md with new content`)

			if (!ignoreTests) {
				const ok = await this.runTests(res)
				if (!ok) {
					res.error("⚠️ Tests failed after response")
					res.info("Use git command to revert changes")
					res.info("\n  git checkout -- CHANGELOG.md\n")
					return res.send()
				}
			}
		}

		return res.send()
	}
}

export default ChangelogApp
