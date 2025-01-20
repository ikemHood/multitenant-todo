
export interface User {
    id: string;
    email: string;
    password: string;
}

export class UserModel {
    private users: Map<string, User>;

    constructor() {
        this.users = new Map();
    }

    public createUser(user: User) {
        this.users.set(user.id, user);
    }

    public getUser(id: string) {
        return this.users.get(id);
    }

    public updateUser(user: User) {
        this.users.set(user.id, user);
    }

    public deleteUser(id: string) {
        this.users.delete(id);
    }

    public count() {
        return this.users.size;
    }

    public getUsers() {
        return Array.from(this.users.values());
    }

    public getUserByEmail(email: string) {
        return Array.from(this.users.values()).find((user) => user.email === email);
    }

    public login(email: string, password: string) {
        const user = this.getUserByEmail(email);
        if (!user) {
            return null;
        }
        return user.password === password ? user : null;
    }
}