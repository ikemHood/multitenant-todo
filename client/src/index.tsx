/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { lazy, onMount } from 'solid-js'

import { Router } from "@solidjs/router";

const root = document.getElementById('root')
const routes = [
    {
        path: "/",
        component: lazy(() => import("./components/Auth.tsx")),
    },
    {
        path: "/todos",
        component: lazy(() => import("./components/Todos.tsx")),
    }
]

onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('auth');
    if (authToken) {
        localStorage.setItem('token', authToken);
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

render(() => <Router>{routes}</Router>, root!)