/** Builds links that also work when the site lives in a sub-folder (GitHub Pages). */
export const url = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
