

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