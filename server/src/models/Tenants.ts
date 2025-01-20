import { TodoModel } from "./Todo";

export interface Tenant {
    id: string;
    name: string;
    ownerId: string;
    domains: string[];
    todos: TodoModel;
}

export class TenantModel {
    private tenants: Map<string, Tenant>;

    constructor() {
        this.tenants = new Map();
    }

    public createTenant(tenant: Tenant) {
        this.tenants.set(tenant.id, tenant);
    }

    public getTenant(id: string) {
        return this.tenants.get(id);
    }

    public getTenantByDomain(domain: string) {
        return Array.from(this.tenants.values()).find(tenant => tenant.domains.includes(domain));
    }

    public getTenantByOwnerId(ownerId: string) {
        return Array.from(this.tenants.values()).find(tenant => tenant.ownerId === ownerId);
    }

    public updateTenant(tenant: Tenant) {
        this.tenants.set(tenant.id, tenant);
    }

    public deleteTenant(id: string) {
        this.tenants.delete(id);
    }

    public count() {
        return this.tenants.size;
    }
}
