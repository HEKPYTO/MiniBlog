import markdownit from 'markdown-it';
import Shiki from '@shikijs/markdown-it';

let parserPromise;

export function getMarkdownParser() {
    if (!parserPromise) {
        parserPromise = (async () => {
            const parser = markdownit({
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
            return parser;
        })();
    }
    return parserPromise;
}
