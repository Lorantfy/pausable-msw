import fetch from 'node-fetch';
import { describe, test, expect } from 'vitest';
import { rest } from './index';
import { setupServer } from 'msw/node'

describe('rest', () => {
    test('allows pausing and resuming', async () => {
        const handlers = [
            rest.get('http://localhost:9001/data', (req, res, ctx) => {
                return res(ctx.status(200));
            })
        ]

        const mockServer = setupServer(...handlers);

        mockServer.listen();

        handlers[0].pause();

        let res: unknown = null;
        fetch("http://localhost:9001/data")
            .then((r) => {
                res = r;
            });

        await wait(20);

        expect(res).toBeNull();
        handlers[0].resume();

        await wait(20);
        expect(res).not.toBeNull();

        mockServer.close();
    });

    test('allows changing the pause predicate', async () => {
        const handlers = [
            rest.get('http://localhost:9001/data', (req, res, ctx) => {
                return res(ctx.status(200));
            })
        ]

        const mockServer = setupServer(...handlers);

        mockServer.listen();

        handlers[0].pause((req) => ['green', 'blue'].includes(req.url.searchParams.get('color')!));

        let greenResponse: unknown = null;
        let blueResponse: unknown = null;
        let redResponse: unknown = null;
        
        fetch("http://localhost:9001/data?color=green")
            .then((r) => {
                greenResponse = r;
            });

        fetch("http://localhost:9001/data?color=blue")
            .then((r) => {
                blueResponse = r;
            });
        
        fetch("http://localhost:9001/data?color=red")
            .then((r) => {
                redResponse = r;
            });

        await wait(20);

        expect(greenResponse).toBeNull();
        expect(blueResponse).toBeNull();
        expect(redResponse).not.toBeNull();

        handlers[0].pause((req) => req.url.searchParams.get('color') === 'blue');

        await wait(20);
        expect(greenResponse).not.toBeNull();
        expect(blueResponse).toBeNull();
        expect(redResponse).not.toBeNull();

        handlers[0].resume();
        await wait(20);

        expect(greenResponse).not.toBeNull();
        expect(blueResponse).not.toBeNull();
        expect(redResponse).not.toBeNull();

        mockServer.close();
    })
})

async function wait(time: number) {
    await new Promise((resolve) => setTimeout(resolve, time))
}
