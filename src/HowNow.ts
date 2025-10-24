import {
    create,
    addDependencies,
    divideDependencies,
    multiplyDependencies,
    subtractDependencies,
    roundDependencies,
    // evaluateDependencies,
    BigNumber,
} from 'mathjs';

// Create just the functions we need
const math = create(
    {
        addDependencies,
        subtractDependencies,
        multiplyDependencies,
        divideDependencies,
        roundDependencies,
        // evaluateDependencies,
    },
    {
        number: 'BigNumber',
        precision: 16,
        epsilon: 1e-60,
    },
);

export enum Operator {
    ADD = '+',
    SUBTRACT = '-',
    MULTIPLY = '*',
    DIVIDE = '/',
}

type OperatorFunction = (a: OperatorFunctionParam, b: OperatorFunctionParam) => math.BigNumber;
type OperatorFunctionParam = number | BigNumber;
const operatorMap: Record<Operator, OperatorFunction> = {
    [Operator.ADD]: (a: OperatorFunctionParam, b: OperatorFunctionParam) => math.bignumber(a).add(b),
    [Operator.SUBTRACT]: (a: OperatorFunctionParam, b: OperatorFunctionParam) => math.bignumber(a).sub(b),
    [Operator.MULTIPLY]: (a: OperatorFunctionParam, b: OperatorFunctionParam) => math.bignumber(a).mul(b),
    [Operator.DIVIDE]: (a: OperatorFunctionParam, b: OperatorFunctionParam) => math.bignumber(a).div(b),
};

export type CalcStep = {
    tokenKey: string;
    operation?: string;
    inputs?: (string | number)[];
    result: number;
    metadata?: Record<string, unknown>;
    // Values to interpolate into the translated string
    interpolation?: Record<string, string | number>;
};

export type DisplayFormat = {
    value: number;
    steps: CalcStep[];
};

class HowNow {
    private static debugMode: boolean = false;
    private num: BigNumber;
    private expr: string = '';
    private rollUps: Map<string, HowNow> = new Map();
    private metadata: Map<string, unknown> = new Map();
    private steps: CalcStep[] = [];
    private nextOperationToken?: string;
    private nextOperationMetadata?: Record<string, unknown>;

    constructor(num: number | HowNow | BigNumber = 0, expr?: string) {
        this.num = math.bignumber(+num);
        this.expr = expr || num.toString();

        if (HowNow.debugMode && num instanceof HowNow) {
            // Copy steps and metadata from source HowNow
            this.steps = [...num.steps];
            this.metadata = new Map(num.metadata);
        }
    }

    /**
     * Set context for the next operation. This provides a descriptive token key
     * and metadata for the upcoming calculation step.
     * @param tokenKey - i18n token key describing what this operation represents
     * @param metadata - Additional context (rates, factors, years, etc.)
     */
    as(tokenKey: string, metadata?: Record<string, unknown>): HowNow {
        if (HowNow.debugMode) {
            this.nextOperationToken = tokenKey;
            this.nextOperationMetadata = metadata;
        }
        return this;
    }

    static setDebugMode(enabled: boolean): void {
        HowNow.debugMode = enabled;
    }

    valueOf(): number {
        return this.num.toNumber();
    }

    toString(): string {
        return this.expr;
    }

    rollUp(tokenKey: string, metadata?: Record<string, unknown>): HowNow {
        if (HowNow.debugMode) {
            this.expr = `${tokenKey}(${this.valueOf()})`;
            this.rollUps.set(tokenKey, this);

            // Build interpolation for rollUp
            const interpolation: Record<string, string | number> = {
                result: this.valueOf(),
            };
            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        interpolation[key] = value;
                    }
                });
            }

            this.steps.push({
                tokenKey,
                result: this.valueOf(),
                metadata,
                interpolation,
            });
        } else {
            // Keep original behavior when not in debug mode
            this.expr = `${tokenKey}(${this.valueOf()})`;
            this.rollUps.set(tokenKey, this);
        }
        return this;
    }

    wrap(tokenKey: string, metadata?: Record<string, unknown>): HowNow {
        if (HowNow.debugMode) {
            this.expr = `\n\t${tokenKey}(${this.expr})`;
            this.steps.push({
                tokenKey,
                result: this.valueOf(),
                metadata,
            });
        } else {
            // Keep original behavior when not in debug mode
            this.expr = `\n\t${tokenKey}(${this.expr})`;
        }
        return this;
    }

    label(tokenKey: string, metadata?: Record<string, unknown>): HowNow {
        if (HowNow.debugMode) {
            this.expr = `${tokenKey}: ${this.valueOf()}`;

            // Build interpolation for label
            const interpolation: Record<string, string | number> = {
                result: this.valueOf(),
            };
            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        interpolation[key] = value;
                    }
                });
            }

            this.steps.push({
                tokenKey,
                result: this.valueOf(),
                metadata,
                interpolation,
            });
        }
        return this;
    }

    step(tokenKey: string, metadata?: Record<string, unknown>): HowNow {
        if (HowNow.debugMode) {
            this.expr = `[${tokenKey}] ${this.expr}`;
            this.steps.push({
                tokenKey,
                result: this.valueOf(),
                metadata,
            });
        }
        return this;
    }

    addMeta(key: string, value: unknown): HowNow {
        if (HowNow.debugMode) {
            this.metadata.set(key, value);
        }
        return this;
    }

    branch(
        condition: boolean,
        trueTokenKey: string,
        falseTokenKey: string,
        metadata?: Record<string, unknown>,
    ): HowNow {
        if (HowNow.debugMode) {
            const tokenKey = condition ? trueTokenKey : falseTokenKey;
            this.expr = `${tokenKey}: ${this.expr}`;
            this.steps.push({
                tokenKey,
                result: this.valueOf(),
                metadata,
            });
        }
        return this;
    }

    /**
     * Helper to add debug step for unary operations (floor, round, etc.)
     * Reduces code duplication across operation methods
     */
    private addUnaryOperationStep(
        newHowNow: HowNow,
        operation: string,
        result: BigNumber,
        defaultTokenKey: string,
        defaultMetadata?: Record<string, unknown>,
    ): void {
        if (HowNow.debugMode) {
            newHowNow.steps = [...this.steps];

            const tokenKey = this.nextOperationToken || defaultTokenKey;
            const metadata = this.nextOperationMetadata || defaultMetadata;

            const interpolation: Record<string, string | number> = {
                input: this.valueOf(),
                result: result.toNumber(),
            };
            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        interpolation[key] = value;
                    }
                });
            }

            newHowNow.steps.push({
                tokenKey,
                operation,
                result: result.toNumber(),
                metadata,
                interpolation,
            });

            // Clear context
            this.nextOperationToken = undefined;
            this.nextOperationMetadata = undefined;
        }
    }

    private calc(operator: Operator, num: number | HowNow): HowNow {
        const result = operatorMap[operator](this.num, num.valueOf());
        const expr = `(${this.expr} ${operator} ${num.toString()}) = ${result.toString()}`;

        const newHowNow = new HowNow(result, expr);

        if (HowNow.debugMode) {
            newHowNow.steps = [...this.steps];
            if (num instanceof HowNow) {
                newHowNow.steps.push(...num.steps);
            }

            // Use custom token if provided via .as(), otherwise use generic operation token
            const tokenKey = this.nextOperationToken || `calc.operation.${operator}`;
            const metadata = this.nextOperationMetadata;

            // Build interpolation values for the translation
            const interpolation: Record<string, string | number> = {
                input: this.valueOf(),
                value: num.valueOf(),
                result: result.toNumber(),
            };

            // Merge any metadata into interpolation
            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        interpolation[key] = value;
                    }
                });
            }

            newHowNow.steps.push({
                tokenKey,
                operation: operator,
                inputs: [this.valueOf(), num.valueOf()],
                result: result.toNumber(),
                metadata,
                interpolation,
            });

            // Clear the next operation context (it's been used)
            this.nextOperationToken = undefined;
            this.nextOperationMetadata = undefined;
        }

        return newHowNow;
    }

    add(num: number | HowNow): HowNow {
        return this.calc(Operator.ADD, num);
    }
    sub(num: number | HowNow): HowNow {
        return this.calc(Operator.SUBTRACT, num);
    }
    div(num: number | HowNow): HowNow {
        return this.calc(Operator.DIVIDE, num);
    }
    multiply(num: number | HowNow): HowNow {
        return this.calc(Operator.MULTIPLY, num);
    }
    floor(precision?: number): HowNow {
        const expr = `floor(${this.expr})`;
        const result = math
            .bignumber(this.num)
            .mul(math.bignumber(10).pow(precision || 0))
            .floor()
            .div(math.bignumber(10).pow(precision || 0));
        const newHowNow = new HowNow(result.toNumber(), expr);

        this.addUnaryOperationStep(newHowNow, 'floor', result, 'calc.operation.floor', { precision });

        return newHowNow;
    }
    round(precision: number): HowNow {
        const expr = this.expr; // `round(${this.expr}, ${precision})`;
        const result = math.round(this.num, precision);
        const newHowNow = new HowNow(result.toNumber(), expr);

        this.addUnaryOperationStep(newHowNow, 'round', result, 'calc.operation.round', { precision });

        return newHowNow;
    }
    gt(num: number) {
        return math.bignumber(this.num).greaterThan(num);
    }
    lt(num: number) {
        return math.bignumber(this.num).lessThan(num);
    }
    max(num: number) {
        const result = Math.max(this.num.toNumber(), num);
        const expr = `max(${this.expr}, ${num}) = ${result}`;
        const newHowNow = new HowNow(result, expr);

        if (HowNow.debugMode) {
            newHowNow.steps = [...this.steps];
            newHowNow.steps.push({
                tokenKey: 'calc.operation.max',
                operation: 'max',
                inputs: [this.expr, num.toString()],
                result,
            });
        }

        return newHowNow;
    }

    toDisplayFormat(): DisplayFormat {
        const tableMap = new Map<string, Array<{ key: string; value: number }>>();

        // Extract table lookups from steps
        this.steps.forEach((step) => {
            if (step.metadata?.table && step.metadata?.key) {
                const tableKey = step.metadata.table as string;
                const existing = tableMap.get(tableKey) || [];
                existing.push({ key: step.metadata.key as string, value: step.result });
                tableMap.set(tableKey, existing);
            }
        });

        return {
            value: this.valueOf(),
            steps: this.steps,
        };
    }

    getSteps(): CalcStep[] {
        return [...this.steps];
    }

    getMetadata(): Map<string, unknown> {
        return new Map(this.metadata);
    }
}

export default HowNow;
