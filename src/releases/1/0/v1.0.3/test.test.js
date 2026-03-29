import test from 'node:test'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

test('Release v1.0.3 - Dependency Alignment', async () => {
	const pkgPath = join(process.cwd(), 'package.json')
	const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))

	assert.strictEqual(pkg.version, '1.0.3', 'Version should be 1.0.3')
	assert.strictEqual(pkg.dependencies['@nan0web/ui'], '^1.8.0', '@nan0web/ui should be ^1.8.0')
	assert.strictEqual(pkg.dependencies['@nan0web/ui-cli'], '^2.9.0', '@nan0web/ui-cli should be ^2.9.0')
})
