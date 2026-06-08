import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hours.debo.life";
const title = "Hours - Skill Time Tracking App";
const description = "Hours is a local-first digital wellbeing app for skills: track practice, visualize your day, and achieve learning goals offline.";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	applicationName: "Hours",
	title: {
		default: title,
		template: "%s | Hours",
	},
	description,
	keywords: [
		"Hours app",
		"skill time tracker",
		"learning goals",
		"practice tracker",
		"pomodoro timer",
		"digital wellbeing",
		"offline productivity app",
		"IndexedDB time tracking",
	],
	authors: [{ name: "Shaswat Raj" }],
	creator: "Shaswat Raj",
	publisher: "Hours",
	alternates: {
		canonical: "/",
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/icon-192.png", sizes: "192x192", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
	},
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		title: "Hours",
		statusBarStyle: "black-translucent",
	},
	openGraph: {
		type: "website",
		url: "/",
		title,
		description,
		siteName: "Hours",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Hours skill time tracking app preview",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: ["/og-image.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	category: "productivity",
};

export const viewport: Viewport = {
	themeColor: "#111513",
	colorScheme: "light",
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
