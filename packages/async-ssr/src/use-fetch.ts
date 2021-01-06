import { useEffect, useRef } from 'react'
import stringify from 'fast-json-stable-stringify';
import { LoaderOptions, useLoader } from './use-loader';
import ky from 'ky-universal';
import { isCancel, omit } from './util';
import { HttpError } from './error';



export interface FetchResult<T> {
    loading: boolean;
    error?: Error;
    data?: T;
}

export interface FetchOptions<T> extends Omit<RequestInit, 'abort' | 'url'>, LoaderOptions {
    type?: 'text' | 'blob' | 'json';
    transform?: (data?: T) => any;
}

export function useFetch<T>(url: string, options?: FetchOptions<T>, dep?: any[]): FetchResult<T>;
export function useFetch<T>(url: string, dep: any[]): FetchResult<T>;
export function useFetch<T>(url: string, optionsOrDependencyList?: any, dependencyList?: any[]): FetchResult<T> {

    if (Array.isArray(optionsOrDependencyList)) {
        dependencyList = optionsOrDependencyList;
        optionsOrDependencyList = {};
    }

    const { ssr = true, type = 'json', refreshClient = true, ttl,
        transform, enabled = true, ...rest } = (optionsOrDependencyList || {}) as FetchOptions<T>;

    const controller = useRef<AbortController | null>(null);

    const key = stringify({ url, request: omit(rest, ['signal']) })

    const ret = useLoader<T>(key, () => {

        controller.current?.abort();
        controller.current = new AbortController();
        (rest as any).signal = controller.current.signal;

        let request: Promise<any>;
        switch (type) {
            case 'json':
                request = ky(url, rest).json();
                break;
            case 'text':
                request = ky(url, rest).text();
                break;
            case 'blob':
                request = ky(url, rest).blob();
                break;
        }

        request = request.then(resp => resp, async (err: ky.HTTPError) => {
            if (!(err instanceof ky.HTTPError)) {
                throw err;
            }
            let ct = err.response.headers.get('content-type') || '';
            let body;
            try {
                if (ct.includes('application/json')) {
                    body = await err.response.json();
                } else if (ct.includes('text')) {
                    body = await err.response.text();
                }
            } catch { }

            const e = new HttpError(err.response.status, err.response.statusText, err.response.url, body);
            e.stack = err.stack;
            throw e;
        });

        if (transform) {
            return request.then(transform)
        } else {
            return request;
        }

    }, {
        ssr,
        refreshClient,
        ttl,
        enabled,
    }, [key, url, ...(dependencyList || [])]);

    if (!ret.loading && !refreshClient) {
        controller.current = null;
    }

    useEffect(() => {
        return () => {
            controller.current?.abort();
            controller.current = null;
        }
    }, []);

    // If we have an abort error, this mean the user have made a new request.
    // As this is not an error, we should tell the user
    // that we are waiting on another request
    // So we should return a loading state
    if (isCancel(ret.error)) {
        return {
            loading: true
        }
    }


    return ret;


}