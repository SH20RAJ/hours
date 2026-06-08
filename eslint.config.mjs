import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextVitals,
	...nextTypescript,
	{
		ignores: [".next/**", ".open-next/**", ".wrangler/**", "cloudflare-env.d.ts", "public/sw.js"],
	},
];

export default eslintConfig;
