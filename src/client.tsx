import { AsyncQueue, AsyncResult, getAsyncContext, SHARED_STATE_KEY } from "./context";
import stringify from 'fast-json-stable-stringify';
import { MemCache, Cache } from "./cache";
import { deferred, Deferred, has } from "./util";
import React from 'react';


export interface AsyncManagerProps {
    cache?: Cache;
    stateId?: string;
}

export function AsyncManager(props: React.PropsWithChildren<AsyncManagerProps>) {
    const { cache, children, stateId = SHARED_STATE_KEY } = props;
    const Context = getAsyncContext();
    return <Context.Provider value={new ClientQueue(cache, stateId)}>
        {children}
    </Context.Provider>
}

function loadState(stateId: string) {
    const state = document.querySelector(`#${stateId}`);
    if (!state) return {}

    try {
        return JSON.parse(state.textContent || '')
    } catch {
        return {}
    }

}

export class ClientQueue implements AsyncQueue {
    #state: Record<string, any>;
    _queue: Record<string, Deferred<any>[]> = {};
    constructor(private _cache: Cache = new MemCache, stateId: string) {
        this.#state = loadState(stateId);
    }

    async add<T>(key: any, init: () => Promise<T>, ttl: number): Promise<T> {
        const encodedKey = stringify(key);

        if (this._queue[encodedKey]) {
            let defer = deferred<T>();
            this._queue[encodedKey].push(defer);
            return defer.promise
        }

        const run = async () => {
            const queue = this._queue[encodedKey];
            delete this._queue[encodedKey];

            try {
                const ret = await init();
                queue.forEach((listener) => {
                    listener.resolve(ret);
                });
                return ret
            } catch (e) {
                queue.forEach((listener) => {
                    listener.reject(e);
                });
                throw e;
            }

        };

        this._queue[encodedKey] = [];

        if (ttl <= 1000) {
            return await run()
        }

        const cachedValue = await this._cache.get<T>(encodedKey);
        if (cachedValue) {
            const queue = this._queue[encodedKey] || [];
            delete this._queue[encodedKey];
            queue.forEach(listener => {
                listener.resolve(cachedValue);
            });
            return cachedValue;
        }

        const value = await run();

        this._cache.set(encodedKey, value, ttl);

        return value;

    }
    get<T>(key: any): AsyncResult<T> {
        const encodedKey = stringify(key);
        if (has(this.#state, encodedKey)) {
            const data = this.#state[encodedKey];
            delete this.#state[encodedKey];
            return { ...data, loading: false }
        }

        if (this._queue[encodedKey]) {
            return { loading: true }
        }

        return { loading: false }
    }
}

