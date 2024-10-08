/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: function (config, { isServer, dev }) {
    // config.output.webassemblyModuleFilename =
    //   isServer && !dev
    //     ? "..static/wasm/[name].[moduleHash].wasm"
    //     : "static/wasm/[name].[moduleHash].wasm";

    // config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // config.output.assetModuleFilename = "static/[hash][ext]";

    // config.module.rules.push({
    //   test: /.*\.wasm$/,
    //   type: "asset/resource",
    //   // generator: {
    //   //   filename: "static/wasm/[name].[contenthash][ext]",
    //   // },
    // });

    // config.output.webassemblyModuleFilename =
    //   isServer && !dev
    //     ? "..static/wasm/[name].[moduleHash].wasm"
    //     : "static/wasm/[name].[moduleHash].wasm";

    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";

    config.module.rules.push({
      test: /.*\.wasm$/,
      type: "asset/resource",
    });

    config.output.assetModuleFilename = "static/[hash][ext]";

    return config;
  },
};

export default nextConfig;
