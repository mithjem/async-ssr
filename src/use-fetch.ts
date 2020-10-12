import { useRef } from 'react'
import stringify from 'fast-json-stable-stringify';
import { LoaderOptions, useLoader } from './use-loader';
import ky from 'ky-universal';
import { omit } from './util';

export interface FetchResult<T> {
    loading: boolean;
    error?: Error;
    data?: T;
}

export interface FetchOptions extends Omit<RequestInit, 'abort' | 'url'>, LoaderOptions {
    type?: 'text' | 'blob' | 'json';
}

export function useFetch<T>(url: string, options?: FetchOptions, dep?: any[]): FetchResult<T>;
export function useFetch<T>(url: string, dep: any[]): FetchResult<T>;
export function useFetch<T>(url: string, optionsOrDependencyList?: any, dependencyList?: any[]): FetchResult<T> {

    if (Array.isArray(optionsOrDependencyList)) {
        dependencyList = optionsOrDependencyList;
        optionsOrDependencyList = {};
    }

    const { ssr = true, type = 'json', refreshClient = true, ttl, enabled, ...rest } = (optionsOrDependencyList || {}) as FetchOptions;

    const controller = useRef<AbortController | null>(null);
    controller.current?.abort();

    controller.current = new AbortController();

    (rest as any).signal = controller.current.signal;

    const key = stringify({ url, request: omit(rest, ['signal']) })

    const ret = useLoader<T>(key, () => {
        switch (type) {
            case 'json': return ky(url, rest).json()
            case 'text': return ky(url, rest).text() as any
            case 'blob': return ky(url, rest).blob() as any
        }
    }, {
        ssr,
        refreshClient,
        ttl,
        enabled,
    }, [key, url, ...(dependencyList || [])]);


    return ret;


}