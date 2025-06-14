// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    rules: {
      // was trying to use (...args: any[]) to make a function that could handle any type of function
      // and then typescript started crying
      // and then eslint started crying
      // and then i started crying
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/prefer-for-of": "off",
    }
  },
  {
    ignores: ["jest.config.js", "dist/**", "webpack.config.js"],
  },
);