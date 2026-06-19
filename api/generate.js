/**
 * Serverless function proxy to call Groq API securely.
 * This runs in Node.js on the hosting platform (like Vercel) and hides your API key.
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { systemPrompt, userPrompt } = req.body;

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: "Missing systemPrompt or userPrompt parameters." });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server error: Groq API Key is not configured on hosting environment." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Groq API error: ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Groq API proxy error:", err);
    return res.status(500).json({ error: `Proxy failed: ${err.message}` });
  }
}
