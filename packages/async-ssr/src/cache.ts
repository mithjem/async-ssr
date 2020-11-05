

export interface Cache {
    set(key: string, value: any, ttl: number): Promise<any>;
    get<T>(key: string): Promise<T | null>;
    rm(key: string): Promise<any>
}

export class MemCache implements Cache {
    _cache: Record<string, { expire: number, data: string }> = {}
    set(key: string, value: any, ttl: number): Promise<any> {
        const old = this._cache[key];
        this._cache[key] = {
            data: JSON.stringify(value),
            expire: (+new Date) + ttl,
        }
        return Promise.resolve(old?.data ?? null);
    }

    get<T>(key: string): Promise<T | null> {
        const item = this._cache[key];
        if (!item) {
            return Promise.resolve(null);
        }

        let now = +new Date();
        if (now > item.expire) {
            delete this._cache[key];
            return Promise.resolve(null)
        }

        return Promise.resolve(JSON.parse(item.data));
    }

    rm(key: string): Promise<any> {
        const old = this._cache[key];
        delete this._cache[key];
        return Promise.resolve(old?.data ?? null)
    }

}