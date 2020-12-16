/**
 * @jest-environment node
 */
import { useFetch } from '../use-fetch';
import { renderToStringWithAsyncData } from '../server';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

describe('useFetch', () => {

    it('should use ssr', async () => {
        const App = () => {
            const { data, loading } = useFetch<any>('https://jsonplaceholder.typicode.com/todos/1', { ssr: true });
            return <div>
                <span>Loading {JSON.stringify(loading)}</span>
                <span>Id {data?.userId}</span>
            </div>
        };

        const { content } = await renderToStringWithAsyncData(<App />, { renderFunction: renderToStaticMarkup });


        expect(content).toEqual('<div><span>Loading false</span><span>Id 1</span></div>');

    });

});