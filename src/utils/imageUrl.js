// src/utils/imageUrl.js
// TCGdex image URL builders.
// Source: index.legacy.html lines 259 (imgSmall) and 263 (imgLarge).
//
// TCGdex returns a base image URL; these append the quality/format suffix.
// Callers receive null when card.image is absent and must handle gracefully.

const imgSmall = card => card && card.image ? `${card.image}/low.webp`  : null;
const imgLarge = card => card && card.image ? `${card.image}/high.webp` : null;

export { imgSmall, imgLarge };
