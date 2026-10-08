/**
 * Design variants: same layout, different color and band treatment.
 * Tokens for each live in app/globals.css under [data-variant="..."].
 * Once one is chosen, set it as the default there and delete the switcher.
 */

export const VARIANTS = [
  { id: "original", label: "Original", note: "Black bands, pewter to prussian titles" },
  { id: "prussian", label: "Prussian", note: "Bands and buttons in Prussian Blue" },
  { id: "gradient", label: "Gradient", note: "Brand phthalo to violet accents" },
  { id: "light", label: "Light", note: "Gray bands instead of black" },
] as const;

export type VariantId = (typeof VARIANTS)[number]["id"];

const ids = VARIANTS.map((v) => v.id);

/** Reads ?variant= or the saved choice and applies it before first paint. */
export const VARIANT_BOOT = `(function(){var ids=${JSON.stringify(ids)};var v=null;try{v=new URLSearchParams(location.search).get("variant")}catch(e){}try{if(ids.indexOf(v)>-1){localStorage.setItem("gg-variant",v)}else{v=localStorage.getItem("gg-variant")}}catch(e){}if(ids.indexOf(v)>-1){document.documentElement.dataset.variant=v}})()`;
