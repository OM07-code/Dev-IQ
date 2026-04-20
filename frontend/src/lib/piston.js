// Code execution via our own backend proxy at /api/execute
// This avoids reliance on the now-defunct public Piston API (emkc.org/api/v2/piston)

const SUPPORTED_LANGUAGES = ["javascript", "python", "java"];

/**
 * @param {string} language - programming language
 * @param {string} code - source code to execute
 * @param {string} stdin - optional custom input data
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code, stdin = "") {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return { success: false, error: `Unsupported language: ${language}` };
  }

  try {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const response = await fetch(`${backendUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ language, code, stdin }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.message || `Server error: ${response.status}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: `Failed to execute code: ${error.message}` };
  }
}
