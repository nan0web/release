# @nan0web/release

A package to manage releases via Git tags and NPM publishing.

## Usage

```bash
npx @nan0web/release [patch|minor|major] [options]
```

### Options

- `--ignore-uncommitted` - Ignore uncommitted changes
- `--ignore-fail-tests` - Continue even if tests fail
- `--ignore-tag` - Skip git tag operations
- `--debug` - Enable debug logging

### Prepare Mode

Generate changelog information for LLM use:

```bash
npx @nan0web/release prepare [options]
```

Options:
- `--laconic` - Generate concise changelog
- `--template <file>` - Use custom template for output

## Examples

```bash
# Standard release (patch version)
npx @nan0web/release

# Release with minor version bump
npx @nan0web/release minor

# Release with debug logging
npx @nan0web/release --debug

# Prepare changelog for LLM
npx @nan0web/release prepare --laconic > changes.md
```

## License

[ISC](./LICENSE)
