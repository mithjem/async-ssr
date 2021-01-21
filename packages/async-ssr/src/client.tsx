import { AsyncQueue, AsyncResult, getAsyncContext, SHARED_STATE_KEY } from "./context";
import { MemCache, Cache } from "./cache";
import { deferred, Deferred, has } from "./util";
import React from 'react';
import { HttpError } from './error';


export const MINIMUM_TTL = 1000;

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
    const stateEl = document.querySelector(`#${stateId}`);
    if (!stateEl) return {}
    try {
        const data = JSON.parse(stateEl.textContent || '')
        for (const key in data) {
            const value = data[key];
            if (value.error) {
                const e = value.error;
                switch (e.type) {
                    case "HttpError":
                        value.error = new HttpError(e.statusCode, e.message, e.url, e.body);
                        value.error.stack = e.stack;
                        break;
                }
            }
        }
        return data;
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

    async add<T>(key: string, init: () => Promise<T>, ttl: number): Promise<T> {


        if (this._queue[key]) {
            let defer = deferred<T>();
            this._queue[key].push(defer);
            return defer.promise
        }

        const run = async () => {
            const queue = this._queue[key];
            delete this._queue[key];

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

        this._queue[key] = [];

        if (ttl <= MINIMUM_TTL) {
            return await run()
        }

        const cachedValue = await this._cache.get<T>(key);
        if (cachedValue) {
            const queue = this._queue[key] || [];
            delete this._queue[key];
            queue.forEach(listener => {
                listener.resolve(cachedValue);
            });
            return cachedValue;
        }

        const value = await run();

        this._cache.set(key, value, ttl);

        return value;

    }
    get<T>(key: string): AsyncResult<T> | null {

        if (this._queue[key]) {
            return { loading: true }
        }

        if (has(this.#state, key)) {
            const data = this.#state[key];
            return { ...data, loading: false }
        }



        return null
    }
}

