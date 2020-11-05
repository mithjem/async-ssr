const path = require('path'),
  fs = require('fs');


module.exports = class ManifestPlugin {

  mapAsset = m => {
    const type = (() => {
      switch (path.extname(m)) {
        case ".css":
          return 'style';
        case ".js":
          return 'script';
        default:
          console.log('invalid type', m)
          return null;
      }
    })();

    if (type == null) return null;

    return {
      type,
      content: m
    }

  };

  apply(compiler) {

    // This is for @loadable/component because we'are not 
    // using the webpack plugin
    compiler.options.output.jsonpFunction = '__LOADABLE_LOADED_CHUNKS__';

    compiler.hooks.done.tap('Valse Plugin', (
      stats /* stats is passed as an argument when done hook is tapped.  */
    ) => {
      const json = stats.toJson({
        hash: true,
        publicPath: true,
        assets: true,
        chunks: false,
        modules: false,
        source: false,
        errorDetails: false,
        timings: false,
      });

      const dist = stats.compilation.outputOptions.path;


      const manifestPath = path.join(dist, "loadable-stats.json");

      json.assets = json.assets.filter(m => !m.name.startsWith("service-worker") && !m.name.startsWith("workbox"))

      const output = JSON.stringify(json, null, 2)

      fs.writeFileSync(manifestPath, output);


    });
  }
}