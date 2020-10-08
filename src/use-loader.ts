import { useContext, useEffect, useState } from "react";
import useSSR from "use-ssr";
import { AsyncResult, getAsyncContext } from "./context";

export interface LoaderResult<T> {
    data?: T;
    error?: any;
    loading: boolean;
}

export interface LoaderOptions {
    ssr?: boolean;
    refreshClient?: boolean
    ttl?: number;
    enabled?: boolean;
}

export function useLoader<T>(key: string, init: () => Promise<T>, options: LoaderOptions = {}, deps?: any[]): LoaderResult<T> {

    const { ssr = true, refreshClient = false, ttl = 0, enabled = true } = options;
    const { isServer } = useSSR();

    if (isServer && (!ssr || !enabled)) {
        return enabled ? { loading: true } : { loading: false }
    }

    const ctx = useContext(getAsyncContext());

    if (isServer) {
        ctx.add(key, init, ttl);
        return ctx.get(key);
    } else if (!isServer && ssr && !refreshClient) {
        return ctx.get(key);
    }

    const [state, setState] = useState<AsyncResult<T>>(ctx.get(key) ?? {
        loading: enabled
    })

    useEffect(() => {

        if (!enabled) {
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
    }, (deps ?? []).concat(enabled));


    return state
}