const js = require("@eslint/js");

module.exports = [
	// Include ESLint's recommended rules
	js.configs.recommended,

	// Your custom rules
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				console: "readonly",
				module: "readonly",
				require: "readonly",
				__dirname: "readonly",
			},
		},

		plugins: {
			js: require("@eslint/js"),
		},
		rules: {
			"no-unused-vars": ["warn", { argsIgnorePattern: "^(req|res|next)$" }],
			"no-console": "warn",
			eqeqeq: ["error", "smart"],
			"no-extra-semi": "error",
			"no-self-compare": "error",
			"no-template-curly-in-string": "error",
			"no-unassigned-vars": "warn",
			"no-useless-assignment": "warn",
			camelcase: [
				"warn",
				{
					properties: "always",
					ignoreDestructuring: true,
					ignoreImports: true,
					ignoreGlobals: true,
				},
			],
			"no-empty": "warn",
			"no-empty-function": "error",
			"prefer-const": "error",
		},
	},
];
