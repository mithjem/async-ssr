import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [{
  input: './src/index.ts',
  output: [{
    file: pkg.browser,
    format: 'cjs',
  }, {
    file: pkg.module,
    format: 'es',
  }],
  plugins: [
    peerDepsExternal({
      includeDependencies: true,
    }),
    typescript({
      exclude: ['node_modules/**'],
      typescript: require('typescript'),
      tsconfigOverride: {
        compilerOptions: {
          module: 'esnext',
          declaration: false
        }
      }
    }),
    // resolve(),
    // commonjs(),
  ]
}]