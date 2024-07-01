import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import ext from "./extension.json";
import { writeFileSync } from "node:fs";

function createPagesRouter() {
	return new Bun.FileSystemRouter({
		dir: "src",
		style: "nextjs",
		fileExtensions: [".html", ".tsx"],
		assetPrefix: "/",
	});
}

function getPageRoute(path: string, router: import("bun").FileSystemRouter) {
	const route = router.match(
		new Request(`file://${path}`),
	) as import("bun").MatchedRoute;
	return {
		name: route.name.replace(/^\//, ""),
		path: route.filePath,
	};
}

const entries = Object.entries(ext.tools).map(([_, handler]) => ({
	path: handler.handler,
}));
const router = createPagesRouter();
const pages = entries.map((entry) => getPageRoute(entry.path, router));

export default defineConfig({
	plugins: [
		react(),
		{
			name: "replit",
			writeBundle: () => {
				writeFileSync(
					"dist/extension.json",
					JSON.stringify({
						...ext,
						tools: pages.map((page) => ({
							...page,
						})),
					}),
				);
			},
		},
	],
	root: "src",
	build: {
		outDir: `${process.cwd()}/dist`,
		emptyOutDir: true,
		rollupOptions: {
			input: pages.reduce(
				(acc, val) => Object.assign(acc, { [val.name]: val.path }),
				{},
			),
		},
	},
});
