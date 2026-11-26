import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const anyIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#C2412D"/>
  <g fill="#FFF7F4">
    <rect x="78" y="220" width="52" height="72" rx="10"/>
    <rect x="130" y="196" width="40" height="120" rx="10"/>
    <rect x="170" y="244" width="172" height="24" rx="12"/>
    <rect x="342" y="196" width="40" height="120" rx="10"/>
    <rect x="394" y="220" width="52" height="72" rx="10"/>
  </g>
</svg>`;

const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#C2412D"/>
  <g fill="#FFF7F4" transform="translate(256 256) scale(0.62) translate(-256 -256)">
    <rect x="78" y="220" width="52" height="72" rx="10"/>
    <rect x="130" y="196" width="40" height="120" rx="10"/>
    <rect x="170" y="244" width="172" height="24" rx="12"/>
    <rect x="342" y="196" width="40" height="120" rx="10"/>
    <rect x="394" y="220" width="52" height="72" rx="10"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
await sharp(Buffer.from(anyIcon)).png().toFile("public/icons/icon-512.png");
await sharp(Buffer.from(anyIcon)).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(maskable)).png().toFile("public/icons/icon-maskable-512.png");
console.log("icons written");
