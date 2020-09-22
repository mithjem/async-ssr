/**
 * @jest-environment node
 */
import { useLoader } from '../use-loader';
import { renderToStringWithAsyncData } from '../server';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

describe('Server', () => {

    describe('useLoader', () => {

        it('should use ssr', async () => {
            const App = () => {
                const { data, loading } = useLoader("cache", () => Promise.resolve(200), { ssr: true });
                return <div>
                    <span>Loading {JSON.stringify(loading)}</span>
                    <span>Name {data}</span>
                </div>
            };

            const { content } = await renderToStringWithAsyncData(<App />, renderToStaticMarkup);

            expect(content).toEqual('<div><span>Loading false</span><span>Name 200</span></div>');

        });


        it('should not use', async () => {
            const App = () => {
                const { data, loading } = useLoader("cache", () => Promise.resolve(200), { ssr: false });
                return <div>
                    <span>Loading {JSON.stringify(loading)}</span>
                    {!!data && <span>Name {data}</span>}

                </div>
            };

            const { content } = await renderToStringWithAsyncData(<App />, renderToStaticMarkup);

            expect(content).toEqual('<div><span>Loading true</span></div>');

        });


        it('should not use multi', async () => {

            const Child = () => {
                const { data } = useLoader("cache2", () => Promise.resolve(42));

                return <div>
                    Child {data}
                </div>
            };

            const App = () => {
                const { data, loading } = useLoader("cache", () => Promise.resolve(200), { ssr: true });
                return <div>
                    <span>Loading {JSON.stringify(loading)}</span>
                    {!!data && <span>Name {data}</span>}
                    <Child />
                </div>
            };

            const { content, rounds, data } = await renderToStringWithAsyncData(<App />, renderToStaticMarkup);
            expect(rounds).toEqual(2);
            expect(data).toEqual({ 'cache': { data: 200 }, 'cache2': { data: 42 } });
            expect(content).toEqual('<div><span>Loading false</span><span>Name 200</span><div>Child 42</div></div>');

        });


    });
})