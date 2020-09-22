import { AsyncQueue, AsyncResult, getAsyncContext, SHARED_STATE_KEY } from "./context";
import React from 'react';
import { Cache, MemCache } from "./cache";



export class ServerAsyncQueue implements AsyncQueue {
    constructor(private _queue: RenderPromise) { }

    add<T>(key: string, init: () => Promise<T>, ttl: number): Promise<T> {
        this._queue.add(key, init);
        return Promise.resolve(void 0 as any);
    }
    get<T>(key: string): AsyncResult<T> {
        const data = this._queue.get<T>(key);
        return data ? { ...data, loading: false } : { loading: true }
    }

}

class RenderPromise {
    queue: Array<{ key: string, promise: Promise<any> }> = [];
    resolved: Record<string, { error?: any, data?: any }> = {};

    constructor(private _cache: Cache) { }

    hasPromises() {
        return !!this.queue.length;
    }

    add<T>(key: string, init: () => Promise<T>, ttl?: number) {
        if (this.resolved[key] || this.queue.find(m => m.key == key)) {
            return;
        }

        this.queue.push({
            key, promise: this._cache.get(key).then(ret => {
                return ret ? ret : init().then(ret => {
                    this._cache.set(key, ret, ttl ?? 0);
                    return ret
                })
            })
        });

    }

    get<T>(key: string): { data?: T; error?: any } {
        return this.resolved[key];
    }

    async consume() {
        const promises = this.queue.map(m => {
            return m.promise.then(ret => {

                this.resolved[m.key] = { data: ret };
            }, err => {

                this.resolved[m.key] = { error: err };
            })
        });
        try {
            await Promise.all(promises);
            this.queue.length = 0;
        } catch (err) {
            this.queue.length = 0;
            throw err;
        }

    }
}



export function renderToStringWithAsyncData(tree: JSX.Element, renderFunction: (el: JSX.Element) => string, cache: Cache = new MemCache) {

    const promises = new RenderPromise(cache);
    let count = 0;

    function process(): Promise<string> {
        let Context = getAsyncContext();
        count++;

        return new Promise<string>((resolve) => {
            const element = <Context.Provider value={new ServerAsyncQueue(promises)}>
                {tree}
            </Context.Provider >

            resolve(renderFunction(element))
        }).then(html => {
            return promises.hasPromises()
                ? promises.consume().then(process)
                : html
        });
    }

    return Promise.resolve().then(process).then(content => {
        return new RenderResult(content, promises.resolved, count);
    })
}



export class RenderResult {
    constructor(public content: string, public data: Record<string, any>, public rounds: number) { }

    renderState(id = SHARED_STATE_KEY) {
        return `<script type="text/async-ssr-cache" id="${id}">${JSON.stringify(this.data)}</script>`
    }

    renderContent(id: string = 'app') {
        return `<div id="${id}">${this.content}</div>`
    }

    toString() {
        return [
            this.renderState(),
            this.renderContent()
        ].join('');
    }
}