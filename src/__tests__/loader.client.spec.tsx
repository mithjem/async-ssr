/**
 * @jest-environment jsdom
 */
import { useLoader } from '../use-loader';
import { AsyncManager, ClientQueue } from '../client';
import React from 'react';
import { act, ReactTestRenderer, create } from 'react-test-renderer';
import { getAsyncContext, SHARED_STATE_KEY } from '../context';

describe('useLoader', () => {
    const Context = getAsyncContext();
    it('should use ssr', async () => {
        const App = () => {
            const { data, loading } = useLoader("cache", () => Promise.resolve("Rasmus"), { ssr: true });
            return <div>
                <span>Loading {JSON.stringify(loading)}</span>
                <span>Name {data}</span>
            </div>
        };

        // SIMULATE SERVICE SIDE RENDERING STATE
        const script = document.createElement('script');
        script.id = SHARED_STATE_KEY;
        script.type = "text/async-cache";
        script.textContent = JSON.stringify({ '"cache"': { data: 'Rasmus' } })
        document.head.appendChild(script);
        // 

        let content: ReactTestRenderer;
        act(() => { content = create(<AsyncManager><App /></AsyncManager>) });

        let spans = content!.root.findAllByType('span');

        expect(spans[0].children).toEqual(['Loading ', 'false']);
        expect(spans[1].children).toEqual(['Name ', 'Rasmus']);

    });




});