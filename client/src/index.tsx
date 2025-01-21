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

// Add tenant validation
async function validateTenant() {
    const hostname = window.location.hostname;
    const rootDomain = import.meta.env.VITE_ROOT_DOMAIN;

    // Skip validation for root domain
    if (hostname === rootDomain) {
        return true;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tenant/validate`, {
            headers: {
                'Host': hostname
            }
        });

        if (!response.ok) {
            // Redirect to main domain if tenant doesn't exist
            window.location.href = `https://${rootDomain}`;
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error validating tenant:', error);
        window.location.href = `https://${rootDomain}`;
        return false;
    }
}

onMount(async () => {
    // First validate the tenant
    const isValid = await validateTenant();
    if (!isValid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('auth');
    if (authToken) {
        localStorage.setItem('token', authToken);
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

render(() => <Router>{routes}</Router>, root!)