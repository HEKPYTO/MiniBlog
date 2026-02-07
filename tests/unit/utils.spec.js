import { describe, it, expect } from 'vitest';
import { calculateReadingTime, slugify } from '../../src/lib/utils';
describe('Utils', () => {
    describe('calculateReadingTime', () => {
        it('calculateReadingTime: Returns "0 min read" for empty text', () => {
            expect(calculateReadingTime('')).toBe('0 min read');
        });
        it('calculateReadingTime: Returns "1 min read" for short text', () => {
            expect(calculateReadingTime('Hello world')).toBe('1 min read');
        });
        it('calculateReadingTime: Calculates reading time correctly for longer text', () => {
            const text = 'word '.repeat(200);
            expect(calculateReadingTime(text)).toBe('1 min read');
            const text2 = 'word '.repeat(300);
            expect(calculateReadingTime(text2)).toBe('2 min read');
            const text3 = 'word '.repeat(1000);
            expect(calculateReadingTime(text3)).toBe('5 min read');
        });
        it('calculateReadingTime: Handles newlines and extra spaces', () => {
            const text = 'word\n'.repeat(200);
            expect(calculateReadingTime(text)).toBe('1 min read');
        });
    });
    describe('slugify', () => {
        it('slugify: Lowercases text', () => {
            expect(slugify('Hello')).toBe('hello');
        });
        it('slugify: Replaces spaces with dashes', () => {
            expect(slugify('Hello World')).toBe('hello-world');
        });
        it('slugify: Removes special characters', () => {
            expect(slugify('Hello @ World!')).toBe('hello-world');
            expect(slugify('C++ Programming')).toBe('c-programming');
        });
        it('slugify: Handles numbers', () => {
            expect(slugify('Post 123')).toBe('post-123');
        });
        it('slugify: Trims dashes from start and end', () => {
            expect(slugify('-Hello-')).toBe('hello');
        });
        it('slugify: Collapses multiple dashes', () => {
            expect(slugify('Hello   World')).toBe('hello-world');
            expect(slugify('Hello---World')).toBe('hello-world');
        });
        it('slugify: Handles foreign characters', () => {
            expect(slugify('café')).toBe('caf');
        });

        it('slugify: Handles empty strings', () => {
            expect(slugify('')).toBe('');
        });

        it('slugify: Handles strings with only special characters', () => {
            expect(slugify('!@#$%^')).toBe('');
        });

        it('slugify: Handles very long strings', () => {
            const long = 'a'.repeat(100);
            expect(slugify(long)).toBe(long);
        });
    });
});
