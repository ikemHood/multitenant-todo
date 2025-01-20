import { createSignal } from "solid-js"

export default function Auth() {
    const [email, setEmail] = createSignal('')
    const [password, setPassword] = createSignal('')
    const [tenantName, setTenantName] = createSignal('')
    const [domains, setDomains] = createSignal('')
    const [isRegistering, setIsRegistering] = createSignal(false)
    const handleSubmit = async (e: Event) => {

        e.preventDefault()
        try {
            if (isRegistering()) {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email(),
                        password: password(),
                        tenantName: tenantName(),
                        domains: domains()
                    }),
                })
                const data = await response.json()
                console.log(data)
                if (!response.ok) {
                    throw new Error(data.message)
                }
                if (data.redirectUrl) {
                    // Redirect to the tenant's domain
                    window.location.href = data.redirectUrl;
                }
            } else {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email: email(), password: password() }),
                })
                const data = await response.json()
                console.log(data)
                if (!response.ok) {
                    throw new Error(data.message)
                }
                if (data.redirectUrl) {
                    // Redirect to the tenant's domain
                    window.location.href = data.redirectUrl;
                }
            }
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        }
    }

    return <div class="min-h-screen w-screen flex items-center justify-center bg-gray-50">
        <div class="w-[90%] max-w-lg space-y-8 p-8 bg-white rounded-lg shadow-md">
            <h1 class="text-3xl font-bold text-center text-gray-900">Login or Register</h1>
            <form onSubmit={handleSubmit} class="mt-8 space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email()}
                        onChange={(e) => setEmail(e.target.value)}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password()}
                        onChange={(e) => setPassword(e.target.value)}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                {isRegistering() && (<>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Tenant Name</label>
                        <input
                            type="text"
                            value={tenantName()}
                            onChange={(e) => setTenantName(e.target.value)}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Subdomain</label>
                        <input
                            type="text"
                            value={domains()}
                            onChange={(e) => setDomains(e.target.value)}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </>)}
                <div class="flex items-center">
                    <input
                        type="checkbox"
                        checked={isRegistering()}
                        onChange={() => setIsRegistering(!isRegistering())}
                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label class="ml-2 block text-sm text-gray-900">Register</label>
                </div>
                <button
                    type="submit"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Proceed
                </button>
            </form>
        </div>
    </div>
}