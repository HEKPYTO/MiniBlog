import { db } from '../../db';
import { posts, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import satori from 'satori';
import sharp from 'sharp';
import { getSiteSettings } from '../../lib/settings';

let fontsData = null;

async function getFonts() {
    if (fontsData) return fontsData;
    const weights = [400, 500, 600, 700];
    fontsData = await Promise.all(
        weights.map((weight) =>
            fetch(
                `https://cdn.jsdelivr.net/npm/@fontsource/jost/files/jost-latin-${weight}-normal.woff`,
            ).then((res) => res.arrayBuffer().then((data) => ({ weight, data }))),
        ),
    );
    return fontsData;
}

export async function GET({ params }) {
    const { slug } = params;
    const post = await db
        .select({
            title: posts.title,
            publishedAt: posts.publishedAt,
            readingTime: posts.readingTime,
            tags: posts.tags,
            author: users.username,
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.slug, slug))
        .get();
    if (!post) {
        return new Response('Not Found', { status: 404 });
    }
    const siteSettings = await getSiteSettings();
    const siteName = siteSettings.site_name || 'Miniblog';
    const tags = post.tags
        ? post.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
        : [];
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafc',
                    fontFamily: 'Jost',
                    padding: 0,
                },
                children: [
                    // Top accent bar
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                width: '100%',
                                height: '6px',
                                backgroundColor: '#0f172a',
                            },
                            children: [],
                        },
                    },
                    // Main content area
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                padding: '60px 80px 40px',
                                justifyContent: 'center',
                            },
                            children: [
                                // Date and reading time
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: 24,
                                            color: '#64748b',
                                            fontWeight: 400,
                                            gap: '12px',
                                            marginBottom: '24px',
                                        },
                                        children: [
                                            post.publishedAt
                                                ? new Date(post.publishedAt).toLocaleDateString()
                                                : '',
                                            post.readingTime ? `  ·  ${post.readingTime}` : '',
                                        ].filter(Boolean),
                                    },
                                },
                                // Title
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: post.title.length > 40 ? 52 : 64,
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            lineHeight: 1.15,
                                            letterSpacing: '-0.03em',
                                            marginBottom: '28px',
                                        },
                                        children: post.title,
                                    },
                                },
                                // Tags
                                ...(tags.length > 0
                                    ? [
                                          {
                                              type: 'div',
                                              props: {
                                                  style: {
                                                      display: 'flex',
                                                      flexWrap: 'wrap',
                                                      gap: '10px',
                                                      marginBottom: '12px',
                                                  },
                                                  children: tags.slice(0, 4).map((tag) => ({
                                                      type: 'div',
                                                      props: {
                                                          style: {
                                                              display: 'flex',
                                                              backgroundColor: '#f1f5f9',
                                                              border: '1px solid #e2e8f0',
                                                              borderRadius: '6px',
                                                              padding: '4px 14px',
                                                              fontSize: 20,
                                                              fontWeight: 500,
                                                              color: '#475569',
                                                          },
                                                          children: `#${tag}`,
                                                      },
                                                  })),
                                              },
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    },
                    // Footer
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '28px 80px',
                                borderTop: '1px solid #e2e8f0',
                            },
                            children: [
                                // Author
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            fontSize: 24,
                                            color: '#64748b',
                                            fontWeight: 400,
                                        },
                                        children: `By ${post.author}`,
                                    },
                                },
                                // Site name
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontSize: 28,
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            letterSpacing: '-0.02em',
                                        },
                                        children: siteName,
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            width: 1200,
            height: 630,
            fonts: (await getFonts()).map(({ weight, data }) => ({
                name: 'Jost',
                data,
                weight,
                style: 'normal',
            })),
        },
    );
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(png, {
        headers: {
            'Content-Type': 'image/png',
        },
    });
}
