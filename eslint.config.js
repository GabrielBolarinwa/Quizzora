export default [
  {
    files: ["js/**/*.js", "js/**/*.jsx"],
    ignores: ["node_modules/**"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
      "no-mixed-spaces-and-tabs": "off",
      semi: "off",
      quotes: "off",
      eqeqeq: "warn",
      curly: "error",
    },
  },
];
