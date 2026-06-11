import next from 'eslint-config-next/core-web-vitals';

// eslint-config-next v16 ships a native flat-config array, so we spread it
// directly (no FlatCompat needed).
const eslintConfig = [
  // Don't lint build output, deps, or generated type shims.
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
  ...next,
  {
    rules: {
      // Advisory React-Compiler rule (new in eslint-plugin-react-hooks v6). It
      // flags legitimate, ubiquitous patterns — initialising local form state
      // from fetched data, or reading URL params on mount — so we surface it as
      // a warning rather than failing the build. Genuine bug-catching hooks
      // rules (rules-of-hooks, refs, immutability) stay as errors.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
