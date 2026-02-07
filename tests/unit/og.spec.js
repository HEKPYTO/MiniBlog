import { describe, it, expect, beforeAll } from 'vitest';
import satori from 'satori';
import sharp from 'sharp';

describe('OG Image Generation', () => {
    let fontData;

    beforeAll(async () => {
        const res = await fetch(
            'https://cdn.jsdelivr.net/npm/@fontsource/jost/files/jost-latin-400-normal.woff',
        );
        fontData = await res.arrayBuffer();
    });

    const fonts = () => [{ name: 'Jost', data: fontData, weight: 400, style: 'normal' }];

    it('satori generates valid SVG from virtual DOM', async () => {
        const svg = await satori(
            {
                type: 'div',
                props: {
                    style: { display: 'flex', fontSize: 40 },
                    children: 'Hello World',
                },
            },
            {
                width: 1200,
                height: 630,
                fonts: fonts(),
            },
        );
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox="0 0 1200 630"');
        expect(svg).toContain('<path');
    });

    it('sharp converts SVG to PNG buffer', async () => {
        const svg =
            '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">' +
            '<rect fill="red" width="100" height="100"/></svg>';
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        expect(png[0]).toBe(0x89);
        expect(png[1]).toBe(0x50);
        expect(png[2]).toBe(0x4e);
        expect(png[3]).toBe(0x47);
    });

    it('satori + sharp pipeline produces valid PNG', async () => {
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
                        fontWeight: 700,
                        textAlign: 'center',
                    },
                    children: [
                        {
                            type: 'div',
                            props: {
                                style: { padding: '20px 40px' },
                                children: 'Test Post Title',
                            },
                        },
                        {
                            type: 'div',
                            props: {
                                style: { fontSize: 30, marginTop: 20, color: '#333' },
                                children: 'By author • 1/1/2025',
                            },
                        },
                    ],
                },
            },
            { width: 1200, height: 630, fonts: fonts() },
        );
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        expect(png[0]).toBe(0x89);
        expect(png[1]).toBe(0x50);
        expect(png[2]).toBe(0x4e);
        expect(png[3]).toBe(0x47);
        expect(png.length).toBeGreaterThan(1000);
    });
});
