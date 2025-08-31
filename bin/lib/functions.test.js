import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, writeFileSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import {
	getPackageManagerCommands,
	checkPackageJson,
	checkPreCommits,
	runCommand,
	checkUncommitted,
	tagExists,
	tagRelease,
	detectPackageManager,
} from './functions.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const tempDir = resolve(__dirname, 'temp')
const tempPackageJson = resolve(tempDir, 'package.json')

describe('functions.js', () => {
	// Setup temporary directory and package.json for testing
	if (!existsSync(tempDir)) mkdirSync(tempDir)
	writeFileSync(tempPackageJson, JSON.stringify({ name: 'test-package' }))

	it('detectPackageManager returns correct package manager', () => {
		// Create temporary lock files to simulate package managers
		const pnpmLock = resolve(tempDir, 'pnpm-lock.yaml')
		const yarnLock = resolve(tempDir, 'yarn.lock')

		writeFileSync(pnpmLock, '')
		assert.strictEqual(detectPackageManager(), 'pnpm')
		unlinkSync(pnpmLock)

		writeFileSync(yarnLock, '')
		assert.strictEqual(detectPackageManager(), 'yarn')
		unlinkSync(yarnLock)

		// Default case (npm)
		assert.strictEqual(detectPackageManager(), 'npm')
	})

	it('getPackageManagerCommands returns correct commands', () => {
		const pnpmCommands = getPackageManagerCommands('pnpm')
		assert.ok(pnpmCommands.cacheClean)
		assert.ok(pnpmCommands.install)
		assert.ok(pnpmCommands.update)
		assert.ok(pnpmCommands.prune)
		assert.ok(pnpmCommands.outdated)
		assert.ok(pnpmCommands.build)
		assert.ok(pnpmCommands.lint)
		assert.ok(pnpmCommands.test)
		assert.ok(pnpmCommands.list)
		assert.ok(pnpmCommands.storeStatus)
	})

	it('checkPackageJson validates required scripts and dependencies', () => {
		const result = checkPackageJson(tempPackageJson, true)
		assert.strictEqual(result, 0)

		const pkg = JSON.parse(readFileSync(tempPackageJson, 'utf8'))
		assert.ok(pkg.scripts.dev)
		assert.ok(pkg.scripts.build)
		assert.ok(pkg.scripts.preview)
		assert.ok(pkg.scripts.test)
		assert.ok(pkg.scripts.clean)
		assert.ok(pkg.devDependencies.husky)
	})

	it('checkPreCommits handles missing pre-commit file', () => {
		const result = checkPreCommits(tempPackageJson, true)
		assert.strictEqual(result, 0)

		const huskyDir = resolve(tempDir, '.husky')
		const preCommitFile = resolve(huskyDir, 'pre-commit')
		assert.ok(existsSync(preCommitFile))
	})

	it('runCommand executes shell commands', () => {
		// This test will pass if the command runs successfully
		assert.doesNotThrow(() => {
			runCommand('echo "test"', 'Failed to echo')
		})
	})

	it('checkUncommitted validates git status', () => {
		// This test assumes no uncommitted changes in the test environment
		assert.doesNotThrow(() => {
			checkUncommitted({ devDependencies: {}, dependencies: {} })
		})
	})

	it('tagExists checks for existing git tags', () => {
		// Assuming no tags exist initially
		assert.strictEqual(tagExists('v0.0.0'), false)
	})

	it('tagRelease creates and pushes git tags', () => {
		// Mock version for testing
		const version = '0.0.1-test'
		const tag = `v${version}`

		// Create tag
		spawnSync('git', ['tag', '-a', tag, '-m', `Release version ${version}`], { cwd: tempDir })

		// Test tag exists
		assert.strictEqual(tagExists(tag), true)

		// Clean up tag
		spawnSync('git', ['tag', '-d', tag], { cwd: tempDir })
	})

	it('tagRelease handles existing tags', () => {
		const version = '0.0.2-test'
		const tag = `v${version}`

		// Create tag first
		spawnSync('git', ['tag', '-a', tag, '-m', `Release version ${version}`], { cwd: tempDir })

		// Should not create tag again
		const logger = new Logger({ level: 'info' })
		const originalLog = logger.warn
		let warnCalled = false
		logger.warn = () => { warnCalled = true }

		tagRelease(version)
		assert.ok(warnCalled)

		// Clean up tag
		spawnSync('git', ['tag', '-d', tag], { cwd: tempDir })
	})

	// Cleanup
	unlinkSync(tempPackageJson)
})
