import { GoogleGenAI } from '@google/genai';

/**
 * Gemini provider.
 */
export default class GeminiProvider {
  /**
   * @param {string} apiKey
   */
  constructor(apiKey) {
    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  /**
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  }
}
