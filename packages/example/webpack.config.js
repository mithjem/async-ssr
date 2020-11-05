const Path = require('path'),
  nodeExternals = require('webpack-node-externals'),
  ManifestPlugin = require('./manifest');



const DIST_PATH = Path.join(__dirname, "dist");

const getConfig = target => ({
  name: target,
  target,
  entry: [`./src/frontend/main-${target}.tsx`],
  externals: target === 'node' ? ['@loadable/component', nodeExternals({
    // allowlist: ['react-imask']
    // allowlist: ['@mithjem/components', 'style-inject']
    modulesFromFile: true
  })] : void 0,
  output: {
    path: Path.join(DIST_PATH, target),
    filename: '[name].js',
    publicPath: '/statics/', //`/dist/${target}/`,
    libraryTarget: target === 'node' ? 'commonjs2' : undefined,
  },
  mode: 'development',
  module: {
    rules: [{
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            caller: { target },
          },
        },
      },
      // This is a workaround for import errors, when using mjs modules
      {
        test: /\.mjs$/,
        include: [/node_modules/, Path.join(__dirname, "../async-ssr")],
        type: "javascript/auto"
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.tsx', '.ts'],
  },
  plugins: [
    new ManifestPlugin
  ]
})

module.exports = [
  getConfig("web"),
  getConfig("node")
]