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
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
		<rect width="512" height="512" rx="${maskable ? 0 : 128}" fill="${colors.ink}"/>
		
		<!-- Background Time Progress ring (Subtle dark ring, orange progress) -->
		<circle cx="256" cy="256" r="200" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16" />
		<circle cx="256" cy="256" r="200" fill="none" stroke="${colors.accent}" stroke-width="16" stroke-dasharray="320 1256" stroke-linecap="round" transform="rotate(-90 256 256)" />
		
		<!-- Stylized minimal hourglass -->
		<!-- Hourglass bulbs -->
		<path d="M 180 156 C 180 236, 230 248, 256 256 C 282 248, 332 236, 332 156 Z" fill="none" stroke="${colors.paper}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" />
		<path d="M 180 356 C 180 276, 230 264, 256 256 C 282 264, 332 276, 332 356 Z" fill="none" stroke="${colors.paper}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" />
		
		<!-- Top & Bottom plates -->
		<path d="M 160 146 H 352" stroke="${colors.paper}" stroke-width="24" stroke-linecap="round" />
		<path d="M 160 366 H 352" stroke="${colors.paper}" stroke-width="24" stroke-linecap="round" />
		
		<!-- Falling sand details -->
		<!-- Upper sand level (Draining) -->
		<path d="M 206 186 Q 256 206 306 186 Q 256 242 256 256 Z" fill="${colors.accent}" opacity="0.85"/>
		<!-- Lower sand level (Accumulating) -->
		<path d="M 198 346 C 210 316, 302 316, 314 346 Z" fill="${colors.accent}" />
		<!-- Center sand drop -->
		<circle cx="256" cy="256" r="14" fill="${colors.green}" />
		<!-- Small falling sand stream -->
		<path d="M 256 244 V 324" stroke="${colors.accent}" stroke-width="8" stroke-dasharray="14 10" stroke-linecap="round" />
	</svg>`;
}

function ogSvg() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
		<rect width="1200" height="630" fill="${colors.paper}"/>
		<rect x="60" y="60" width="1080" height="510" rx="40" fill="${colors.ink}"/>
		
		<!-- Large Hourglass Icon on the left -->
		<g transform="translate(120, 95)">
			<!-- Time Progress ring -->
			<circle cx="220" cy="220" r="180" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14" />
			<circle cx="220" cy="220" r="180" fill="none" stroke="${colors.accent}" stroke-width="14" stroke-dasharray="280 1130" stroke-linecap="round" transform="rotate(-90 220 220)" />
			
			<!-- Bulbs -->
			<path d="M 154 130 C 154 198, 198 208, 220 215 C 242 208, 286 198, 286 130 Z" fill="none" stroke="${colors.paper}" stroke-width="18" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M 154 300 C 154 232, 198 222, 220 215 C 242 222, 286 232, 286 300 Z" fill="none" stroke="${colors.paper}" stroke-width="18" stroke-linejoin="round" stroke-linecap="round" />
			
			<!-- Plates -->
			<path d="M 136 122 H 304" stroke="${colors.paper}" stroke-width="20" stroke-linecap="round" />
			<path d="M 136 308 H 304" stroke="${colors.paper}" stroke-width="20" stroke-linecap="round" />
			
			<!-- Sand -->
			<path d="M 176 156 Q 220 172 264 156 Q 220 203 220 215 Z" fill="${colors.accent}" opacity="0.85"/>
			<path d="M 170 292 C 180 266, 260 266, 270 292 Z" fill="${colors.accent}" />
			<circle cx="220" cy="215" r="12" fill="${colors.green}" />
			<path d="M 220 205 V 275" stroke="${colors.accent}" stroke-width="7" stroke-dasharray="12 8" stroke-linecap="round" />
		</g>
		
		<!-- Typography on the right -->
		<text x="600" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="110" font-weight="800" fill="${colors.paper}">Hours</text>
		<text x="604" y="335" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="${colors.accent}">Digital wellbeing for skills</text>
		<text x="604" y="395" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#dbe4dc">Track practice, visualize your day,</text>
		<text x="604" y="435" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#dbe4dc">and hit your learning goals offline.</text>
		
		<!-- Decorative tags -->
		<g transform="translate(604, 480)">
			<rect x="0" y="0" width="160" height="36" rx="18" fill="rgba(82, 183, 136, 0.15)" stroke="${colors.green}" stroke-width="2"/>
			<text x="80" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="${colors.green}" text-anchor="middle">LOCAL FIRST</text>
			
			<rect x="176" y="0" width="140" height="36" rx="18" fill="rgba(109, 140, 255, 0.15)" stroke="${colors.blue}" stroke-width="2"/>
			<text x="246" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="${colors.blue}" text-anchor="middle">OFFLINE PWA</text>
			
			<rect x="332" y="0" width="150" height="36" rx="18" fill="rgba(239, 143, 69, 0.15)" stroke="${colors.accent}" stroke-width="2"/>
			<text x="407" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="${colors.accent}" text-anchor="middle">TIMER SYNC</text>
		</g>
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
