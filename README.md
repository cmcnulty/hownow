# HowNow

**Explainable calculator with internationalization support**

HowNow is a JavaScript library that tracks calculation steps and provides transparent, translatable explanations. Perfect for financial calculators, tax calculations, insurance quotes, or any application where you need to show users "how we got this number."

## Features

- 🔢 **High-precision math** using BigNumber (via mathjs)
- 🌍 **Internationalization-first design** with token-based translations
- 📊 **Step-by-step calculation tracking** with full audit trail
- ⚡ **Zero performance overhead** when debug mode is disabled
- 🎯 **Builder pattern API** for clean, readable code
- 📝 **Rich metadata support** for contextual explanations
- 🔧 **TypeScript support** with full type definitions

## Installation

```bash
npm install hownow
```

## Quick Start

```typescript
import HowNow from 'hownow';

// Enable debug mode to track calculation steps
HowNow.setDebugMode(true);

// Perform calculations with context
const result = new HowNow(72000)
    .as('convertAnnualToMonthly', { annual: 72000 })
    .div(12)
    .as('applyTaxRate', { rate: 0.15 })
    .multiply(0.85)
    .as('roundResult')
    .round(2);

console.log(result.valueOf()); // 5100

// Get detailed explanation
const explanation = result.toDisplayFormat();
console.log(explanation.steps);
/*
[
  {
    tokenKey: 'convertAnnualToMonthly',
    operation: '/',
    inputs: [72000, 12],
    result: 6000,
    metadata: { annual: 72000 },
    interpolation: { input: 72000, value: 12, result: 6000, annual: 72000 }
  },
  {
    tokenKey: 'applyTaxRate',
    operation: '*',
    inputs: [6000, 0.85],
    result: 5100,
    metadata: { rate: 0.15 },
    interpolation: { input: 6000, value: 0.85, result: 5100, rate: 0.15 }
  },
  {
    tokenKey: 'roundResult',
    operation: 'round',
    result: 5100,
    interpolation: { input: 5100, result: 5100 }
  }
]
*/
```

## Internationalization

HowNow is designed for i18n from the ground up. Use token keys instead of English strings:

```typescript
// translations-en.json
{
  "convertAnnualToMonthly": "Convert annual salary of ${{annual}} to monthly: ${{result}}",
  "applyTaxRate": "Apply {{rate}} tax rate to ${{input}} to get ${{result}}",
  "roundResult": "Round to ${{result}}"
}

// translations-es.json
{
  "convertAnnualToMonthly": "Convertir salario anual de ${{annual}} a mensual: ${{result}}",
  "applyTaxRate": "Aplicar tasa de impuesto {{rate}} a ${{input}} para obtener ${{result}}",
  "roundResult": "Redondear a ${{result}}"
}

// In your application
function translate(tokenKey, interpolation) {
  let text = translations[tokenKey];
  Object.entries(interpolation).forEach(([key, value]) => {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return text;
}

explanation.steps.forEach(step => {
  console.log(translate(step.tokenKey, step.interpolation));
});
// Output: "Convert annual salary of $72000 to monthly: $6000"
```

## API Reference

### Core Methods

#### `new HowNow(value)`
Create a new HowNow instance with an initial value.

```typescript
const calc = new HowNow(100);
```

#### `HowNow.setDebugMode(enabled: boolean)`
Enable or disable step tracking globally. When disabled, all tracking operations are no-ops for zero performance overhead.

```typescript
HowNow.setDebugMode(true); // Enable tracking
HowNow.setDebugMode(false); // Disable for production
```

#### `.as(tokenKey: string, metadata?: object)`
Set context for the next operation. This provides a descriptive token key and metadata for the upcoming calculation step.

```typescript
calc.as('applyDiscount', { discountRate: 0.10 }).multiply(0.9);
```

### Math Operations

#### `.add(value)` / `.sub(value)` / `.multiply(value)` / `.div(value)`
Perform basic arithmetic operations.

```typescript
new HowNow(100)
    .add(50)      // 150
    .multiply(2)  // 300
    .sub(50)      // 250
    .div(5);      // 50
```

#### `.floor(precision?)` / `.round(precision)`
Rounding operations.

```typescript
new HowNow(123.456)
    .floor(2)    // 123.45
    .round(1);   // 123.5
```

#### `.max(value)`
Take the maximum of current value and provided value.

```typescript
new HowNow(50).max(100); // 100
```

#### `.gt(value)` / `.lt(value)`
Comparison operations (returns boolean, not HowNow).

```typescript
new HowNow(50).gt(30);  // true
new HowNow(50).lt(100); // true
```

### Labeling Methods

#### `.rollUp(tokenKey, metadata?)`
Mark this value as a named intermediate result.

```typescript
calc.multiply(12).rollUp('annualSalary', { year: 2024 });
```

#### `.label(tokenKey, metadata?)`
Add a label to the current value.

```typescript
calc.round(2).label('finalResult');
```

#### `.step(tokenKey, metadata?)`
Mark a calculation milestone.

```typescript
calc.add(100).step('afterBonus');
```

#### `.branch(condition, trueToken, falseToken, metadata?)`
Conditional labeling based on a boolean condition.

```typescript
const age = 65;
calc.branch(age >= 65, 'fullBenefit', 'reducedBenefit', { age });
```

### Output Methods

#### `.valueOf()`
Get the numeric value.

```typescript
const num = calc.valueOf(); // returns number
```

#### `.toString()`
Get the string representation.

```typescript
const str = calc.toString(); // returns string
```

#### `.toDisplayFormat()`
Get structured output with all calculation steps.

```typescript
const display = calc.toDisplayFormat();
/*
{
  value: 5100,
  steps: [ ... ],
  tables: [ ... ]
}
*/
```

#### `.getSteps()`
Get array of calculation steps.

```typescript
const steps = calc.getSteps(); // returns CalcStep[]
```

## Types

### CalcStep

```typescript
type CalcStep = {
  tokenKey: string;
  operation?: string;
  inputs?: (string | number)[];
  result: number;
  metadata?: Record<string, unknown>;
  interpolation?: Record<string, string | number>;
}
```

### DisplayFormat

```typescript
type DisplayFormat = {
  value: number;
  steps: CalcStep[];
}
```

## Use Cases

### Financial Calculators
Show users exactly how their loan payment, mortgage, or investment returns were calculated.

### Tax Calculators
Provide transparent tax calculations with step-by-step breakdowns.

### Insurance Quotes
Explain premium calculations with all the factors that went into the price.

### Pricing Engines
Show how complex pricing formulas arrive at the final price.

### Regulatory Compliance
Maintain audit trails of calculations for compliance purposes.

### Educational Tools
Help students understand multi-step calculations by showing each step.

## Performance

When debug mode is disabled, HowNow adds virtually zero overhead to your calculations. All tracking logic is gated behind the `debugMode` flag:

```typescript
// Production: disable tracking
HowNow.setDebugMode(false);
const result = new HowNow(100).multiply(2).div(5); // Fast!

// Development/user-facing: enable tracking
HowNow.setDebugMode(true);
const result = new HowNow(100).multiply(2).div(5); // With full audit trail
```

## Examples

See the `/examples` directory for complete examples including:
- Financial calculator with step filtering
- Multi-language support
- React integration
- Complex formula calculations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Charles McNulty

## Related Projects

- Built for and used by [wrs-calculator](https://github.com/cmcnulty/wrs-calculator)
- Uses [mathjs](https://mathjs.org/) for high-precision BigNumber calculations
