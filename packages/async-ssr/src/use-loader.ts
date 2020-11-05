import { useContext, useEffect, useRef, useState } from "react";
import useSSR from "use-ssr";
import { AsyncResult, getAsyncContext } from "./context";

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

    const { ssr = true, refreshClient = false, ttl = 0, enabled = true } = options;
    const { isServer } = useSSR();
    const currentKey = useRef<string | null>(null)

    if (isServer && (!ssr || !enabled)) {
        return enabled ? { loading: true } : { loading: false }
    }

    const ctx = useContext(getAsyncContext());

    if (isServer) {
        ctx.add(key, init, ttl);
        return ctx.get(key) as LoaderResult<T>;
    } /*else if (!isServer && ssr && !refreshClient) {
        return ctx.get(key);
    }*/

    const [state, setState] = useState<AsyncResult<T>>(ctx.get(key) ?? {
        loading: enabled,

    })

    useEffect(() => {

        if (!enabled || (ssr && !refreshClient)) {
            return
        }

        ctx.add(key, init, ttl).then(data => {
            setState({
                loading: false,
                data,
            })
        }, error => {
            setState({
                loading: false,
                error
            })
        })
    }, (deps ?? []).concat(enabled, refreshClient));

    return state
}


// export function useLoader2<T>(key: string, init: () => Promise<T>, options: LoaderOptions = {}, deps?: any[]): LoaderResult<T> {

//     const { ssr = true, refreshClient = false, ttl = 0, enabled = true } = options;
//     const { isServer } = useSSR();

//     if (isServer && (!ssr || !enabled)) {
//         return enabled ? { loading: true } : { loading: false }
//     }

//     const ctx = useContext(getAsyncContext());

//     if (isServer) {
//         ctx.add(key, init, ttl);
//         return ctx.get(key);
//     } /*else if (!isServer && ssr && !refreshClient) {
//         return ctx.get(key);
//     }*/

//     const [state, setState] = useState<AsyncResult<T>>(ctx.get(key) ?? {
//         loading: enabled
//     })

//     useEffect(() => {

//         if (!enabled) {
//             return
//         }

//         ctx.add(key, init, ttl).then(data => {
//             setState({
//                 loading: false,
//                 data,
//             })
//         }, error => {
//             setState({
//                 loading: false,
//                 error
//             })
//         })
//     }, (deps ?? []).concat(enabled));

//     return state
// }