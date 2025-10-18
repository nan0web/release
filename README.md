# @nan0web/release

|Package name|[Status](https://github.com/nan0web/monorepo/blob/main/system.md#написання-сценаріїв)|Documentation|Test coverage|Features|Npm version|
|---|---|---|---|---|---|
 |[@nan0web/release](https://github.com/nan0web/release/) |🟢 `97.1%` |🧪 [English 🏴󠁧󠁢󠁥󠁮󠁧󠁿](https://github.com/nan0web/release/blob/main/README.md)<br />[Українською 🇺🇦](https://github.com/nan0web/release/blob/main/docs/uk/README.md) |🟡 `84.2%` |✅ d.ts 📜 system.md 🕹️ playground |— |

Project management as code, Git-native, GPG-signed, and test-driven.

Unlike traditional project tools that require constant syncing or manual updates,
`@nan0web/release` enforces project structure where:
- Tasks are represented as tests in `.test.js` files.
- Status is tracked via test outcomes.
- Team roles and approvals are stored in structured files.
- All changes are signed, versioned, and composable.

This ensures:
- Clear, automatable project tracking.
- Immutable release notes and retro reflections.
- Zero ambiguity – tasks don't exist unless tested.

## Installation

How to install with pnpm?
```bash
pnpm add @nan0web/release
```

How to install with npm?
```bash
npm install @nan0web/release
```

How to install with yarn?
```bash
yarn add @nan0web/release
```

## CLI Usage

Start by initializing a new release:

How to initialize a new release version?
```bash
release init v1.0.0
```

const cli = new ReleaseCLI()
Show release details:

How to show release information?
```bash
release show [--full]
```

const release = new Release({
version: "v1.0.0",
createdAt: new Date("2025-08-20")
})
console.info(release.version) // v1.0.0
List all releases in the project:

How to list all releases?
```bash
release list [--json]
```

const cli = new ReleaseCLI()
Add a chat message to the current release:

How to write a release chat message?
```bash
release chat write --user alice "Issue with the build pipeline"
```

const cli = new ReleaseCLI()
Host a static server for viewing releases:

How to host release UI?
```bash
release host [--webui] [--port 3000]
```

const cli = new ReleaseCLI()
Serve all release files for local inspection:

How to serve release static assets?
```bash
release serve [--port 8080]
```

const cli = new ReleaseCLI()
Validate release tasks and integrity:

How to validate release tasks?
```bash
release validate [--ignore-fail]
```

const release = new Release({
version: "v1.0.0",
createdAt: new Date("2025-08-20")
})
Seal the release with retro reflection:

How to seal a release?
```bash
release seal [--message "All core APIs are stable and tested"]
```

const cli = new ReleaseCLI()
## Core Concepts

### 1. Release as Object

A `Release` is a structured class containing:
- `version`: release identifier (vX.Y.Z).
- `createdAt`, `startAt`, `planAt`, `completeAt`: datetime milestones.
- `document`: parsed markdown document with structure-aware parsing.

Each property is typed and validated automatically via JSDoc and runtime parsing.

How to instantiate a Release?
```js
import { Release } from '@nan0web/release'
const release = new Release({
	version: "v1.0.0",
	createdAt: "2025-08-20T10:00:00Z"
})
console.info(release.version) // ← v1.0.0
console.info(release.createdAt instanceof Date) // ← true

```
### 2. Release Document Parsing

A `ReleaseDocument` extends `@nan0web/markdown` with:
- Structured parsing of markdown release notes
- Extraction of sections and tasks
- Team and role parsing from markdown frontmatter or code

How to parse release notes markdown into structured data?
```js
import { ReleaseDocument } from '@nan0web/release'
const md = `# v1.0.0 - 2025-08-20

## Overview
Release milestone includes UI polish and core API stabilization.

### Tasks
### Done **Implement core UI design** [ui.core-design]
### InProgress **Fix responsive issues in mobile layout** [ui.mobile-fixes]`

const doc = ReleaseDocument.from(md)
console.info(doc.version) // ← v1.0.0
console.info(doc.date instanceof Date) // ← true
console.info(doc.document.children instanceof Array) // ← true

```
### 3. Person & Team Structures

A `Person` instance includes:
- `name`: HumanName
- `gender`: HumanGender
- `contacts`: array of HumanContact

How to create a Person with typed properties?
```js
import { Person } from '@nan0web/release'
const person = new Person({
	name: ["Alice", "Developer"],
	gender: "female",
	contacts: ["mailto:alice@example.com"]
})
console.info(person.name.firstName) // ← Alice
console.info(person.contacts.length >= 0) // ← true

```
## Architecture: Project Management as Code

This architecture treats tasks as tests, roles as classes, and progress as validated outcomes.

### Task Management

Tasks are registered as `taskId` → `testFilePath` in `ProjectManagement`.
Their status is derived by running `node:test` suites.

How to register and validate tasks as tests?
```js
import { ProjectManagement } from '@nan0web/release'
const pm = new ProjectManagement()
pm.registerTask("task-1", "./tests/task1.test.js")
pm.registerTask("task-2", "./tests/task2.test.js")

const mockResults = {
	passed: ["task-1"],
	failed: [],
	pending: ["task-2"]
}

pm.validateProjectState = async () => mockResults
const results = await pm.validateProjectState()

console.info(results.passed.includes("task-1")) // ← true
console.info(results.pending.includes("task-2")) // ← true

```
### Release Processing

The `ReleaseManager` coordinates releases and validates readiness.
It ensures:
- All registered tests pass
- Version is correctly incremented
- Git tag is applied if all validations succeed

How to execute a release after validation?
```js
import { ReleaseManager, ProjectManagement } from '@nan0web/release'
const pm = new ProjectManagement()
const rm = new ReleaseManager(pm)

rm.calculateVersion = () => "v1.0.1"
rm.publish = async () => true

const result = await rm.executeRelease("patch")
console.info(result.version) // ← v1.0.1
console.info(result.published) // ← true

```
### Changelog Integration

Using `ChangelogTaskManager`, you can:
- Extract task definitions from changelog entries
- Generate corresponding test files
- Automate task progression in CI

How to parse changelog and extract tasks?
```js
import { ChangelogTaskManager } from '@nan0web/release'
const ctm = new ChangelogTaskManager()
const changelog = `# Changelog

## [1.0.0] - 2025-08-20
### Added
- Initial structure [core.init]
- Release notes support [docs.release-notes]`

const tasks = ctm.parseChangelog(changelog)
console.info(Array.isArray(tasks)) // ← true
console.info(tasks.length >= 0) // ← true

```
## Java•Script Features

Uses JSDoc and .d.ts files for autocompletion

## CLI Playground

Try the package in the terminal:

How to run playground demo?
```bash
git clone https://github.com/nan0web/release.git
cd release
pnpm install
pnpm run playground
```

## Project Status

To verify the project is ready, run:

How to check project status before publishing?
```bash
npm test
npm run test:coverage
npm run test:status
```

## Contributing

How to contribute? - [check here](./CONTRIBUTING.md)

## License

How to license ISC? - [check here](./LICENSE)
