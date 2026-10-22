const display = document.getElementById("display");
const status = document.getElementById("status");
const keys = document.querySelector(".calculator__keys");
const maxExpressionLength = 120;
let expression = "";
let justCalculated = false;
let hasError = false;

function render() {
    display.value = hasError ? "Error" : expression;
    display.placeholder = expression || hasError ? "" : "0";
}

function clearError() {
    if (hasError) {
        expression = "";
        hasError = false;
    }
    status.textContent = "";
}

function appendValue(value) {
    clearError();

    if (justCalculated && /[0-9.(]/.test(value)) {
        expression = "";
    }
    justCalculated = false;

    if (expression.length >= maxExpressionLength) {
        status.textContent = "Expression is too long.";
        return;
    }

    if (/^[0-9]$/.test(value)) {
        const currentNumber = expression.split(/[+\-*/()]/).pop();
        if (currentNumber === "0") {
            expression = expression.slice(0, -1) + value;
        } else {
            expression += value;
        }
    } else if (value === ".") {
        const currentNumber = expression.split(/[+\-*/()]/).pop();
        if (!currentNumber.includes(".")) {
            expression += currentNumber ? "." : "0.";
        }
    } else if (value === "(") {
        expression += value;
    } else if (value === ")") {
        const openCount = (expression.match(/\(/g) || []).length;
        const closeCount = (expression.match(/\)/g) || []).length;
        if (openCount > closeCount && /[\d)]$/.test(expression)) {
            expression += value;
        }
    } else if (/^[+\-*/]$/.test(value)) {
        const lastCharacter = expression.slice(-1);
        if (!expression && value !== "-") {
            return;
        }
        if (/[+\-*/]$/.test(expression)) {
            if (value === "-" && lastCharacter !== "-") {
                expression += value;
            } else if (lastCharacter !== "(") {
                expression = expression.slice(0, -1) + value;
            }
        } else {
            expression += value;
        }
    }

    render();
}

function clearCalculator() {
    expression = "";
    justCalculated = false;
    hasError = false;
    status.textContent = "";
    render();
}

function deleteLastCharacter() {
    clearError();
    justCalculated = false;
    expression = expression.slice(0, -1);
    render();
}

function showError(message) {
    expression = "";
    hasError = true;
    justCalculated = false;
    display.value = "Error";
    display.placeholder = "";
    status.textContent = message;
}

function calculate() {
    if (!expression) {
        return;
    }

    try {
        const result = evaluateExpression(expression);
        if (!Number.isFinite(result)) {
            throw new RangeError("Result is outside the supported range.");
        }
        expression = String(Number(result.toPrecision(12)));
        justCalculated = true;
        hasError = false;
        status.textContent = "";
        render();
    } catch (error) {
        showError(error instanceof Error ? error.message : "Unable to calculate this expression.");
    }
}

function evaluateExpression(source) {
    let position = 0;

    function parseExpression() {
        let value = parseTerm();
        while (source[position] === "+" || source[position] === "-") {
            const operator = source[position++];
            const right = parseTerm();
            value = operator === "+" ? value + right : value - right;
        }
        return value;
    }

    function parseTerm() {
        let value = parseUnary();
        while (source[position] === "*" || source[position] === "/") {
            const operator = source[position++];
            const right = parseUnary();
            if (operator === "/" && right === 0) {
                throw new RangeError("Cannot divide by zero.");
            }
            value = operator === "*" ? value * right : value / right;
        }
        return value;
    }

    function parseUnary() {
        if (source[position] === "+") {
            position++;
            return parseUnary();
        }
        if (source[position] === "-") {
            position++;
            return -parseUnary();
        }
        return parsePrimary();
    }

    function parsePrimary() {
        if (source[position] === "(") {
            position++;
            const value = parseExpression();
            if (source[position] !== ")") {
                throw new SyntaxError("Missing closing parenthesis.");
            }
            position++;
            return value;
        }

        const match = source.slice(position).match(/^(?:\d+\.?\d*|\.\d+)/);
        if (!match) {
            throw new SyntaxError("Enter a valid arithmetic expression.");
        }
        position += match[0].length;
        return Number(match[0]);
    }

    const result = parseExpression();
    if (position !== source.length) {
        throw new SyntaxError("Check the expression and try again.");
    }
    return result;
}

keys.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    if (button.dataset.action === "clear") {
        clearCalculator();
    } else if (button.dataset.action === "backspace") {
        deleteLastCharacter();
    } else if (button.dataset.action === "calculate") {
        calculate();
    } else {
        appendValue(button.dataset.value);
    }
});

document.addEventListener("keydown", (event) => {
    if (/^[0-9.+\-*/()]$/.test(event.key)) {
        event.preventDefault();
        appendValue(event.key);
    } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
    } else if (event.key === "Backspace") {
        event.preventDefault();
        deleteLastCharacter();
    } else if (event.key === "Escape" || event.key === "Delete") {
        event.preventDefault();
        clearCalculator();
    }
});

render();
