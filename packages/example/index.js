require('@babel/register')({
  extensions: [".es6", ".es", ".jsx", ".js", ".mjs"],
  // Because of various bugs or inconsistensies, we'll have
  // to compile someof the modules at runtime when doing ssr.
  // TODO: Re-visit this, when es modules is stablized in node
  only: [
    'webpack.config.babel.js',
    function(path) {
      const p = path.replace(process.cwd(), '');
      // console.log(p);
      return p.startsWith('/lib') || p.includes('imask')
    }
  ]
});
require('./lib/backend/main');