// src/utils/sort.js
// Card pricing accessor and sort comparators.
// Source: index.legacy.html lines 267-277, 279-293.
//
// sortCards receives checkOwned as an argument — it does NOT import isCardOwned.

import { PRICE_VARIANT_ORDER } from '../constants/config.js';
import { SET_ORDER } from '../constants/setOrder.js';

const getBestPrice=card=>{
  const p=card&&card.pricing&&card.pricing.tcgplayer;
  if(!p)return null;
  for(const k of PRICE_VARIANT_ORDER){
    if(p[k]&&p[k].marketPrice!=null)return{amount:p[k].marketPrice,variant:k,prices:{low:p[k].lowPrice,mid:p[k].midPrice,high:p[k].highPrice}};
  }
  const keys=Object.keys(p).filter(k=>k!=="updated"&&k!=="unit");
  const first=keys[0];
  if(first&&p[first]&&p[first].marketPrice!=null)return{amount:p[first].marketPrice,variant:first,prices:{low:p[first].lowPrice,mid:p[first].midPrice,high:p[first].highPrice}};
  return null;
};

const sortCards=(arr,sortBy,checkOwned)=>{
  if(!arr||!arr.length)return arr;const a2=arr.slice();
  const priceOf=c=>{const p=getBestPrice(c);return p?p.amount:null;};
  const byName=(a,b)=>(a.name||"").localeCompare(b.name||"");
  const byDate=(a,b)=>{const oa=SET_ORDER[a.set&&a.set.id]??999,ob=SET_ORDER[b.set&&b.set.id]??999;return oa===ob?byName(a,b):oa-ob;};
  switch(sortBy){
    case"price-desc":return a2.sort((a,b)=>{const pa=priceOf(a),pb=priceOf(b);if(pa===null&&pb===null)return byName(a,b);if(pa===null)return 1;if(pb===null)return-1;return pb-pa||byName(a,b);});
    case"price-asc": return a2.sort((a,b)=>{const pa=priceOf(a),pb=priceOf(b);if(pa===null&&pb===null)return byName(a,b);if(pa===null)return 1;if(pb===null)return-1;return pa-pb||byName(a,b);});
    case"missing":   return a2.sort((a,b)=>{const ao=checkOwned(a),bo=checkOwned(b);return ao!==bo?(ao?1:-1):byName(a,b);});
    case"owned":     return a2.sort((a,b)=>{const ao=checkOwned(a),bo=checkOwned(b);return ao!==bo?(ao?-1:1):byName(a,b);});
    case"date-desc": return a2.sort((a,b)=>byDate(b,a));
    case"date-asc":  return a2.sort(byDate);
    default:return a2;
  }
};

export { getBestPrice, sortCards };
