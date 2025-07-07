import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEmbedUrl(url: string): string {
    if (!url) return '';

    let videoId = '';
    
    try {
        const urlObj = new URL(url);
        
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.includes('/embed/')) {
                return url; // It's already an embed URL
            }
            if (urlObj.pathname.includes('/watch')) {
                videoId = urlObj.searchParams.get('v') || '';
            }
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.substring(1);
        }
    } catch (error) {
        // Fallback for non-URL strings or invalid URLs
        return url;
    }

    if (videoId) {
        // Remove any extra query params from the videoId
        videoId = videoId.split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // Return the original URL if it's not a recognizable YouTube link or processing fails
    return url;
}
