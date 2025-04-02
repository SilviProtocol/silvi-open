Warning: useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format. This will lead to a mismatch between the initial, non-hydrated UI and the intended UI. To avoid this, useLayoutEffect should only be used in components that render exclusively on the client. See https://reactjs.org/link/uselayouteffect-ssr for common fixes.
    at ShadowPortal (/root/silvi-open/treekipedia-new/frontend/node_modules/next/src/client/components/react-dev-overlay/ui/components/shadow-portal.tsx:5:32)
    at DevOverlay (/root/silvi-open/treekipedia-new/frontend/node_modules/next/src/client/components/react-dev-overlay/ui/dev-overlay.tsx:14:3)
    at ReactDevOverlay (/root/silvi-open/treekipedia-new/frontend/node_modules/next/src/server/dev/next-dev-server.ts:82:10)
    at div
    at Body (/root/silvi-open/treekipedia-new/frontend/node_modules/next/src/server/render.tsx:1263:19)
 GET /search 500 in 3670ms



Build Error


Error: ENOENT: no such file or directory, open '/root/silvi-open/treekipedia-new/frontend/node_modules/engine.io-client/node_modules/ws/wrapper.mjs'

./node_modules/engine.io-client/node_modules/ws/wrapper.mjs

Error: ENOENT: no such file or directory, open '/root/silvi-open/treekipedia-new/frontend/node_modules/engine.io-client/node_modules/ws/wrapper.mjs'
This error occurred during the build process and can only be dismissed by fixing the error.