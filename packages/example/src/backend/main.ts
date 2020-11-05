import Koa from 'koa';
import webpack from 'koa-webpack';
import Path from 'path';
import { render } from './renderer';


async function main() {

    const app = new Koa();

    const webpackConfig = require('../../webpack.config')
    const webpackCompiler = require('webpack')

    const compiler = webpackCompiler(webpackConfig)
    app.use(await webpack({
        compiler,
        devMiddleware: {
            publicPath: "/statics",
            // logLevel: 'silent',
            headers: {
                'Service-Worker-Allowed': '/'
            },
            writeToDisk(filePath: string) {
                return /dist\/node\//.test(filePath) || /loadable-stats/.test(filePath)
            },
        }
    } as any));


    app.use(render({ path: Path.join(process.cwd(), "dist"), dev: false }))

    app.listen("3030")

}

main().catch(e => console.error(e))