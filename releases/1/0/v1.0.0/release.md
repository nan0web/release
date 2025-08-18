# v1.0.0 - 2025-08-18

## PM as a code

Project management as a code is real if you believe and do this way.

## CLI application

### 1. **Git-Native & Version-Controlled Workflow** [git-native]
- Treats project management like code: everything is versioned, auditable, reversible.
- No external tools or databases needed — just Git.
- Natural for developers; lowers barrier to entry for dev-centric teams.

### 2. **Test-Driven Project Progress** [testable]
- Tasks become testable units → Pass/fail defines completion.
- Automates status tracking via CI/CD: "Done" = test passes.
- Enables **automated QA gates in releases** — powerful for regulated environments.

### 3. **Transparent & Predictable Progress Tracking** [status-auto-updated]
- Real-time progress %, ETA, and velocity based on commit history.
- Stats (pending/pass/fail) give immediate visibility.
- No manual updates in Jira/Trello → reduces churn and lies.

### 4. **Integrated Team Communication** [chat]
- Chat per release and per task built into the file structure.
- Chronological, searchable, version-controlled conversations.
- `.cache` allows user-specific read/unread state without central server.

### 5. **Self-Documenting Releases** [docs]
- Release notes are structured, machine-readable, and always up-to-date.
- Markdown + YAML frontmatter allows metadata (e.g., assignees, dates).
- Can generate changelogs, roadmaps, dashboards automatically.

### 6. **Extensible & Composable** [ci-cd]
- Assets (designs, configs, logs) stored with release → full context.
- Scripts, hooks, and templates can be added (e.g., `pre-release.js`, `post-release.sh`).
- Can plug into CI/CD pipelines easily.

### 7. **Offline-First & Decentralized by Design** [offline]
- Works without internet; works even when servers are down.
- No SaaS lock-in — data belongs to the repo.

### 8. **Low Friction for Developers** [base-ide]
- No context switching: no web UI, no login, no separate tools.
- Everything is `git commit`, `nan0release`, `npm test`.
