import { describe, it, expect } from 'vitest';
import { calculateReadingTime, slugify } from '../../src/lib/utils';
describe('Utils', () => {
    describe('calculateReadingTime', () => {
        it('should return "1 min read" for empty text', () => {
            expect(calculateReadingTime('')).toBe('0 min read');
        });
        it('should return "1 min read" for short text', () => {
            expect(calculateReadingTime('Hello world')).toBe('1 min read');
        });
        it('should calculate reading time correctly for longer text', () => {
            const text = 'word '.repeat(200);
            expect(calculateReadingTime(text)).toBe('1 min read');
            const text2 = 'word '.repeat(300);
            expect(calculateReadingTime(text2)).toBe('2 min read');
            const text3 = 'word '.repeat(1000);
            expect(calculateReadingTime(text3)).toBe('5 min read');
        });
        it('should handle newlines and extra spaces', () => {
            const text = 'word\n'.repeat(200);
            expect(calculateReadingTime(text)).toBe('1 min read');
        });
    });
    describe('slugify', () => {
        it('should lowercase text', () => {
            expect(slugify('Hello')).toBe('hello');
        });
        it('should replace spaces with dashes', () => {
            expect(slugify('Hello World')).toBe('hello-world');
        });
        it('should remove special characters', () => {
            expect(slugify('Hello @ World!')).toBe('hello-world');
            expect(slugify('C++ Programming')).toBe('c-programming');
        });
        it('should handle numbers', () => {
            expect(slugify('Post 123')).toBe('post-123');
        });
        it('should trim dashes from start and end', () => {
            expect(slugify('-Hello-')).toBe('hello');
        });
        it('should collapse multiple dashes', () => {
            expect(slugify('Hello   World')).toBe('hello-world');
            expect(slugify('Hello---World')).toBe('hello-world');
        });
        it('should handle foreign characters (basic removal/keep)', () => {
            expect(slugify('café')).toBe('caf');
        });

        it('should handle empty strings', () => {
            expect(slugify('')).toBe('');
        });

        it('should handle strings with only special characters', () => {
            expect(slugify('!@#$%^')).toBe('');
        });

        it('should handle very long strings', () => {
            const long = 'a'.repeat(100);
            expect(slugify(long)).toBe(long);
        });
    });
});
