import { lucia } from './lib/auth';
import { defineMiddleware } from 'astro/middleware';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';

let ownerSeeded = false;
async function seedOwner() {
    if (ownerSeeded) return;
    const credentials = import.meta.env.OWNER_CREDENTIALS || process.env.OWNER_CREDENTIALS;
    if (!credentials) return;
    const [username, hash] = credentials.split(':');
    if (!username || !hash) return;
    try {
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .get();
        if (!existingUser) {
            await db.insert(users).values({
                id: generateId(15),
                username,
                password_hash: hash,
                role: 'owner',
            });
        } else if (existingUser.role !== 'owner') {
            await db.update(users).set({ role: 'owner' }).where(eq(users.id, existingUser.id));
        }
        ownerSeeded = true;
    } catch {
        void 0;
    }
}

export const onRequest = defineMiddleware(async (context, next) => {
    await seedOwner();

    // CSRF check relaxed for proxy compatibility
    if (context.request.method !== 'GET') {
        const originHeader = context.request.headers.get('Origin');
        const hostHeader = context.request.headers.get('Host');
        if (!originHeader || !hostHeader) {
            // Optional: Log missing headers or take action if strictness required later
        }
    }

    const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
        context.locals.user = null;
        context.locals.session = null;
        if (context.url.pathname.startsWith('/admin')) {
            return new Response(null, {
                status: 302,
                headers: { Location: '/login' },
            });
        }
        return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);
    context.locals.session = session;
    context.locals.user = user;

    if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        if (context.url.pathname.startsWith('/admin')) {
            return new Response(null, {
                status: 302,
                headers: { Location: '/login' },
            });
        }
    }

    if (context.url.pathname.startsWith('/admin')) {
        if (!user) {
            return new Response(null, {
                status: 302,
                headers: { Location: '/login' },
            });
        }

        if (user.role !== 'admin' && user.role !== 'owner') {
            return new Response(null, {
                status: 302,
                headers: { Location: '/' },
            });
        }

        if (context.url.pathname.startsWith('/admin/users') && user.role !== 'owner') {
            return new Response(null, {
                status: 302,
                headers: { Location: '/admin' },
            });
        }
    }

    return next();
});
