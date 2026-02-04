import markdownit from 'markdown-it';
import Shiki from '@shikijs/markdown-it';

let parser;

export async function getMarkdownParser() {
    if (!parser) {
        parser = markdownit({
            html: true,
            linkify: true,
            typographer: true,
        });

        parser.use(
            await Shiki({
                themes: {
                    light: 'github-light',
                    dark: 'github-dark',
                },
            }),
        );
    }
    return parser;
}
