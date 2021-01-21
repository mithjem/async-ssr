import { useEffect, useLayoutEffect } from 'react';
import stringify from 'fast-json-stable-stringify';


export interface Deferred<T> {
    resolve: (data: T) => void;
    reject: (error: any) => void;
    promise: Promise<T>
}

export function deferred<T>(): Deferred<T> {
    const defer: any = {};
    defer.promise = new Promise<T>((res, rej) => {
        defer.resolve = res;
        defer.reject = rej;
    });
    return defer
}
const _has = Object.prototype.hasOwnProperty;
export function has(object: any, prop: any): boolean {
    return _has.call(object, prop)
}


export function omit<T, K extends keyof T>(o: T, args: K[]): Omit<T, K> {
    let out: any = {};
    for (const key in o) {
        if (!~args.indexOf(key as any)) out[key] = o[key];
    }
    return out;
}

export const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect


const _DOMException: any = typeof window !== 'undefined' ? DOMException : require('domexception');

export function isCancel(error: any) {
    return error && (error.isCanceled || (error instanceof _DOMException && error.code === _DOMException.ABORT_ERR));
}


export type CancelToken = () => void;

export function makeCancelable<T, TResult1 = T, TResult2 = never>(promise: PromiseLike<T>, onfulfilled: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null, controller?: AbortController): CancelToken {
    let hasCanceled = false;
    new Promise((resolve, reject) => promise
        .then(val => hasCanceled ? reject({ isCanceled: true }) : resolve(val), err => hasCanceled ? reject({ isCanceled: true }) : reject(err))

    )
        .then(onfulfilled as any)
        .catch(err => { if (!isCancel(err)) { throw (err); } })
        .catch(onrejected);
    return function () {
        if (controller)
            controller.abort()
        hasCanceled = true;
    };
};

export function stableKey(a: any) {
    return stringify(a)
}