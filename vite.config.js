import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import eslintPlugin from 'vite-plugin-eslint'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [
        vue(),
        eslintPlugin(),
        {
            name: 'html-transform',
            transformIndexHtml(html) {
                // if (process.env.NODE_ENV === 'production') {
                //     return html.replace(
                //         '</head>',
                //         `<script>
                //             var _paq = window._paq = window._paq || [];
                //             /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
                //             _paq.push(['trackPageView']);
                //             _paq.push(['enableLinkTracking']);
                //             (function() {
                //             var u="//mtm.nendo.ai/";
                //             _paq.push(['setTrackerUrl', u+'matomo.php']);
                //             _paq.push(['setSiteId', '1']);
                //             var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                //             g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
                //         })();
                //         </script>
                //         </head>`
                //     )
                // }
                return html
            }
        }
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 5173,
        hmr: {
            host: 'localhost',
            port: 5173,
            protocol: 'ws',
        },
    }
})
