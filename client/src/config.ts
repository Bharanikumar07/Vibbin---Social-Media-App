export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Remove leading slash if both have it to avoid double slash, though usually browsers handle it.
    // Cleanest: ensure API_URL doesn't end in slash, path doesn't start.
    // But simple concatenation is robust enough for now if we assume API_URL has no trailing slash.
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
