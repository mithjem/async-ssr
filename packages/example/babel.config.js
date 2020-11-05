function isWebTarget(caller) {
  return Boolean(caller && caller.target === 'web')
}

function isWebpack(caller) {
  return Boolean(caller && caller.name === 'babel-loader')
}

module.exports = api => {
  const web = api.caller(isWebTarget)
  const webpack = api.caller(isWebpack)

  return {
    presets: [
      ['@babel/preset-typescript', {
        allowNamespaces: true
      }],
      '@babel/preset-react', [
        '@babel/preset-env',
        {
          // useBuiltIns: web ? 'entry' : undefined,
          // corejs: web ? 'core-js@3' : false,
          targets: !web ? { node: 'current' } : undefined, //"> 0.25%, not dead",
          modules: webpack ? false : 'commonjs',
          exclude: ["transform-regenerator"]
        },
      ],
    ],
    // plugins: [
    //   '@babel/plugin-syntax-dynamic-import',
    //   '@loadable/babel-plugin',
    //   '@babel/plugin-proposal-class-properties',
    //   '@babel/plugin-proposal-object-rest-spread',
    //   '@babel/plugin-proposal-nullish-coalescing-operator',
    //   '@babel/plugin-proposal-optional-chaining'
    // ],
  }
}