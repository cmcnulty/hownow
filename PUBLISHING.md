# Publishing Checklist

## Pre-Publishing Verification

✅ All tests pass (36/36)
✅ Linting passes
✅ Build succeeds
✅ Example runs successfully
✅ 85% test coverage

## Files Ready for Publishing

The following files will be included in the npm package (see `.npmignore`):

- `dist/` - Compiled JavaScript and TypeScript definitions
- `README.md` - Package documentation
- `LICENSE` - MIT License
- `package.json` - Package metadata
- `CHANGELOG.md` - Version history

## Publishing Steps

### 1. Initial Setup (One Time)

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami
```

### 2. Version Management

Choose the appropriate version bump:

```bash
# Patch release (1.0.0 -> 1.0.1) - bug fixes
npm version patch

# Minor release (1.0.0 -> 1.1.0) - new features, backwards compatible
npm version minor

# Major release (1.0.0 -> 2.0.0) - breaking changes
npm version major
```

This will:
- Update version in package.json
- Create a git commit
- Create a git tag

### 3. Publish to npm

```bash
# Dry run to see what would be published
npm publish --dry-run

# Actually publish (this runs prepublishOnly script automatically)
npm publish
```

The `prepublishOnly` script will automatically:
1. Run ESLint
2. Run all tests
3. Build the package

If any step fails, publishing will be aborted.

### 4. Post-Publishing

```bash
# Push version commit and tag to GitHub
git push && git push --tags

# Verify the package is live
npm view hownow
```

## GitHub Repository Setup

1. Create a new repository at https://github.com/cmcnulty/hownow
2. Push the code:

```bash
cd /Users/charlesm/wrst/hownow
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/cmcnulty/hownow.git
git push -u origin main
```

3. Add topics/tags on GitHub:
   - calculator
   - explainable
   - i18n
   - typescript
   - bignum
   - audit-trail

## Package Name Alternatives

If `hownow` is already taken on npm, consider:

- `@cmcnulty/hownow` (scoped package)
- `calc-hownow`
- `explainable-calc`
- `transparent-calc`

To publish as scoped package:

```bash
# Update package.json name to "@cmcnulty/hownow"
npm publish --access public
```

## Maintenance

### Updating the Package

1. Make changes to source code
2. Add/update tests
3. Update CHANGELOG.md
4. Run `npm run prepublishOnly` to verify
5. Bump version with `npm version [patch|minor|major]`
6. Publish with `npm publish`
7. Push to GitHub with `git push && git push --tags`

### Deprecating a Version

```bash
npm deprecate hownow@1.0.0 "Version 1.0.0 is deprecated. Please upgrade to 1.1.0"
```

### Unpublishing (Only within 72 hours)

```bash
npm unpublish hownow@1.0.0
```

**Note**: Unpublishing is discouraged and only allowed within 72 hours of publishing.

## Support

- Report issues: https://github.com/cmcnulty/hownow/issues
- NPM package: https://www.npmjs.com/package/hownow
- License: MIT
