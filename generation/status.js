/**
 * Serverless function to check if the Groq API key is configured on the host.
 */
export default async function handler(req, res) {
  // Check if GROQ_API_KEY environment variable is defined
  const hasKey = !!process.env.GROQ_API_KEY;
  return res.status(200).json({ hasKey });
}
