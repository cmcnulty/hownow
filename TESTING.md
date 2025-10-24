# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

## Test Coverage

Current test coverage: **85%**

### Coverage Breakdown
- **Statements**: 85.27%
- **Branches**: 77.77%
- **Functions**: 91.42%
- **Lines**: 85.27%

## Test Structure

Tests are organized by functionality:

### Basic Operations
- Creating HowNow instances
- Addition, subtraction, multiplication, division
- Chaining operations

### Rounding Operations
- Floor with/without precision
- Round to precision

### Comparison Operations
- Greater than, less than
- Maximum value selection

### Debug Mode
- Disabled mode (no tracking overhead)
- Enabled mode (step tracking)
- Step metadata and interpolation

### Labeling Methods
- Labels, rollups, steps
- Conditional branching

### Display Format
- Output formatting
- Step collection

### BigNumber Precision
- Decimal precision
- Large numbers
- Very small decimals

### HowNow Operations
- Operations between HowNow instances
- Step merging

## Adding New Tests

When adding new functionality to HowNow:

1. Add tests to `test/HowNow.test.ts`
2. Follow the existing test structure
3. Test both debug mode on and off
4. Include edge cases
5. Run `npm run test:coverage` to ensure coverage doesn't drop

### Example Test Template

```typescript
describe('New Feature', () => {
    it('should do something specific', () => {
        const result = new HowNow(100)
            .newMethod(arg);

        expect(result.valueOf()).toBe(expectedValue);
    });

    describe('with debug mode', () => {
        beforeEach(() => {
            HowNow.setDebugMode(true);
        });

        afterEach(() => {
            HowNow.setDebugMode(false);
        });

        it('should track steps', () => {
            const result = new HowNow(100)
                .as('test.newMethod')
                .newMethod(arg);

            const steps = result.getSteps();
            expect(steps[0].tokenKey).toBe('test.newMethod');
        });
    });
});
```

## Continuous Integration

Before publishing:
```bash
npm run prepublishOnly
```

This will:
1. Run linting
2. Run all tests
3. Build the package

All must pass before the package can be published.
