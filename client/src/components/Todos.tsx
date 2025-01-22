import { createSignal, onMount } from "solid-js"
import { env } from '../env'

interface Todo {
    id: string
    title: string
    description: string
    completed: boolean
}

export default function Todos() {
    const [todos, setTodos] = createSignal<Todo[]>([])
    const [todo, setTodo] = createSignal({ title: '', description: '' })

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
    });

    const fetchTodos = async () => {
        const response = await fetch(`${env.VITE_BACKEND_URL}/todos`, {
            headers: getAuthHeaders(),
        })
        const data = await response.json()
        setTodos(data)
    }

    const createTodo = async () => {
        const response = await fetch(`${env.VITE_BACKEND_URL}/todos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(todo()),
        })
        const data = await response.json()
        setTodos([...todos(), data])
    }

    // const updateTodo = async (id: string) => {
    //     const response = await fetch(`${env.VITE_BACKEND_URL}/todos/${id}`, {
    //         method: 'PUT',
    //         headers: getAuthHeaders(),
    //         body: JSON.stringify(todo()),
    //     })
    //     const data = await response.json()
    //     setTodos(todos().map((t) => t.id === id ? data : t))
    // }

    const deleteTodo = async (id: string) => {
        await fetch(`${env.VITE_BACKEND_URL}/todos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        })
        setTodos(todos().filter((t) => t.id !== id))
    }

    const markTodo = async (id: string) => {
        const response = await fetch(`${env.VITE_BACKEND_URL}/todos/${id}/complete`, {
            method: 'PUT',
            headers: getAuthHeaders(),
        })
        const data = await response.json()
        setTodos(todos().map((t) => t.id === id ? data : t))
    }

    onMount(() => {
        fetchTodos()
    })


    return <div class="max-w-4xl mx-auto p-6">
        <div class="mb-6 space-y-4">
            <input
                type="text"
                value={todo().title}
                placeholder="Todo title"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setTodo({ ...todo(), title: e.target.value })}
            />
            <input
                type="text"
                value={todo().description}
                placeholder="Todo description"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setTodo({ ...todo(), description: e.target.value })}
            />
            <button
                onClick={createTodo}
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
                Add Todo
            </button>
        </div>
        <ul class="space-y-4">
            {todos().map((todo) => (
                <div class="bg-white p-6 rounded-lg shadow-md border">
                    <h1 class="text-xl font-bold mb-2">{todo.title}</h1>
                    <p class="text-gray-600 mb-4">{todo.description}</p>
                    <div class="flex space-x-3">
                        <button
                            onClick={() => deleteTodo(todo.id)}
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setTodo(todo)}
                            class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => markTodo(todo.id)}
                            class={`${todo.completed ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded-md text-sm transition duration-200`}
                        >
                            {todo.completed ? 'Undo' : 'Complete'}
                        </button>
                    </div>
                </div>
            ))}
        </ul>
    </div>
}