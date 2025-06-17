/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  printWidth: 80,
  trailingComma: 'all',
  plugins: ['prettier-plugin-astro', 'prettier-plugin-organize-imports'],
  organizeImportsSkipDestructiveCodeActions: true,
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};

export default config;
