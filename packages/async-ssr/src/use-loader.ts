import { useContext, useEffect, useState } from 'react'
import useSSR from 'use-ssr'
import { AsyncResult, getAsyncContext } from './context'
import { makeCancelable } from './util'

export interface LoaderResult<T> {
    data?: T;
    error?: any;
    loading: boolean;
}

export interface LoaderOptions {
    /**
     * If the request should be performed at server side rendering
     *
     * @type {boolean}
     * @memberof LoaderOptions
     */
    ssr?: boolean;
    /**
     * If the client should refresh the request on client side render,

     * @type {boolean}
     * @memberof LoaderOptions
     */
    refreshClient?: boolean
    /**
     * Sets the cache time in ms.
     * A cache time at zero or below, disables it
     * @type {number}
     * @memberof LoaderOptions
     */
    ttl?: number;
    /**
     * If the request should be initiated. Can be use for conditional making the request
     *
     * @type {boolean}
     * @memberof LoaderOptions
     */
    enabled?: boolean;
}

export function useLoader<T>(key: string, init: () => Promise<T>, options: LoaderOptions = {}, deps?: any[]): LoaderResult<T> {
    const { ssr = true, refreshClient = false, ttl = 0, enabled = true } = options
    const { isServer } = useSSR()

    if (isServer && (!ssr || !enabled)) {
        return enabled ? { loading: true } : { loading: false }
    }

    const ctx = useContext(getAsyncContext())

    if (isServer) {
        ctx.add(key, init, ttl)
        return ctx.get(key) as LoaderResult<T>
    }

    const [state, setState] = useState<AsyncResult<T>>(ctx.get(key) ?? {
        loading: enabled

    })

    useEffect(() => {
        if (!enabled || (ssr && !refreshClient)) {
            return
        }

        return makeCancelable(ctx.add(key, init, ttl), data => {
            setState({
                loading: false,
                data
            })
        }, error => {
            setState({
                loading: false,
                error
            })
        })
    }, (deps ?? []).concat(enabled, refreshClient))

    return state
}
