import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const PROVIDERS = [
  {
    name: 'Gemini',
    key: () => process.env.GEMINI_API_KEY,
    call: async (prompt) => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return response.text;
    },
  },
  {
    name: 'Groq',
    key: () => process.env.GROQ_API_KEY,
    call: async (prompt) => {
      const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      return response.choices[0]?.message?.content;
    },
  },
];

export async function generateJSON(prompt, description = 'conteudo') {
  for (const provider of PROVIDERS) {
    const key = provider.key();
    if (!key) {
      console.log(`  ${provider.name}: sem API_KEY configurada, pulando.`);
      continue;
    }

    console.log(`  ${provider.name}: gerando ${description}...`);
    try {
      const text = await provider.call(prompt);
      if (!text) throw new Error('Resposta vazia');
      const parsed = JSON.parse(text.trim());
      console.log(`  ${provider.name}: OK`);
      return parsed;
    } catch (err) {
      console.log(`  ${provider.name}: falhou (${err.message}), tentando proximo...`);
    }
  }

  console.log('  Todos os LLMs falharam.');
  return null;
}
