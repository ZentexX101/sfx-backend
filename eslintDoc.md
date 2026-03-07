# ESLint Configuration Documentation

This document explains the ESLint configuration used in this project. The configuration is based on ESLint's recommended rules and extends them with custom rules tailored to our JavaScript codebase.

## Overview

The configuration includes:

- ESLint's recommended base rules
- Custom settings for `.js` files (Node.js/CommonJS environment)
- A set of strict, maintainable, and readable code practices enforced via rules

---

## Configuration Breakdown

### Base Configuration

We start by extending ESLint's recommended configuration:

```js
js.configs.recommended;
```

This provides a solid baseline of commonly accepted best practices.

---

### File Scope

All custom rules apply to files matching the pattern `**/*.js`, meaning all `.js` files in the project.

```js
{
  files: ["**/*.js"],
  // ...rest of config
}
```

---

### Language Options

We configure ESLint to understand the latest ECMAScript features and assume CommonJS as the module system.

```js
languageOptions: {
  ecmaVersion: "latest", // Use the latest ECMAScript version
  sourceType: "commonjs", // Assume CommonJS modules
  globals: {
    console: "readonly",
    module: "readonly",
    require: "readonly",
    __dirname: "readonly"
  }
}
```

This ensures ESLint correctly parses global variables like `console`, `require`, etc., without throwing errors.

---

### Plugins

ESLint core rules are loaded using the `@eslint/js` plugin:

```js
plugins: {
	js: require("@eslint/js");
}
```

---

### Custom Rules

Below is a list of custom rules applied in this configuration along with their rationale:

| Rule                                    | Level   | Description                                                                                                                   |
| --------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `no-unused-vars`                        | `warn`  | Warn about unused variables, but ignore function args named `req`, `res`, or `next` (typically Express middleware parameters) |
| `no-console`                            | `warn`  | Warn when `console` is used                                                                                                   |
| `eqeqeq`                                | `error` | Require strict equality (`===` and `!==`) except where types are known to be the same                                         |
| `no-extra-semi`                         | `error` | Disallow unnecessary semicolons                                                                                               |
| `no-self-compare`                       | `error` | Disallow comparisons where a variable is compared to itself                                                                   |
| `no-template-curly-in-string`           | `error` | Prevent unintended use of template literal placeholders in regular strings                                                    |
| `no-unassigned-vars`                    | `warn`  | Warn if a variable is declared but never assigned a value                                                                     |
| `no-useless-assignment`                 | `warn`  | Warn if a variable is assigned and then immediately reassigned without use                                                    |
| `camelcase`                             | `warn`  | Enforce camelCase naming convention for variables and properties                                                              |
| &nbsp;&nbsp;`properties: "always"`      | -       | Enforces camelCase on object property names                                                                                   |
| &nbsp;&nbsp;`ignoreDestructuring: true` | -       | Allow non-camelCase names in destructuring assignments                                                                        |
| &nbsp;&nbsp;`ignoreImports: true`       | -       | Allow non-camelCase names in imports                                                                                          |
| &nbsp;&nbsp;`ignoreGlobals: true`       | -       | Allow non-camelCase global variable names                                                                                     |
| `no-empty`                              | `warn`  | Warn about empty blocks, e.g., `if (condition) {}`                                                                            |
| `no-empty-function`                     | `error` | Disallow empty functions                                                                                                      |
| `prefer-const`                          | `error` | Prefer `const` over `let` if a variable is not reassigned                                                                     |

---

## Summary

This ESLint configuration promotes clean, readable, and bug-free JavaScript code by enforcing modern best practices and avoiding common pitfalls. It's especially suited for Node.js/CommonJS-based projects such as Express applications.

---

Let me know if you'd like this exported as a file or integrated into a README format!
