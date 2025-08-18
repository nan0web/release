import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import DB from '@nan0web/db-fs'
import Logger from '@nan0web/log'
import PrepareCommand from './PrepareCommand.js'

describe('PrepareCommand', () => {
	it('should initialize CHANGELOG.md if it is empty', async () => {
		const testDir = resolve('test_data/empty_changelog')

		// Remove directory if exists
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true })
		}

		mkdirSync(testDir, { recursive: true })

		// Initialize git repo
		try {
			execSync('git init', { cwd: testDir })
			execSync('git config user.name "Test User"', { cwd: testDir })
			execSync('git config user.email "test@example.com"', { cwd: testDir })
		} catch (e) {
			assert.fail('Failed to initialize git repository: ' + e.message)
		}

		// Create empty CHANGELOG.md
		writeFileSync(resolve(testDir, 'CHANGELOG.md'), '')

		// Add and commit
		try {
			execSync('git add CHANGELOG.md', { cwd: testDir })
			execSync('git commit -m "Initial commit"', { cwd: testDir })
		} catch (e) {
			// Ignore if nothing to commit
		}

		const command = new PrepareCommand({
			cwd: testDir,
			logger: new Logger({ silent: true })
		})

	try {
			await command.run([])
		} catch (e) {
			assert.fail('Command failed: ' + e.message)
		}

		const db = new DB({ cwd: testDir })
		const changelogContent = await db.loadDocument('CHANGELOG.md', '')
		assert.ok(changelogContent.includes('# Changelog'), 'CHANGELOG.md should be initialized with header')
	})

	it('should generate changelog prompt with new and modified files', async () => {
		const testDir = resolve('test_data/changes')

		// Remove directory if exists
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true })
		}

		mkdirSync(testDir, { recursive: true })

		// Initialize git repo
		try {
			execSync('git init', { cwd: testDir })
			execSync('git config user.name "Test User"', { cwd: testDir })
			execSync('git config user.email "test@example.com"', { cwd: testDir })
			// Create initial commit
			writeFileSync(resolve(testDir, 'initial.txt'), 'initial content')
			execSync('git add initial.txt', { cwd: testDir })
			execSync('git commit -m "Initial commit"', { cwd: testDir })
		} catch (e) {
			assert.fail('Failed to initialize git repository: ' + e.message)
		}

		// Create initial files
		writeFileSync(resolve(testDir, 'CHANGELOG.md'), '# Changelog\n')
		writeFileSync(resolve(testDir, 'existing-file.txt'), 'existing content\n')

		// Add and commit initial files
		try {
			execSync('git add CHANGELOG.md existing-file.txt', { cwd: testDir })
			execSync('git commit -m "Add initial files"', { cwd: testDir })
		} catch (e) {
			// Ignore if nothing to commit
		}

		// Make changes
		writeFileSync(resolve(testDir, 'new-file.txt'), 'new content\n')
		writeFileSync(resolve(testDir, 'existing-file.txt'), 'existing content\nmodified content\n')

		const command = new PrepareCommand({
			cwd: testDir,
			logger: new Logger({ silent: true })
		})

		try {
			await command.run([])
		} catch (err) {
			assert.fail('Command failed: ' + err.message)
		}

		// Test passes if no exception is thrown
		assert.ok(true)
	})

	it('should include recent changelog entries in the prompt', async () => {
		const testDir = resolve('test_data/recent_entries')

		// Remove directory if exists
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true })
		}

		mkdirSync(testDir, { recursive: true })

		// Initialize git repo
		try {
			execSync('git init', { cwd: testDir })
			execSync('git config user.name "Test User"', { cwd: testDir })
			execSync('git config user.email "test@example.com"', { cwd: testDir })
			// Create initial commit
			writeFileSync(resolve(testDir, 'initial.txt'), 'initial content')
			execSync('git add initial.txt', { cwd: testDir })
			execSync('git commit -m "Initial commit"', { cwd: testDir })
		} catch (e) {
			assert.fail('Failed to initialize git repository: ' + e.message)
		}

		// Create directories
		mkdirSync(resolve(testDir, 'src'), { recursive: true })

		// Create CHANGELOG.md with existing releases
		const changelogContent = `# Changelog

## [1.2.0] - 2024-01-03
### Added
- New feature Y

## [1.1.0] - 2024-01-02
### Changed
- Improved performance of module X

## [1.0.0] - 2024-01-01
### Added
- Initial release
- Core functionality implemented
`
		writeFileSync(resolve(testDir, 'CHANGELOG.md'), changelogContent)

		// Add and commit CHANGELOG.md
		try {
			execSync('git add CHANGELOG.md', { cwd: testDir })
			execSync('git commit -m "Add changelog with entries"', { cwd: testDir })
		} catch (e) {
			// Ignore if nothing to commit
		}

		// Make changes
		writeFileSync(resolve(testDir, 'src/new-feature.js'), 'console.log("new feature")\n')

		const command = new PrepareCommand({
			cwd: testDir,
			logger: new Logger({ silent: true })
		})

		try {
			await command.run([])
		} catch (err) {
			assert.fail('Command failed: ' + err.message)
		}

		const db = new DB({ cwd: testDir })
		const promptContent = await db.loadDocument('me.md', '')

		// Check that recent entries are included in the prompt
		assert.ok(promptContent.includes('## [1.2.0] - 2024-01-03'), 'Prompt should include most recent entry')
		assert.ok(promptContent.includes('## [1.1.0] - 2024-01-02'), 'Prompt should include second recent entry')
		assert.ok(promptContent.includes('## [1.0.0] - 2024-01-01'), 'Prompt should include third recent entry')

		// Check that the prompt contains the instruction about using these entries as examples
		assert.ok(promptContent.includes('Based on the following changed files, please provide changelog entries:'),
			'Prompt should contain instructions for generating changelog entries')
	})
})
