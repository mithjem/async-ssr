import React, { useRef, useState } from 'react';
import { useLoader, useFetch } from '@mithjem/async-ssr';

export default function App() {

    const [_, doRender] = useState(0);
    const [refresh, setRefresh] = useState(false)

    const renderCount = useRef(0);

    const { loading, error, data } = useFetch<any>('http://ip.jsontest.com/', {
        refreshClient: refresh,
        ssr: true
    });

    renderCount.current++;

    console.log(loading, data);

    return <div>
        {loading && "Loading..."}
        {error && <div>Got an error {error.message}</div>}
        {data && <div>You ip address is: {data.ip}</div>}
        <div>
            Render count {renderCount.current}
        </div>
        <button onClick={() => doRender(renderCount.current + 1)}>Rerender</button>
        <button onClick={() => setRefresh(!refresh)}>Refresh</button>
    </div>
}

