if(!self.define){let e,i={};const n=(n,s)=>(n=new URL(n+".js",s).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,r)=>{const d=e||("document"in self?document.currentScript.src:"")||location.href;if(i[d])return;let t={};const c=e=>n(e,d),o={module:{uri:d},exports:t,require:c};i[d]=Promise.all(s.map((e=>o[e]||c(e)))).then((e=>(r(...e),t)))}}define(["./workbox-7369c0e1"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-1f4a3b47.css",revision:null},{url:"assets/index-c955c551.js",revision:null},{url:"images/img.html",revision:"8c237751c1fec1b824962df8dfd03333"},{url:"index.html",revision:"9aabba350c560bbcbb94b25ffa39ab1b"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"manifest/icon-192x192.png",revision:"ca5dbd703b26c22d66840ffb06fc5022"},{url:"manifest/icon-256x256.png",revision:"7fb723588e331432135dafc09774a43d"},{url:"manifest/icon-384x384.png",revision:"c8c3340b46e834ae7517587d93c3ead8"},{url:"manifest/icon-512x512.png",revision:"b4bb68ed82110ec89e35dbf6fe6ea2af"},{url:"manifest.webmanifest",revision:"80066e8fd2f2ddf9dd88ddda35598919"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));