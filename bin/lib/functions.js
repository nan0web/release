import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import Logger from '@nan0web/log'

export const GREEN = '\x1b[32m'
export const RESET = '\x1b[0m'
export const OK = '✓'

/**
 * Detect package manager used in the project
 * @returns {string} - Detected package manager (npm, yarn, pnpm)
 */
export function detectPackageManager() {
	if (existsSync('pnpm-lock.yaml')) return 'pnpm'
	if (existsSync('yarn.lock')) return 'yarn'
	if (existsSync('package-lock.json')) return 'npm'

	// Default to npm if no lock file is found
	return 'npm'
}

/**
 * Get package manager specific commands
 * @param {string} packageManager - Package manager name
 * @returns {object} - Commands map
 */
export function getPackageManagerCommands(packageManager) {
	const commands = {
		pnpm: {
			cacheClean: 'pnpm store prune',
			install: 'pnpm install',
			update: 'pnpm update --latest',
			prune: 'pnpm prune',
			outdated: 'pnpm outdated',
			lint: 'pnpm run lint',
			test: 'pnpm run test',
			build: 'pnpm run build',
			clean: 'pnpm run clean',
			publish: 'pnpm publish --access public',
			pushTags: "git push origin --tags",
			push: 'git push',
			list: 'pnpm list',
			storeStatus: 'pnpm store status'
		},
		yarn: {
			cacheClean: 'yarn cache clean',
			install: 'yarn install',
			update: 'yarn upgrade',
			prune: 'yarn autoclean --force',
			outdated: 'yarn outdated',
			lint: 'yarn run lint',
			test: 'yarn run test',
			build: 'yarn run build',
			clean: 'yarn run clean',
			publish: 'yarn publish --access public',
			pushTags: 'git push origin --tags',
			push: 'git push',
			list: 'yarn list',
			storeStatus: null
		},
		npm: {
			cacheClean: 'npm cache clean --force',
			installF: 'npm install',
			update: 'npm update',
			prune: 'npm prune',
			outdated: 'npm outdated',
			lint: 'npm run lint',
			test: 'npm test',
			build: 'npm run build',
			clean: 'npm run clean',
			publish: 'npm publish --access public',
			pushTags: 'git push origin --tags',
			push: 'git push',
			list: 'npm list',
			storeStatus: null
		}
	}
	return commands[packageManager] || commands.npm
}

/**
 * Run shell command
 * @param {string} command - Command to execute
 * @param {string} errorMessage - Error message to show if command fails
 */
export function runCommand(command, errorMessage) {
	const logger = new Logger({ level: 'info' })
	try {
		logger.debug(`Executing command: ${command}`)
		execSync(command, { stdio: 'inherit' })
	} catch (err) {
		logger.error(errorMessage)
		logger.debug(err.stack)
		process.exit(1)
	}
}

/**
 * Check if package.json has required scripts and dependencies
 * @param {string} packageJsonPath - Path to package.json
 * @param {boolean} fix - Whether to attempt fixing issues
 * @returns {number} - Exit code (0 for success)
 */
export function checkPackageJson(packageJsonPath, fix = false) {
	const logger = new Logger({ level: 'info' })
	try {
		const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
		const requiredScripts = ['dev', 'build', 'preview', 'test', 'clean']
		const missingScripts = requiredScripts.filter(script => !pkg.scripts?.[script])

		if (missingScripts.length > 0) {
			logger.warn(`Missing scripts in package.json: ${missingScripts.join(', ')}`)
			if (fix) {
				// Add missing scripts with default commands
				pkg.scripts = pkg.scripts || {}
				missingScripts.forEach(script => {
					switch (script) {
						case 'dev': pkg.scripts.dev = 'vite'; break
						case 'build': pkg.scripts.build = 'vite build'; break
						case 'preview': pkg.scripts.preview = 'vite preview'; break
						case 'test': pkg.scripts.test = 'vitest'; break
						case 'clean': pkg.scripts.clean = 'rm -rf dist'; break
					}
				})
				writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
				logger.info(`Fixed missing scripts in package.json`)
			} else {
				return 1
			}
		}

		// Check for husky dependency
		if (!pkg.devDependencies?.husky) {
			logger.warn('Missing husky in devDependencies')
			if (fix) {
				pkg.devDependencies = pkg.devDependencies || {}
				pkg.devDependencies.husky = '^8.0.0'
				writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
				logger.info('Added husky to devDependencies')
			} else {
				return 1
			}
		}
	} catch (err) {
		logger.error(`Failed to check package.json: ${err.message}`)
		logger.debug(err.stack)
		return 1
	}
	return 0
}

/**
 * Check pre-commit hooks
 * @param {string} packageJsonPath - Path to package.json
 * @param {boolean} fix - Whether to attempt fixing issues
 * @returns {number} - Exit code (0 for success)
 */
export function checkPreCommits(packageJsonPath, fix = false) {
	const logger = new Logger({ level: 'info' })
	try {
		const huskyDir = resolve(dirname(packageJsonPath), '.husky')
		const preCommitFile = resolve(huskyDir, 'pre-commit')

		if (!existsSync(preCommitFile)) {
			logger.warn('Missing pre-commit hook file')
			if (fix) {
				if (!existsSync(huskyDir)) {
					mkdirSync(huskyDir)
				}
				writeFileSync(preCommitFile, '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\npnpm run test\n')
				execSync('chmod +x ' + preCommitFile)
				logger.info('Created pre-commit hook file')
			} else {
				return 1
			}
		}
	} catch (err) {
		logger.error(`Failed to check pre-commit hooks: ${err.message}`)
		logger.debug(err.stack)
		return 1
	}
	return 0
}

/**
 * Check for uncommitted changes
 * @param {object} params - Parameters
 * @param {string} params.version - Current version
 * @param {object} params.devDependencies - Development dependencies
 * @param {object} params.dependencies - Production dependencies
 */
export function checkUncommitted({ version, devDependencies, dependencies }) {
	const logger = new Logger({ level: 'info' })
	try {
		execSync('git diff-index --quiet HEAD --', { stdio: 'ignore' })
		execSync('git diff-files --quiet', { stdio: 'ignore' })
	} catch (err) {
		logger.error(`There are uncommitted changes in your repository at version ${version}`)
		logger.debug('Dependencies:', dependencies)
		logger.debug('Dev Dependencies:', devDependencies)
		logger.debug(err.stack)
		process.exit(1)
	}
}

/**
 * Check if git tag exists
 * @param {string} tag - Tag to check
 * @returns {boolean} - Whether tag exists
 */
export function tagExists(tag) {
	try {
		execSync(`git rev-parse ${tag}`, { stdio: 'ignore' })
		return true
	} catch {
		return false
	}
}

/**
 * Tag release in git
 * @param {string} version - Version to tag
 */
export function tagRelease(version) {
	const tag = `v${version}`
	const logger = new Logger({ level: 'info' })

	if (tagExists(tag)) {
		logger.warn(`Tag ${tag} already exists`)
		return
	}

	try {
		execSync(`git tag -a ${tag} -m "Release version ${version}"`, { stdio: 'inherit' })
	} catch (err) {
		logger.error(`Failed to tag release ${tag}`)
		logger.debug(err.stack)
		process.exit(1)
	}
}
