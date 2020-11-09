/**
 * @jest-environment jsdom
 */
import { useLoader } from '../use-loader';
import { AsyncManager } from '../client';
import React, { useState } from 'react';
import { act, ReactTestRenderer, create } from 'react-test-renderer';
import { SHARED_STATE_KEY } from '../context';
import {
    cleanup,
    fireEvent,
    render,
    waitFor,
    act as tlact
} from "@testing-library/react";


describe('useLoader', () => {

    it('should use ssr', async () => {

        const fn = jest.fn().mockResolvedValueOnce("Rasmus");

        const App = () => {
            const { data, loading } = useLoader("cache", fn, { ssr: true, refreshClient: false });
            return <div>
                <span>Loading {JSON.stringify(loading)}</span>
                <span>Name {data}</span>
            </div>
        };

        // SIMULATE SERVICE SIDE RENDERING STATE
        const script = document.createElement('script');
        script.id = SHARED_STATE_KEY;
        script.type = "text/async-cache";
        script.textContent = JSON.stringify({ 'cache': { data: 'Rasmus' } })
        document.head.appendChild(script);
        // 

        let content: ReactTestRenderer;
        act(() => { content = create(<AsyncManager><App /></AsyncManager>) });

        let spans = content!.root.findAllByType('span');

        expect(spans[0].children).toEqual(['Loading ', 'false']);
        expect(spans[1].children).toEqual(['Name ', 'Rasmus']);

        await waitFor(() => expect(fn).toHaveBeenCalledTimes(0));



    });


    it('should refresh', async () => {

        const fn = jest.fn().mockResolvedValueOnce("Rasmus");

        const App = () => {
            const { data, loading } = useLoader("cache", fn, { ssr: true, refreshClient: true });
            return <div>
                <span>Loading {JSON.stringify(loading)}</span>
                <span>Name {data}</span>
            </div>
        };

        // SIMULATE SERVICE SIDE RENDERING STATE
        const script = document.createElement('script');
        script.id = SHARED_STATE_KEY;
        script.type = "text/async-cache";
        script.textContent = JSON.stringify({ 'cache': { data: 'Rasmus' } })
        document.head.appendChild(script);


        // const { getByText, getByTestId, findByTestId } = render(<AsyncManager><App /></AsyncManager>);

        render(<AsyncManager><App /></AsyncManager>);
        await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));



    });



    it('should not initiate loading, when not enabled', async () => {

        const fn = jest.fn().mockResolvedValueOnce("Rasmus");

        const App = () => {
            const [enabled, setEnabled] = useState(false);
            const { data, loading } = useLoader("cache3", fn, { ssr: false, enabled });
            return <div>
                <button onClick={() => setEnabled(!enabled)}>Fetch</button>
                <span data-testid="loading">Loading {JSON.stringify(loading)}</span>
                {data && <span data-testid="data">Name {data}</span>}
            </div>
        };


        const { getByText, getByTestId, findByTestId } = render(<AsyncManager><App /></AsyncManager>);

        expect(getByTestId('loading').textContent).toEqual('Loading false');
        await expect(findByTestId("data")).rejects.toThrow();

        const btn = getByText('Fetch');
        tlact(() => {
            fireEvent.click(btn);
        })


        await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
        expect((await findByTestId("data")).textContent).toEqual("Name Rasmus");


    });

    afterEach(cleanup);

});