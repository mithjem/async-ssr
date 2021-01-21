import { Context } from 'koa';
import React from 'react'
import { renderToString } from 'react-dom/server'
import Path from 'path';
import { Helmet, HelmetData } from 'react-helmet';
import { renderToStringWithAsyncData, RenderResult } from '@mithjem/async-ssr/server';
import { MemCache } from '@mithjem/async-ssr';
import { ChunkExtractor } from '@loadable/server'


export interface RenderOptions {
    path: string;
    dev: boolean;
}

function getOptions(dev: boolean, path: string, target: 'web' | 'node') {
    const statsFile = Path.join(path, `${target}/loadable-stats.json`);
    return dev ? { statsFile } : { stats: require(statsFile) }
}

export function render(options: RenderOptions) {

    const { path, dev } = options;

    const webOpts = getOptions(dev, path, 'web'),
        nodeOpts = getOptions(dev, path, 'node');

    const cache = new MemCache

    return async (ctx: Context) => {



        const nodeExtractor = new ChunkExtractor(nodeOpts);
        const { default: App } = nodeExtractor.requireEntrypoint();

        const webExtractor = new ChunkExtractor(webOpts);
        const jsx = webExtractor.collectChunks(<App />);

        let helmet = Helmet.renderStatic();

        const result = await renderToStringWithAsyncData(jsx, { renderFunction: renderToString, cache });

        ctx.body = html(helmet, webExtractor, result);
        ctx.type = 'text/html';

    }
}


const html = (helmet: HelmetData, extractor: ChunkExtractor, result: RenderResult) => `
    <!doctype html>
    <html ${helmet.htmlAttributes.toString()}>
        <head>
            ${extractor.getLinkTags()}
            ${extractor.getStyleTags()}
            ${helmet.title.toString()}
            ${helmet.meta.toString()}
            ${helmet.link.toString()}           
        </head>
        <body ${helmet.bodyAttributes.toString()}>
            ${result}
            ${extractor.getScriptTags()}
        </body>
    </html>
`;