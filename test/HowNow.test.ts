import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import HowNow, { Operator } from '../src/HowNow.js';

describe('HowNow', () => {
    describe('Basic Operations', () => {
        it('should create a HowNow instance with initial value', () => {
            const hn = new HowNow(100);
            expect(hn.valueOf()).toBe(100);
        });

        it('should perform addition', () => {
            const result = new HowNow(100).add(50);
            expect(result.valueOf()).toBe(150);
        });

        it('should perform subtraction', () => {
            const result = new HowNow(100).sub(30);
            expect(result.valueOf()).toBe(70);
        });

        it('should perform multiplication', () => {
            const result = new HowNow(100).multiply(2);
            expect(result.valueOf()).toBe(200);
        });

        it('should perform division', () => {
            const result = new HowNow(100).div(4);
            expect(result.valueOf()).toBe(25);
        });

        it('should chain multiple operations', () => {
            const result = new HowNow(100)
                .add(50) // 150
                .multiply(2) // 300
                .sub(50) // 250
                .div(5); // 50
            expect(result.valueOf()).toBe(50);
        });
    });

    describe('Rounding Operations', () => {
        it('should floor with no precision', () => {
            const result = new HowNow(123.456).floor();
            expect(result.valueOf()).toBe(123);
        });

        it('should floor with precision', () => {
            const result = new HowNow(123.456).floor(2);
            expect(result.valueOf()).toBe(123.45);
        });

        it('should round to precision', () => {
            const result = new HowNow(123.456).round(2);
            expect(result.valueOf()).toBe(123.46);
        });

        it('should round down when appropriate', () => {
            const result = new HowNow(123.444).round(2);
            expect(result.valueOf()).toBe(123.44);
        });
    });

    describe('Comparison Operations', () => {
        it('should compare greater than', () => {
            const hn = new HowNow(100);
            expect(hn.gt(50)).toBe(true);
            expect(hn.gt(150)).toBe(false);
        });

        it('should compare less than', () => {
            const hn = new HowNow(100);
            expect(hn.lt(150)).toBe(true);
            expect(hn.lt(50)).toBe(false);
        });

        it('should return maximum value', () => {
            const result = new HowNow(50).max(100);
            expect(result.valueOf()).toBe(100);

            const result2 = new HowNow(150).max(100);
            expect(result2.valueOf()).toBe(150);
        });
    });

    describe('Debug Mode - Disabled', () => {
        beforeEach(() => {
            HowNow.setDebugMode(false);
        });

        it('should not track steps when debug mode is off', () => {
            const result = new HowNow(100).as('test.operation').add(50);

            expect(result.getSteps()).toEqual([]);
        });

        it('should still calculate correctly with debug mode off', () => {
            const result = new HowNow(100)
                .as('test.multiply', { factor: 2 })
                .multiply(2)
                .as('test.add', { amount: 50 })
                .add(50);

            expect(result.valueOf()).toBe(250);
        });
    });

    describe('Debug Mode - Enabled', () => {
        beforeEach(() => {
            HowNow.setDebugMode(true);
        });

        afterEach(() => {
            HowNow.setDebugMode(false);
        });

        it('should track steps when debug mode is on', () => {
            const result = new HowNow(100).as('test.add', { amount: 50 }).add(50);

            const steps = result.getSteps();
            expect(steps.length).toBe(1);
            expect(steps[0].tokenKey).toBe('test.add');
            expect(steps[0].result).toBe(150);
        });

        it('should include interpolation data in steps', () => {
            const result = new HowNow(100).as('test.multiply', { factor: 2 }).multiply(2);

            const steps = result.getSteps();
            expect(steps[0].interpolation).toMatchObject({
                input: 100,
                value: 2,
                result: 200,
                factor: 2,
            });
        });

        it('should track multiple steps', () => {
            const result = new HowNow(100).as('test.add').add(50).as('test.multiply').multiply(2);

            const steps = result.getSteps();
            expect(steps.length).toBe(2);
            expect(steps[0].tokenKey).toBe('test.add');
            expect(steps[1].tokenKey).toBe('test.multiply');
        });

        it('should include operation type in steps', () => {
            const result = new HowNow(100).as('test.add').add(50);
            const steps = result.getSteps();
            expect(steps[0].operation).toBe(Operator.ADD);
        });

        it('should track floor operations', () => {
            const result = new HowNow(123.456).as('test.floor', { precision: 2 }).floor(2);

            const steps = result.getSteps();
            expect(steps[0].tokenKey).toBe('test.floor');
            expect(steps[0].operation).toBe('floor');
            expect(steps[0].metadata).toMatchObject({ precision: 2 });
        });

        it('should track round operations', () => {
            const result = new HowNow(123.456).as('test.round', { precision: 2 }).round(2);

            const steps = result.getSteps();
            expect(steps[0].tokenKey).toBe('test.round');
            expect(steps[0].operation).toBe('round');
        });

        it('should use default token when .as() is not called', () => {
            const result = new HowNow(100).add(50);
            const steps = result.getSteps();
            expect(steps[0].tokenKey).toBe('calc.operation.+');
        });
    });

    describe('Labeling Methods', () => {
        beforeEach(() => {
            HowNow.setDebugMode(true);
        });

        afterEach(() => {
            HowNow.setDebugMode(false);
        });

        it('should add label to current value', () => {
            const result = new HowNow(100).add(50).label('test.total', { year: 2024 });

            const steps = result.getSteps();
            expect(steps[1].tokenKey).toBe('test.total');
            expect(steps[1].metadata).toMatchObject({ year: 2024 });
        });

        it('should rollup intermediate results', () => {
            const result = new HowNow(100).multiply(12).rollUp('test.annual', { year: 2024 });

            const steps = result.getSteps();
            expect(steps[1].tokenKey).toBe('test.annual');
            expect(steps[1].result).toBe(1200);
        });

        it('should add step markers', () => {
            const result = new HowNow(100).add(50).step('test.checkpoint');

            const steps = result.getSteps();
            expect(steps[1].tokenKey).toBe('test.checkpoint');
        });

        it('should handle conditional branching', () => {
            const age = 65;
            const result = new HowNow(1000).branch(age >= 65, 'test.fullBenefit', 'test.reducedBenefit', { age });

            const steps = result.getSteps();
            expect(steps[0].tokenKey).toBe('test.fullBenefit');
        });
    });

    describe('Display Format', () => {
        beforeEach(() => {
            HowNow.setDebugMode(true);
        });

        afterEach(() => {
            HowNow.setDebugMode(false);
        });

        it('should return display format with value and steps', () => {
            const result = new HowNow(100).as('test.add').add(50);

            const display = result.toDisplayFormat();
            expect(display.value).toBe(150);
            expect(display.steps).toHaveLength(1);
        });

        it('should include all calculation steps', () => {
            const result = new HowNow(72000)
                .as('convertToMonthly', { annual: 72000 })
                .div(12)
                .as('applyTax', { rate: 0.15 })
                .multiply(0.85)
                .round(2);

            const display = result.toDisplayFormat();
            expect(display.steps.length).toBeGreaterThan(0);
            expect(display.value).toBe(5100);
        });
    });

    describe('BigNumber Precision', () => {
        it('should handle decimal precision correctly', () => {
            const result = new HowNow(0.1).add(0.2);
            expect(result.valueOf()).toBeCloseTo(0.3, 10);
        });

        it('should handle large numbers', () => {
            const result = new HowNow(999999999999).multiply(2);
            expect(result.valueOf()).toBe(1999999999998);
        });

        it('should handle very small decimals', () => {
            const result = new HowNow(0.00001).multiply(2);
            expect(result.valueOf()).toBe(0.00002);
        });
    });

    describe('HowNow with HowNow operations', () => {
        it('should add two HowNow instances', () => {
            const a = new HowNow(100);
            const b = new HowNow(50);
            const result = a.add(b);
            expect(result.valueOf()).toBe(150);
        });

        it('should multiply HowNow instances', () => {
            const a = new HowNow(10);
            const b = new HowNow(5);
            const result = a.multiply(b);
            expect(result.valueOf()).toBe(50);
        });

        beforeEach(() => {
            HowNow.setDebugMode(true);
        });

        afterEach(() => {
            HowNow.setDebugMode(false);
        });

        it('should merge steps from both HowNow instances', () => {
            const a = new HowNow(100).as('test.base').add(0);
            const b = new HowNow(50).as('test.addition').add(0);
            const result = a.add(b);

            const steps = result.getSteps();
            expect(steps.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('toString', () => {
        it('should return string representation', () => {
            const hn = new HowNow(123.45);
            expect(hn.toString()).toBe('123.45');
        });

        it('should show expression when operations are performed', () => {
            const hn = new HowNow(100).add(50);
            const str = hn.toString();
            expect(str).toContain('150');
        });
    });
});
