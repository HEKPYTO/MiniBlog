import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function calculateReadingTime(text) {
    if (!text || !text.trim()) return '0 min read';
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}
export function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
            .replace(/\s+/g, '-')     
            .replace(/[^\w-]+/g, '') 
            .replace(/--+/g, '-')   
            .replace(/^-+/, '')       
            .replace(/-+$/, '');      
        }
