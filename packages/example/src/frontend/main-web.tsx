// import 'core-js'
import React from 'react'
import { hydrate } from 'react-dom'
import App from './app'
import { AsyncManager } from '@mithjem/async-ssr';


const root = document.getElementById('app')
hydrate(<AsyncManager>
    <App />
</AsyncManager>, root)
