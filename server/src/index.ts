import { Context, Hono, Next } from 'hono'
import { sign, verify } from 'hono/jwt'
import { cors } from 'hono/cors'
import { Tenant, TenantModel } from './models/Tenants'
import { TodoModel } from './models/Todo'
import { UserModel } from './models/user'

type UserContext = {
  user: { tenantId: string; id: string };
};

type AppEnv = {
  Variables: UserContext;
};

const app = new Hono<AppEnv>()

function isLocalhost(origin: string) {
  return origin.includes('localhost') || origin.includes('127.0.0.1')
}

app.use('*', cors({
  origin: (origin) => {
    const rootDomain = process.env.ROOT_DOMAIN;

    if (isLocalhost(origin) || isLocalhost(rootDomain!)) return origin;
    if (!origin || !rootDomain) return null;
    return origin === `https://${rootDomain}` ||
      origin.endsWith(`.${rootDomain}`) ? origin : null;

  },
  credentials: true
}))

const tenants = new TenantModel()
const users = new UserModel()

const env = {
  JWT_SECRET: Bun.env.JWT_SECRET || 'secret'
}

const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401)
  }
  const auth = await verify(token, env.JWT_SECRET)
  if (!auth) {
    return c.json({ message: 'Unauthorized' }, 401)
  }
  c.set('user', auth as { tenantId: string; id: string })
  await next()
}

app.post('/register', async (c) => {
  const { email, password, tenantName, domains } = await c.req.json()
  const user = users.getUserByEmail(email)
  if (user) {
    return c.json({ message: 'User already exists' }, 400)
  }

  const subdomain = domains.trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return c.json({ message: 'Invalid subdomain format' }, 400)
  }

  const id = crypto.randomUUID()
  const tenantId = crypto.randomUUID()
  const hashedPassword = await Bun.password.hash(password)
  users.createUser({ id, email, password: hashedPassword })

  const fullDomain = `https://${subdomain}.${process.env.ROOT_DOMAIN}`

  tenants.createTenant({
    id: tenantId,
    name: tenantName,
    domains: [fullDomain],
    ownerId: id,
    todos: new TodoModel()
  })

  const token = await sign({ id, tenantId }, env.JWT_SECRET)
  const redirectUrl = `${fullDomain}/todos?auth=${token}`

  return c.json({
    message: 'User created',
    user: { ...users.getUser(id), password: undefined },
    tenant: { ...tenants.getTenant(tenantId) },
    redirectUrl,
    token
  })
})

app.post('/login', async (c) => {
  const { email, password, tenantId } = await c.req.json()

  const user = users.getUserByEmail(email)
  if (!user) {
    return c.json({ message: 'Incorrect email or password' }, 401)
  }
  const verified = await Bun.password.verify(password, user.password)
  if (!verified) {
    return c.json({ message: 'Incorrect email or password' }, 401)
  }


  let tenant: Tenant | undefined
  if (tenantId) {
    tenant = tenants.getTenant(tenantId)
  }

  if (!tenant) {
    tenant = tenants.getTenantByOwnerId(user.id)
  }

  const token = await sign({ id: user.id, tenantId: tenant?.id }, env.JWT_SECRET)

  const redirectUrl = tenant?.domains[0]
    ? `${tenant.domains[0]}/todos?auth=${token}`
    : null

  return c.json({
    token,
    tenant,
    redirectUrl,
    message: 'User logged in',
    user: { ...user, password: undefined },
  })
})

app.post('/tenant/create', authMiddleware, async (c) => {
  const user = c.get('user')
  const { name, domains } = await c.req.json()
  const id = crypto.randomUUID()

  const tenant = tenants.getTenantByOwnerId(user.id)

  if (tenant) {
    return c.json({
      message: 'You already have a tenant',
      tenant: {
        ...tenant,
        owner: { ...users.getUser(tenant.ownerId), password: undefined },
        todos: undefined, ownerId: undefined
      }
    }, 400)
  }

  tenants.createTenant({
    id,
    name,
    domains: domains.split(','),
    ownerId: user.id,
    todos: new TodoModel()
  })

  return c.json({
    message: 'Tenant created',
    tenant: {
      ...tenants.getTenant(id),
      owner: { ...users.getUser(user.id), password: undefined },
      todos: undefined, ownerId: undefined
    }
  })
})

app.get('/tenant/:id', (c) => {
  const id = c.req.param('id')
  const tenant = tenants.getTenant(id)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  return c.json({
    ...tenants.getTenant(id),
    owner: { ...users.getUser(tenant.ownerId), password: undefined },
    todos: undefined, ownerId: undefined
  })
})

app.get('/todos', authMiddleware, async (c: Context<AppEnv>) => {
  const user = c.get('user')
  const tenantId = user.tenantId || c.req.header('Tenant')
  const tenant = tenants.getTenant(tenantId!)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  return c.json(tenant.todos.getTodos(user.id))
})

app.post('/todos', authMiddleware, async (c) => {
  const user = c.get('user')
  const tenantId = user.tenantId || c.req.header('Tenant')
  const tenant = tenants.getTenant(tenantId!)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  const { title, description } = await c.req.json()
  if (!title || !description) {
    return c.json({ message: 'Title and description are required' }, 400)
  }
  const id = crypto.randomUUID()
  const todo = { id, title, description, completed: false, ownerId: user.id }
  tenant.todos.createTodo(todo)

  return c.json(todo)
})

app.get('/todos/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const tenantId = user.tenantId || c.req.header('Tenant')
  const tenant = tenants.getTenant(tenantId!)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  const todo = tenant.todos.getTodo(c.req.param('id'), user.id)
  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404)
  }
  return c.json(todo)
})

app.put('/todos/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const tenantId = user.tenantId || c.req.header('Tenant')
  const tenant = tenants.getTenant(tenantId!)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  const { title, description } = await c.req.json()
  const todo = tenant.todos.getTodo(c.req.param('id'), user.id)
  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404)
  }
  const updatedTodo = { ...todo, title, description }
  tenant.todos.updateTodo(updatedTodo, user.id)

  return c.json(updatedTodo)
})

app.delete('/todos/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const tenantId = user.tenantId || c.req.header('Tenant')
  const tenant = tenants.getTenant(tenantId!)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  const todo = tenant.todos.getTodo(c.req.param('id'), user.id)
  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404)
  }
  tenant.todos.deleteTodo(todo.id, user.id)
  return c.json({ message: 'Todo deleted' })
})

app.put('/todos/:id/complete', authMiddleware, async (c) => {
  const user = c.get('user')
  const tenantId = user.tenantId || c.req.header('Tenant')
  const tenant = tenants.getTenant(tenantId!)
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404)
  }
  const todo = tenant.todos.getTodo(c.req.param('id'), user.id)
  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404)
  }
  const updatedTodo = { ...todo, completed: true }
  tenant.todos.updateTodo(updatedTodo, user.id)
  return c.json(updatedTodo)
})

app.get('/tenant/validate', async (c) => {
  const host = c.req.header('Host');
  if (!host) {
    return c.json({ message: 'Invalid request' }, 400);
  }

  // Skip validation for root domain
  if (host === process.env.ROOT_DOMAIN) {
    return c.json({ valid: true });
  }

  const tenant = tenants.getTenantByDomain(host);
  if (!tenant) {
    return c.json({ message: 'Tenant not found' }, 404);
  }

  return c.json({ valid: true });
});

app.get('/', (c) => {
  return c.text('H3ll0 Mvd3rfvk3r!')
})

app.get('*', (c) => {
  return c.redirect(`https://ikem.dev`, 301)
})

export default app
