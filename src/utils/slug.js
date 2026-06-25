// src/utils/slug.js
// URL-safe slug generator.
// Source: index.legacy.html line 218.

const toSlug  =s=>s.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");

export { toSlug };
