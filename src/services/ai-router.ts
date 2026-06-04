export async function callOpenRouter({
  model,
  messages,
  tools,
  tool_choice,
  response_format,
  max_tokens = 4096,
  apiKey,
}: {
  model: string;
  messages: any[];
  tools?: any[];
  tool_choice?: any;
  response_format?: any;
  max_tokens?: number;
  apiKey: string;
}): Promise<Response> {
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const requestPayload: any = {
    model,
    messages,
    max_tokens,
  };

  if (tools) requestPayload.tools = tools;
  if (tool_choice) requestPayload.tool_choice = tool_choice;
  if (response_format) requestPayload.response_format = response_format;

  // Add retry logic for reliability
  let lastError: any = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:8080",
          "X-Title": "PassAssist AI",
        },
        body: JSON.stringify(requestPayload),
      });

      if (res.ok) {
        return res;
      }

      const status = res.status;
      const errorText = await res.text();
      lastError = new Error(`OpenRouter API error (${status}): ${errorText}`);

      // Retry on rate limit (429) or server errors (5xx)
      if ((status === 429 || status >= 500) && attempt < 3) {
        const delay = attempt * 1500;
        console.warn(
          `OpenRouter call failed with status ${status} using model ${model} (attempt ${attempt}/3). Retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      break;
    } catch (err: any) {
      lastError = err;
      if (attempt < 3) {
        const delay = attempt * 1500;
        console.warn(
          `Fetch error with model ${model} (attempt ${attempt}/3): ${err.message}. Retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("Failed to call OpenRouter API");
}
