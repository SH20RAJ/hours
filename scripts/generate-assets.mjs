import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");

const colors = {
	ink: "#111513",
	paper: "#f5f6f1",
	accent: "#ef8f45",
	green: "#52b788",
	blue: "#6d8cff",
};

function iconSvg(size, { maskable = false } = {}) {
	const padding = maskable ? 58 : 34;
	const center = 256;
	const radius = 174 - padding / 3;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
		<rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="${colors.ink}"/>
		<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${colors.accent}" stroke-width="36" stroke-linecap="round"/>
		<path d="M256 132v126l92 58" fill="none" stroke="${colors.paper}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
		<circle cx="256" cy="256" r="19" fill="${colors.green}"/>
		<text x="256" y="420" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="800" fill="${colors.paper}">Hours</text>
	</svg>`;
}

function ogSvg() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
		<rect width="1200" height="630" fill="${colors.paper}"/>
		<rect x="70" y="70" width="1060" height="490" rx="34" fill="${colors.ink}"/>
		<circle cx="250" cy="315" r="118" fill="none" stroke="${colors.accent}" stroke-width="26" stroke-linecap="round"/>
		<path d="M250 220v96l72 45" fill="none" stroke="${colors.paper}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
		<circle cx="250" cy="315" r="14" fill="${colors.green}"/>
		<text x="420" y="275" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="900" fill="${colors.paper}">Hours</text>
		<text x="424" y="350" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="${colors.accent}">Digital wellbeing for skills</text>
		<text x="424" y="414" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#dbe4dc">Track practice, visualize your day, and hit your learning goals.</text>
		<rect x="424" y="454" width="118" height="12" rx="6" fill="${colors.green}"/>
		<rect x="558" y="454" width="168" height="12" rx="6" fill="${colors.blue}"/>
		<rect x="742" y="454" width="92" height="12" rx="6" fill="${colors.accent}"/>
	</svg>`;
}

function createIco(pngBuffers) {
	const headerSize = 6;
	const directorySize = pngBuffers.length * 16;
	let imageOffset = headerSize + directorySize;
	const header = Buffer.alloc(headerSize);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(pngBuffers.length, 4);

	const entries = pngBuffers.map(({ size, buffer }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size === 256 ? 0 : size, 0);
		entry.writeUInt8(size === 256 ? 0 : size, 1);
		entry.writeUInt8(0, 2);
		entry.writeUInt8(0, 3);
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(buffer.length, 8);
		entry.writeUInt32LE(imageOffset, 12);
		imageOffset += buffer.length;
		return entry;
	});

	return Buffer.concat([header, ...entries, ...pngBuffers.map(({ buffer }) => buffer)]);
}

async function pngFromSvg(svg, size) {
	return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

await mkdir(publicDir, { recursive: true });

await writeFile(path.join(publicDir, "favicon.svg"), iconSvg(512));
await sharp(Buffer.from(iconSvg(192))).png().toFile(path.join(publicDir, "icon-192.png"));
await sharp(Buffer.from(iconSvg(512))).png().toFile(path.join(publicDir, "icon-512.png"));
await sharp(Buffer.from(iconSvg(192, { maskable: true }))).png().toFile(path.join(publicDir, "maskable-icon-192.png"));
await sharp(Buffer.from(iconSvg(512, { maskable: true }))).png().toFile(path.join(publicDir, "maskable-icon-512.png"));
await sharp(Buffer.from(iconSvg(180))).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
await sharp(Buffer.from(ogSvg())).png().toFile(path.join(publicDir, "og-image.png"));

const ico = createIco(
	await Promise.all(
		[16, 32, 48].map(async (size) => ({
			size,
			buffer: await pngFromSvg(iconSvg(size), size),
		})),
	),
);
await writeFile(path.join(publicDir, "favicon.ico"), ico);

console.log("Generated Hours PWA and social assets.");
