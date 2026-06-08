import { ArrowRight, Activity, BookOpen, Clock, Code, Shield, Heart, Lock, Check, GitPullRequest } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "About Hours - Open Source Skill Tracker",
	description: "Hours is a local-first, privacy-focused digital wellbeing app for skill tracking. Built with Next.js, IndexedDB, and MIT Licensed.",
};

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-[#f5f6f1] text-[#111513] font-sans antialiased selection:bg-[#ef8f45]/20">
			{/* Top Navbar */}
			<header className="sticky top-0 z-50 backdrop-blur-md bg-[#f5f6f1]/80 border-b border-[#dfe3db]">
				<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-3 group">
						<span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111513] text-[#f5f6f1]">
							<Clock size={18} className="group-hover:rotate-12 transition-transform duration-300 text-[#ef8f45]" />
						</span>
						<span className="font-extrabold text-xl tracking-tight">Hours</span>
					</Link>
					<div className="flex items-center gap-4">
						<a
							href="https://github.com/sh20raj/hours"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-semibold hover:text-[#ef8f45] transition-colors"
						>
							GitHub
						</a>
						<Link
							href="/"
							className="inline-flex items-center justify-center px-4 py-2 text-sm font-extrabold text-[#f5f6f1] bg-[#111513] hover:bg-[#ef8f45] rounded-lg transition-colors duration-200"
						>
							Go to App
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-[#111513] via-[#161e1a] to-[#1c2420] text-[#f5f6f1] py-20 px-4">
				{/* Ambient Glow */}
				<div className="absolute inset-0 pointer-events-none opacity-30">
					<div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#ef8f45] blur-[120px]" />
					<div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#52b788] blur-[120px]" />
				</div>

				<div className="relative max-w-4xl mx-auto text-center">
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#52b788]/15 text-[#52b788] border border-[#52b788]/20 uppercase tracking-widest mb-6">
						<Heart size={12} className="fill-[#52b788]" /> Open Source & Local First
					</span>
					<h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
						Track Skills, Not Apps. <br />
						<span className="bg-gradient-to-r from-[#ef8f45] to-[#52b788] bg-clip-text text-transparent">
							Optimize Your Growth.
						</span>
					</h1>
					<p className="text-lg md:text-xl text-[#dbe4dc] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
						Hours is a local-first digital wellbeing companion designed to help you build momentum, practice deliberately, and reclaim focused time.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							href="/"
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-extrabold text-[#111513] bg-[#f5f6f1] hover:bg-[#ef8f45] rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
						>
							Start Tracking Now <ArrowRight size={18} />
						</Link>
						<a
							href="https://github.com/sh20raj/hours"
							target="_blank"
							rel="noopener noreferrer"
							className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-extrabold text-[#f5f6f1] bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all duration-200"
						>
							<Code size={18} /> View Source Code
						</a>
					</div>
				</div>
			</section>

			{/* Core Pillars */}
			<section className="max-w-6xl mx-auto py-20 px-4">
				<div className="text-center mb-16">
					<h2 className="text-3xl font-black tracking-tight mb-4">Why use Hours?</h2>
					<p className="text-base text-[#66736b] max-w-lg mx-auto">
						Built on the principles of privacy, deliberate practice, and simplicity.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					<div className="bg-white border border-[#dfe3db] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
						<div className="w-12 h-12 rounded-xl bg-[#ef8f45]/10 text-[#ef8f45] flex items-center justify-center mb-6">
							<Clock size={24} />
						</div>
						<h3 className="text-xl font-bold mb-3">Focused Timer & Pomodoro</h3>
						<p className="text-sm text-[#66736b] leading-relaxed">
							Switch on custom focus timers and built-in Pomodoro presets (25/5 or 50/10) to maintain high-quality practice sessions.
						</p>
					</div>

					<div className="bg-white border border-[#dfe3db] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
						<div className="w-12 h-12 rounded-xl bg-[#52b788]/10 text-[#52b788] flex items-center justify-center mb-6">
							<Shield size={24} />
						</div>
						<h3 className="text-xl font-bold mb-3">Offline & Local First</h3>
						<p className="text-sm text-[#66736b] leading-relaxed">
							No accounts, no telemetry, and no cloud leaks. All tracking is stored directly on your browser using IndexedDB. Works 100% offline.
						</p>
					</div>

					<div className="bg-white border border-[#dfe3db] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
						<div className="w-12 h-12 rounded-xl bg-[#6d8cff]/10 text-[#6d8cff] flex items-center justify-center mb-6">
							<Activity size={24} />
						</div>
						<h3 className="text-xl font-bold mb-3">Time Visualization</h3>
						<p className="text-sm text-[#66736b] leading-relaxed">
							Visualize your daily learning distributions and weekly targets. Review your history with our detailed interactive calendar view.
						</p>
					</div>
				</div>
			</section>

			{/* MIT License & Open Source Section */}
			<section className="bg-[#eceee7] py-20 px-4 border-y border-[#dfe3db]">
				<div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
					<div className="flex-1">
						<span className="text-xs font-bold text-[#ef8f45] uppercase tracking-widest mb-3 block">License</span>
						<h2 className="text-3xl font-black tracking-tight mb-4">100% MIT Licensed</h2>
						<p className="text-[#66736b] text-sm leading-relaxed mb-6">
							Hours is released under the permissive MIT License. You are free to modify, deploy, distribute, and integrate it into your own workflows. No paywalls, no limits.
						</p>
						<ul className="space-y-3 mb-6">
							<li className="flex items-start gap-2.5 text-sm">
								<span className="w-5 h-5 rounded-full bg-[#52b788]/20 text-[#52b788] flex items-center justify-center mt-0.5"><Check size={12} className="stroke-[3]" /></span>
								<span>Free for personal and commercial use.</span>
							</li>
							<li className="flex items-start gap-2.5 text-sm">
								<span className="w-5 h-5 rounded-full bg-[#52b788]/20 text-[#52b788] flex items-center justify-center mt-0.5"><Check size={12} className="stroke-[3]" /></span>
								<span>Open modification and code reuse allowed.</span>
							</li>
							<li className="flex items-start gap-2.5 text-sm">
								<span className="w-5 h-5 rounded-full bg-[#52b788]/20 text-[#52b788] flex items-center justify-center mt-0.5"><Check size={12} className="stroke-[3]" /></span>
								<span>Easy to deploy on your own Cloudflare Pages interface.</span>
							</li>
						</ul>
					</div>
					<div className="w-full md:w-80 bg-white border border-[#dfe3db] rounded-2xl p-6 shadow-sm">
						<div className="flex items-center gap-3 mb-4">
							<Lock size={20} className="text-[#ef8f45]" />
							<span className="font-bold text-sm">Privacy Guarantee</span>
						</div>
						<p className="text-xs text-[#66736b] leading-relaxed mb-4">
							Hours does not track cookies, IP addresses, or practice patterns. Because the app uses service workers and local caching, you own your database.
						</p>
						<div className="h-[1px] bg-[#dfe3db] my-4" />
						<p className="text-xs text-[#66736b]">
							To back up or sync, simply use the <strong>JSON Export/Import</strong> action inside the Settings dashboard.
						</p>
					</div>
				</div>
			</section>

			{/* Contribution Friendly Guide */}
			<section className="max-w-4xl mx-auto py-20 px-4">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-black tracking-tight mb-4">Contributing is Easy</h2>
					<p className="text-[#66736b] text-base max-w-lg mx-auto">
						Hours is designed to be developer-friendly. Setup your local workspace in less than a minute.
					</p>
				</div>

				<div className="bg-[#111513] text-[#f5f6f1] rounded-2xl overflow-hidden shadow-xl border border-white/10">
					<div className="bg-[#1a201c] px-6 py-3 border-b border-white/5 flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<span className="w-3 h-3 rounded-full bg-[#ef8f45]/80" />
							<span className="w-3 h-3 rounded-full bg-[#52b788]/80" />
							<span className="w-3 h-3 rounded-full bg-[#6d8cff]/80" />
						</div>
						<span className="text-xs font-mono opacity-50 select-none">setup-workspace.sh</span>
					</div>
					<div className="p-6 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto">
						<div className="text-[#66736b] mb-2"># Clone the repository</div>
						<div><span className="text-[#ef8f45]">git clone</span> https://github.com/sh20raj/hours.git</div>
						<div className="text-[#66736b] my-2"># Navigate and install dependencies</div>
						<div><span className="text-[#ef8f45]">cd</span> hours</div>
						<div><span className="text-[#ef8f45]">bun</span> install <span className="text-[#52b788]"># or npm install</span></div>
						<div className="text-[#66736b] my-2"># Launch development server</div>
						<div><span className="text-[#ef8f45]">bun</span> dev</div>
					</div>
				</div>

				<div className="mt-12 text-center">
					<a
						href="https://github.com/sh20raj/hours"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-2 px-8 py-4 font-extrabold text-[#f5f6f1] bg-[#111513] hover:bg-[#ef8f45] rounded-xl transition-all duration-200"
					>
						<GitPullRequest size={18} /> Open a Pull Request on GitHub
					</a>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-[#111513] text-[#dbe4dc]/60 py-12 px-4 border-t border-white/5">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
					<div className="flex items-center gap-2.5">
						<span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[#f5f6f1]">
							<Clock size={12} className="text-[#ef8f45]" />
						</span>
						<span className="font-bold text-[#f5f6f1]">Hours Tracker</span>
					</div>
					<p className="text-xs">
						Released under the MIT License. Created by Shaswat Raj.
					</p>
					<div className="flex items-center gap-4 text-xs">
						<Link href="/" className="hover:text-[#f5f6f1] transition-colors">App</Link>
						<span>·</span>
						<a href="https://github.com/sh20raj/hours" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f6f1] transition-colors">GitHub</a>
						<span>·</span>
						<a href="https://hours.debo.life" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f6f1] transition-colors">debo.life</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
