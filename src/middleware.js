import { lucia } from './lib/auth';
import { verifyRequestOrigin } from 'lucia';
import { defineMiddleware } from 'astro/middleware';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
let ownerSeeded = false;
async function seedOwner() {
    if (ownerSeeded) return;
    const credentials = import.meta.env.OWNER_CREDENTIALS || process.env.OWNER_CREDENTIALS;
    if (!credentials) {
        return;
    }
    const [username, hash] = credentials.split(':');
    if (!username || !hash) return;
    try {
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .get();
        if (!existingUser) {
            const userId = generateId(15);
            await db.insert(users).values({
                id: userId,
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
    if (context.request.method !== 'GET') {
        const originHeader = context.request.headers.get('Origin');
        const hostHeader = context.request.headers.get('Host');
        if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
            return new Response(null, {
                status: 403,
            });
        }
    }
    const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
        context.locals.user = null;
        context.locals.session = null;
        return next();
    }
    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    context.locals.session = session;
    context.locals.user = user;
    return next();
});
