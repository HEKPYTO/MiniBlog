import { lucia } from '../../lib/auth';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST = async ({ request }) => {
    if (process.env.NODE_ENV === 'production' && !process.env.CI) {
        return new Response(null, { status: 403 });
    }

    const formData = await request.formData();
    const username = formData.get('username');

    if (!username) return new Response('Missing username', { status: 400 });

    const user = await db.select().from(users).where(eq(users.username, username)).get();
    if (!user) return new Response('User not found', { status: 404 });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return new Response('OK', {
        status: 200,
        headers: {
            'Set-Cookie': sessionCookie.serialize(),
        },
    });
};
