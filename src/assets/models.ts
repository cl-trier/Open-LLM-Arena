import type { Model } from "types";

// Every entry must be served by at least one live Hugging Face Inference Provider:
// https://router.huggingface.co/v1/models (the app also checks this at runtime).
export const MODELS: Array<Model> = [
	{
		name: "GLM 4.7",
		url: "zai-org/GLM-4.7",
		size: 358
	},
	{
		name: "MiniMax 2.7",
		url: "MiniMaxAI/MiniMax-M2.7",
		size: 229
	},
	{
		name: "Command A+",
		url: "CohereLabs/command-a-plus-05-2026-bf16",
		size: 219
	},
	{
		name: "GPT OSS",
		url: "openai/gpt-oss-120b",
		size: 120
	},
	{
		name: "Llama 3.3",
		url: "meta-llama/Llama-3.3-70B-Instruct",
		size: 70
	},
	{
		name: "Qwen 3.6",
		url: "Qwen/Qwen3.6-35B-A3B",
		size: 35
	},
	{
		name: "Gemma 3",
		url: "google/gemma-3-27b-it",
		size: 27
	},
	{
		name: "Qwen 3.5",
		url: "Qwen/Qwen3.5-9B",
		size: 9
	},
	{
		name: "Llama 3.2",
		url: "meta-llama/Llama-3.2-3B-Instruct",
		size: 3
	}
]
