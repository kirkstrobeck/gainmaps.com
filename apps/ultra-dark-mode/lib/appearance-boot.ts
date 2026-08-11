// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

import {
  DEFAULT_APPEARANCE,
  MODE_STORAGE_KEY,
  ULTRA_STORAGE_KEY,
} from "@/lib/appearance";

/*
  The one script that must run before paint.

  React cannot do this job: by the time the app hydrates, the browser has
  already painted a dark page for a visitor who chose light. So the storage
  read is inlined in <head> as a plain string and stamps both attributes on
  <html> synchronously.

  It is generated from the same constants the app uses, so the keys, the
  defaults and the light-is-never-Ultra rule cannot drift out of sync with
  lib/appearance.ts. It is a string, not a module, because it has to be a
  literal inside dangerouslySetInnerHTML.
*/
export const APPEARANCE_BOOT_SCRIPT = [
  "(function(){",
  "var d=document.documentElement;",
  `var m=${JSON.stringify(DEFAULT_APPEARANCE.mode)};`,
  `var u=${JSON.stringify(DEFAULT_APPEARANCE.ultra)};`,
  "try{",
  `var sm=localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});`,
  `var su=localStorage.getItem(${JSON.stringify(ULTRA_STORAGE_KEY)});`,
  'if(sm==="dark"||sm==="light"){m=sm;}',
  'if(su==="on"||su==="off"){u=su;}',
  "}catch(e){}",
  // Mirrors settle() in lib/appearance.ts — a light page is never Ultra.
  'if(m==="light"){u="off";}',
  "d.dataset.mode=m;",
  "d.dataset.ultra=u;",
  "})();",
].join("");
