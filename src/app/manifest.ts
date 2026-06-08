import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Hours - Skill Time Tracking App",
		short_name: "Hours",
		description: "Track skill practice, visualize productive time, and hit daily or weekly learning goals.",
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#f5f6f1",
		theme_color: "#111513",
		categories: ["productivity", "education", "lifestyle"],
		icons: [
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/maskable-icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/maskable-icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
		shortcuts: [
			{
				name: "Track today",
				short_name: "Today",
				description: "Open your skill timer dashboard.",
				url: "/",
				icons: [{ src: "/icon-192.png", sizes: "192x192" }],
			},
			{
				name: "View calendar",
				short_name: "Calendar",
				description: "Review your local practice history.",
				url: "/?view=calendar",
				icons: [{ src: "/icon-192.png", sizes: "192x192" }],
			},
		],
	};
}
