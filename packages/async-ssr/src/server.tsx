import { AsyncQueue, AsyncResult, getAsyncContext, SHARED_STATE_KEY } from "./context";
import React from 'react';
import { Cache, MemCache } from "./cache";
import { renderToString } from "react-dom/server";
import { HttpError } from "./error";

export class ServerAsyncQueue implements AsyncQueue {
    constructor(private _queue: RenderPromise) { }

    add<T>(key: string, init: () => Promise<T>, _ttl: number): Promise<T> {
        this._queue.add(key, init);
        return Promise.resolve(void 0 as any);
    }
    get<T>(key: string): AsyncResult<T> | null {
        const data = this._queue.get<T>(key);
        return data ? { ...data, loading: false } : { loading: true }
    }

}


export interface StateEntry {
    error?: any;
    data?: any;
}

export type State = Record<string, StateEntry>

class RenderPromise {
    queue: Array<{ key: string, promise: Promise<any> }> = [];
    resolved: State = {};

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


export type StateSerializer = (key: string, entry: StateEntry) => StateEntry;

export interface RenderOptions {
    renderFunction?: (el: JSX.Element) => string;
    cache?: Cache;
    serialize?: StateSerializer;
}


function serializeState(state: State, serializer?: StateSerializer) {
    for (const key in state) {
        const value = serializer?.(key, state[key]) ?? state[key];

        if (value.error) {
            const e = value.error;
            if (e instanceof HttpError) {
                value.error = {
                    type: 'HttpError',
                    statusCode: e.statusCode,
                    message: e.message,
                    url: e.url,
                    body: e.body,
                    stack: e.stack
                }
            } else if (e instanceof Error) {
                value.error = {
                    type: e.name,
                    message: e.message,
                    stack: e.stack
                }
            }
        }

        state[key] = value;
    }

    return state
}

export function renderToStringWithAsyncData(tree: JSX.Element, options: RenderOptions = {}) {

    const { renderFunction = renderToString,
        cache = new MemCache, serialize } = options;

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
        return new RenderResult(content, serializeState(promises.resolved, serialize), count);
    });
}



export class RenderResult {
    constructor(public content: string, public data: State, public rounds: number) { }

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