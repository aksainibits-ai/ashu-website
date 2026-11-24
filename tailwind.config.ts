import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#080d18", panel: "#101827", gold: "#c8a96b", muted: "#a6adbb" }, fontFamily: { serif: ["Georgia", "serif"] } } }, plugins: [] } satisfies Config;
