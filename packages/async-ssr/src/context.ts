import React from 'react';

export const SHARED_STATE_KEY = "__ASYNC_SSR_STATE__"

const asyncContextSymbol = typeof Symbol === 'function' && Symbol.for ?
    Symbol.for('__ASYNC_SSR_CONTEXT__') :
    '__ASYNC_SSR_CONTEXT__';

export function resetAsyncContext() {
    Object.defineProperty(React, asyncContextSymbol, {
        value: React.createContext<AsyncQueue | null>(null),
        enumerable: false,
        configurable: true,
        writable: false,
    });
}

export interface AsyncResult<T> {
    data?: T;
    error?: any;
    loading: boolean;
}

export interface AsyncQueue {
    add<T>(key: string, init: () => Promise<T>, ttl: number): Promise<T>;
    get<T>(key: string): AsyncResult<T>
}

export function getAsyncContext() {
    if (!(React as any)[asyncContextSymbol]) {
        resetAsyncContext();
    }
    return (React as any)[asyncContextSymbol] as React.Context<AsyncQueue>;
}