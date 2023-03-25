import { RequestHandler, MockedRequest, ResponseComposition, DefaultBodyType, defaultContext, rest as mrest } from 'msw';

export type PauseableHandler = RequestHandler & { pause: (pausePredicate?: (req: MockedRequest) => boolean) => void, resume: () => void };

export const rest = {
    get: (url: string, resolver: (req: MockedRequest, res: ResponseComposition<DefaultBodyType>, ctx: typeof defaultContext) => void): PauseableHandler => {
        return createPauseableHandler("get", url, resolver)
    },
    patch: (url: string, resolver: (req: MockedRequest, res: ResponseComposition<DefaultBodyType>, ctx: typeof defaultContext) => void): PauseableHandler => {
        return createPauseableHandler("patch", url, resolver)
    },
    post: (url: string, resolver: (req: MockedRequest, res: ResponseComposition<DefaultBodyType>, ctx: typeof defaultContext) => void): PauseableHandler => {
        return createPauseableHandler("post", url, resolver)
    },
    delete: (url: string, resolver: (req: MockedRequest, res: ResponseComposition<DefaultBodyType>, ctx: typeof defaultContext) => void): PauseableHandler => {
        return createPauseableHandler("delete", url, resolver)
    },
    put: (url: string, resolver: (req: MockedRequest, res: ResponseComposition<DefaultBodyType>, ctx: typeof defaultContext) => void): PauseableHandler => {
        return createPauseableHandler("put", url, resolver)
    }
};

function createPauseableHandler(method: "get" | "post" | "delete" | "patch" | "put", url: string, resolver: (req: MockedRequest, res: ResponseComposition<DefaultBodyType>, ctx: typeof defaultContext) => void) {
    let isResolved = true;
    let promise = Promise.resolve();
    let resolve = () => {};
    let pausePredicate = (req: MockedRequest) => true;

    const handler = mrest[method](url, async (req, res, ctx) => {
        while (pausePredicate(req) && !isResolved) {
            await promise;
        }

        return resolver(req, res, ctx);
    }) as unknown as PauseableHandler;

    handler.pause = (newPausePredicate?: (req: MockedRequest) => boolean) => {
        isResolved = false;
        pausePredicate = newPausePredicate || (() => true);
        
        const oldResolve = resolve;
        promise = new Promise((r) => {
            resolve = r;
            oldResolve();
        })
    }

    handler.resume = () => {
        isResolved = true;
        resolve();
    }

    return handler;
}