import HowNow from '../dist/index.js';

// Simple translations
const translations = {
    'calc.convertToMonthly': 'Convert annual salary of ${{annual}} to monthly by dividing by 12: ${{result}}',
    'calc.applyTaxRate': 'Apply {{taxRate}}% tax rate to ${{input}}: ${{result}}',
    'calc.addBonus': 'Add bonus of ${{bonus}} to ${{input}}: ${{result}}',
    'calc.finalAmount': 'Final monthly amount: ${{result}}',
};

// Translation helper
function t(key, interpolation = {}) {
    let text = translations[key] || key;
    Object.entries(interpolation).forEach(([varName, value]) => {
        const placeholder = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
        text = text.replace(placeholder, value);
    });
    return text;
}

// Enable debug mode
HowNow.setDebugMode(true);

console.log('='.repeat(60));
console.log('HowNow - Explainable Calculator Example');
console.log('='.repeat(60));
console.log();

// Calculate monthly take-home pay
const annualSalary = 72000;
const taxRate = 0.22;
const monthlyBonus = 500;

const result = new HowNow(annualSalary)
    .as('calc.convertToMonthly', { annual: annualSalary })
    .div(12)
    .as('calc.applyTaxRate', { taxRate: taxRate * 100 })
    .multiply(1 - taxRate)
    .as('calc.addBonus', { bonus: monthlyBonus })
    .add(monthlyBonus)
    .as('calc.finalAmount')
    .round(2);

console.log(`Input: Annual Salary = $${annualSalary.toLocaleString()}`);
console.log(`       Tax Rate = ${taxRate * 100}%`);
console.log(`       Monthly Bonus = $${monthlyBonus.toLocaleString()}`);
console.log();
console.log(`Result: $${result.valueOf().toLocaleString()} per month`);
console.log();
console.log('Calculation Steps:');
console.log('-'.repeat(60));

// Get and display steps
const explanation = result.toDisplayFormat();

// Filter out steps where value doesn't change
const meaningfulSteps = explanation.steps.filter((step, index, array) => {
    if (index > 0) {
        const prevResult = array[index - 1].result;
        const currentResult = step.result;
        if (prevResult === currentResult) return false;
    }
    return true;
});

meaningfulSteps.forEach((step, index) => {
    const stepText = t(step.tokenKey, step.interpolation);
    console.log(`${index + 1}. ${stepText}`);
});

console.log();
console.log('='.repeat(60));
console.log(`Final Result: $${explanation.value.toLocaleString()} per month`);
console.log(`Annual Take-Home: $${(explanation.value * 12).toLocaleString()} per year`);
console.log('='.repeat(60));
