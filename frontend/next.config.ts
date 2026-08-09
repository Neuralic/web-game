import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "robohash.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tr.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t0.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t1.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t2.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t3.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t4.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t5.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t6.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t7.rbxcdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thumbnails.roblox.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fwjvihdbbnksqnhcsuse.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
