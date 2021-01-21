

export class HttpError extends Error {
    constructor(public readonly statusCode: number, message: string, public readonly url: string, public readonly body?: any) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}