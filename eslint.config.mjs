import eslintPluginAstro from 'eslint-plugin-astro';
import astroParser from 'astro-eslint-parser';
import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['dist/', '.astro/', 'node_modules/'],
    },
    ...eslintPluginAstro.configs.recommended,
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            'no-undef': 'error',
        },
    },
    {
        files: ['**/*.astro'],
        languageOptions: {
            parser: astroParser,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                ecmaFeatures: {
                    globalReturn: true,
                },
            },
        },
        rules: {
            'no-console': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            'no-undef': 'off', 
        },
    },
    {
        files: ['scripts/**/*.js'],
        rules: {
            'no-console': 'off',
            'no-undef': 'off',
        },
    },
];
