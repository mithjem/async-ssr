import { useRef } from 'react'
import stringify from 'fast-json-stable-stringify';
import { useLoader } from './use-loader';
import ky from 'ky-universal';

export interface FetchResult<T> {
    loading: boolean;
    error?: Error;
    data?: T;
}

export interface FetchOptions extends Omit<RequestInit, 'abort' | 'url'> {
    ssr?: boolean;
    type?: 'text' | 'blob' | 'json';
    refreshClient?: boolean;
}

export function useFetch<T>(url: string, options?: FetchOptions, dep?: any[]): FetchResult<T>;
export function useFetch<T>(url: string, dep: any[]): FetchResult<T>;
export function useFetch<T>(url: string, optionsOrDependencyList?: any, dependencyList?: any[]): FetchResult<T> {

    if (Array.isArray(optionsOrDependencyList)) {
        dependencyList = optionsOrDependencyList;
        optionsOrDependencyList = {};
    }

    const { ssr = true, type = 'json', refreshClient = true, ...rest } = optionsOrDependencyList || {} as FetchOptions;

    const controller = useRef<AbortController | null>(null);
    controller.current?.abort();

    controller.current = new AbortController();

    (rest as any).signal = controller.current.signal;

    const ret = useLoader<T>(stringify({ url, request: rest }), () => {
        switch (type) {
            case 'json': return ky(url, rest).json()
            case 'text': return ky(url, rest).text() as any
            case 'blob': return ky(url, rest).blob() as any
        }
    }, {
        ssr,
        refreshClient,
    }, [ssr, optionsOrDependencyList, url, ...(dependencyList || [])]);


    return ret;


}