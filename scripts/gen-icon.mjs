// Generates public/icon.png (1024x1024) using only Node + Canvas API via Electron
// Run: node scripts/gen-icon.mjs
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public");

const SIZE = 1024;
const c = createCanvas(SIZE, SIZE);
const ctx = c.getContext("2d");

// Background
const bg = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
bg.addColorStop(0, "#0E0E12");
bg.addColorStop(1, "#050506");
ctx.fillStyle = bg;
ctx.beginPath();
ctx.roundRect(0, 0, SIZE, SIZE, 200);
ctx.fill();

// Outer ring
ctx.strokeStyle = "rgba(200,169,126,0.35)";
ctx.lineWidth = 6;
ctx.beginPath();
ctx.arc(512, 512, 380, 0, Math.PI * 2);
ctx.stroke();

// Inner ring
ctx.strokeStyle = "rgba(200,169,126,0.15)";
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(512, 512, 300, 0, Math.PI * 2);
ctx.stroke();

// Circuit tick marks on outer ring
for (let i = 0; i < 24; i++) {
  const angle = (i / 24) * Math.PI * 2;
  const r1 = 370, r2 = i % 6 === 0 ? 340 : 355;
  ctx.strokeStyle = i % 6 === 0 ? "rgba(200,169,126,0.8)" : "rgba(200,169,126,0.3)";
  ctx.lineWidth = i % 6 === 0 ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(512 + Math.cos(angle) * r1, 512 + Math.sin(angle) * r1);
  ctx.lineTo(512 + Math.cos(angle) * r2, 512 + Math.sin(angle) * r2);
  ctx.stroke();
}

// Glow
const glow = ctx.createRadialGradient(512, 512, 0, 512, 512, 280);
glow.addColorStop(0, "rgba(200,169,126,0.18)");
glow.addColorStop(0.5, "rgba(200,169,126,0.06)");
glow.addColorStop(1, "transparent");
ctx.fillStyle = glow;
ctx.beginPath();
ctx.arc(512, 512, 280, 0, Math.PI * 2);
ctx.fill();

// "Sr" text
ctx.fillStyle = "#C8A97E";
ctx.font = "bold 320px -apple-system, system-ui, monospace";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.shadowColor = "rgba(200,169,126,0.5)";
ctx.shadowBlur = 40;
ctx.fillText("Sr", 512, 500);

// Subtitle
ctx.shadowBlur = 0;
ctx.fillStyle = "rgba(200,169,126,0.45)";
ctx.font = "500 52px -apple-system, system-ui, monospace";
ctx.letterSpacing = "12px";
ctx.fillText("STRONTIUM", 512, 700);

writeFileSync(path.join(OUT, "icon.png"), c.toBuffer("image/png"));
console.log("✓ icon.png written");
