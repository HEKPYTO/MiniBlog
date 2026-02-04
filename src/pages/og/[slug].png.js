import { db } from '../../db';
import { posts, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import satori from 'satori';
import sharp from 'sharp';

async function getFont() {
    const response = await fetch(
        'https://github.com/google/fonts/raw/main/apache/robotoslab/RobotoSlab-Bold.ttf',
    );
    return await response.arrayBuffer();
}
const fontData = await getFont();
export async function GET({ params }) {
    const { slug } = params;
    const post = await db
        .select({
            title: posts.title,
            publishedAt: posts.publishedAt,
            author: users.username,
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.slug, slug))
        .get();
    if (!post) {
        return new Response('Not Found', { status: 404 });
    }
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundImage: 'linear-gradient(to bottom, #dbf4ff, #fff1f1)',
                    fontSize: 60,
                    letterSpacing: -2,
                    fontWeight: 700,
                    textAlign: 'center',
                },
                children: [
                    {
                        type: 'div',
                        props: {
                            style: {
                                backgroundImage:
                                    'linear-gradient(90deg, rgb(0, 124, 240), rgb(0, 223, 216))',
                                backgroundClip: 'text',
                                '-webkit-background-clip': 'text',
                                color: 'transparent',
                                padding: '20px 40px',
                            },
                            children: post.title,
                        },
                    },
                    {
                        type: 'div',
                        props: {
                            style: {
                                fontSize: 30,
                                marginTop: 20,
                                color: '#333',
                            },
                            children: `By ${post.author} • ${new Date(post.publishedAt).toLocaleDateString()}`,
                        },
                    },
                ],
            },
        },
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Roboto Slab',
                    data: fontData,
                    style: 'normal',
                },
            ],
        },
    );
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(png, {
        headers: {
            'Content-Type': 'image/png',
        },
    });
}
