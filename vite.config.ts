import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const enableCloudflare = process.env.CLOUDFLARE_VITE === "1";

  return {
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      rollupOptions: {
        external: ["cloudflare:sockets"],
      },
    },
    server: {
      port: 3000,
      allowedHosts: ["timeline.lexicon.website", "localhost"],
    },
    plugins: [
      ...(enableCloudflare ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
      devtools(),
      tanstackStart(),
      // https://tanstack.com/start/latest/docs/framework/react/guide/hosting
      nitro(),
      viteReact(),
      tailwindcss(),
    ],
  };
});
