/** Small ONNX model from the Hugging Face hub (runs locally via Transformers.js). */
export const TIMELINE_AI_MODEL_ID = "Xenova/flan-t5-small";

export type TimelineAiProgress = {
  status?: string;
  file?: string;
  progress?: number;
};

let pipelinePromise: Promise<
  (texts: string, options?: { max_new_tokens?: number }) => Promise<{ generated_text: string }[]>
> | null = null;

export function loadTimelineAiPipeline(
  onProgress?: (p: TimelineAiProgress) => void,
): Promise<
  (texts: string, options?: { max_new_tokens?: number }) => Promise<{ generated_text: string }[]>
> {
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const { env, pipeline } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const generator = await pipeline("text2text-generation", TIMELINE_AI_MODEL_ID, {
      progress_callback: onProgress
        ? (info: { status: string; file?: string; progress?: number }) => {
            onProgress({
              progress: "progress" in info ? info.progress : undefined,
              status: info.status,
              file: "file" in info ? info.file : undefined,
            });
          }
        : undefined,
    });

    return generator as (
      texts: string,
      options?: { max_new_tokens?: number },
    ) => Promise<{ generated_text: string }[]>;
  })();

  return pipelinePromise;
}

export function buildTimelineAiPrompt(userGoal: string): string {
  const goal = userGoal.trim().slice(0, 2000);
  // FLAN-T5 follows short instructions better than strict JSON; numbered lines parse reliably.
  return `Write a numbered task list. Each line must start with a number, a dot, and a space, like "1. First task". Up to 30 lines. No other text. Topic: ${goal}`;
}
