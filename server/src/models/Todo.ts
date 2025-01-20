
export interface Todo {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    ownerId: string;
}

export class TodoModel {
    private todos: Map<string, Todo>;

    constructor() {
        this.todos = new Map();
    }

    public createTodo(todo: Todo) {
        this.todos.set(todo.id, todo);
    }

    public getTodo(id: string, ownerId: string) {
        const todo = this.todos.get(id);
        if (!todo || todo.ownerId !== ownerId) {
            return null;
        }
        return todo;
    }

    public getTodos(ownerId: string) {
        return Array.from(this.todos.values()).filter(todo => todo.ownerId === ownerId);
    }

    public updateTodo(todo: Todo, ownerId: string) {
        const existingTodo = this.todos.get(todo.id);
        if (!existingTodo || existingTodo.ownerId !== ownerId) {
            return;
        }
        this.todos.set(todo.id, todo);
    }

    public deleteTodo(id: string, ownerId: string) {
        const todo = this.todos.get(id);
        if (!todo || todo.ownerId !== ownerId) {
            return;
        }
        this.todos.delete(id);
    }

    public count(ownerId: string) {
        return Array.from(this.todos.values()).filter(todo => todo.ownerId === ownerId).length;
    }

    public markTodoAsCompleted(id: string, ownerId: string) {
        const todo = this.todos.get(id);
        if (!todo || todo.ownerId !== ownerId) {
            return;
        }
        todo.completed = true;
        this.todos.set(id, todo);
    }
}
