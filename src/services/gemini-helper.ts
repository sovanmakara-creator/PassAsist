/**
 * Robust Gemini API wrapper that handles retries (for 429 and 500+ errors)
 * and falls back to alternative models (such as gemini-3.5-flash) if the primary model fails.
 */
export async function callGeminiWithFallback({
  model = "gemini-2.5-flash",
  payload,
  apiKey,
  isOpenAI = false,
}: {
  model?: string;
  payload: any;
  apiKey: string;
  isOpenAI?: boolean;
}): Promise<Response> {
  // Define fallback sequence
  const modelsToTry = [
    model,
    model === "gemini-flash-latest" ? "gemini-3.5-flash" : "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
  ];

  // Remove duplicates
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const currentModel of uniqueModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let url = "";
        const requestPayload = { ...payload };

        if (isOpenAI) {
          url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
          requestPayload.model = currentModel;
        } else {
          url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (isOpenAI) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestPayload),
        });

        if (res.ok) {
          return res; // Success!
        }

        const status = res.status;
        const errorText = await res.text();
        lastError = new Error(`API error (${status}): ${errorText}`);

        // Retry on rate limit (429) or server errors (5xx)
        if ((status === 429 || status >= 500) && attempt < 3) {
          const delay = attempt * 1500;
          console.warn(
            `Gemini call failed with status ${status} using model ${currentModel} (attempt ${attempt}/3). Retrying in ${delay}ms...`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // For other status codes (e.g. 400, 403, 404) or after 3 attempts, try the next model
        break;
      } catch (err: any) {
        lastError = err;
        if (attempt < 3) {
          const delay = attempt * 1500;
          console.warn(`Fetch error with model ${currentModel} (attempt ${attempt}/3): ${err.message}. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        break;
      }
    }
    console.warn(`Model ${currentModel} failed completely. Trying fallback model...`);
  }

  throw lastError || new Error("Failed to call Gemini API");
}
