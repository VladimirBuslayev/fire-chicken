// src/utils/cache.js
// localStorage helpers with silent error swallowing.
// Source: index.legacy.html lines 214-216.
// Note: key prefixes (pb6_cards_, pb7_supa_, etc.) are owned by the
// service layer, not here. These functions are key-agnostic.

const lsGet=k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const lsDel=k=>{try{localStorage.removeItem(k);}catch{}};

export { lsGet, lsSet, lsDel };
