import { lucia } from '../../lib/auth';
export async function POST(context) {
    if (!context.locals.session) {
        return new Response(null, {
            status: 401,
        });
    }
    try {
        await lucia.invalidateSession(context.locals.session.id);
    } catch {
        void 0;
    }
    const sessionCookie = lucia.createBlankSessionCookie();
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return context.redirect('/');
}
export async function GET(context) {
    return context.redirect('/');
}
