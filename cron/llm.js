import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

function buildGeminiSchema(jsonSchema) {
  function convertType(t) {
    if (t === 'string') return 'STRING';
    if (t === 'integer') return 'INTEGER';
    if (t === 'number') return 'NUMBER';
    if (t === 'boolean') return 'BOOLEAN';
    if (t === 'array') return 'ARRAY';
    if (t === 'object') return 'OBJECT';
    return 'STRING';
  }

  function walk(schema) {
    const result = { type: convertType(schema.type) };
    if (schema.description) result.description = schema.description;
    if (schema.enum) result.enum = schema.enum;
    if (schema.properties) {
      result.properties = {};
      for (const [key, val] of Object.entries(schema.properties)) {
        result.properties[key] = walk(val);
      }
    }
    if (schema.required) result.required = schema.required;
    if (schema.items) result.items = walk(schema.items);
    return result;
  }

  return walk(jsonSchema);
}

function buildOpenAiSchema(jsonSchema) {
  function walk(schema) {
    const result = { type: schema.type };
    if (schema.description) result.description = schema.description;
    if (schema.enum) result.enum = schema.enum;
    if (schema.properties) {
      result.properties = {};
      for (const [key, val] of Object.entries(schema.properties)) {
        result.properties[key] = walk(val);
      }
    }
    if (schema.required) result.required = schema.required;
    if (schema.items) result.items = walk(schema.items);
    if (schema.additionalProperties !== undefined) result.additionalProperties = schema.additionalProperties;
    return result;
  }

  return walk(jsonSchema);
}

const PROVIDERS = [
  {
    name: 'Gemini',
    key: () => process.env.GEMINI_API_KEY,
    schemaSupport: true,
    call: async (prompt, schema) => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const config = { responseMimeType: 'application/json' };
      if (schema) config.responseSchema = schema;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config,
      });
      return response.text;
    },
  },
  {
    name: 'Groq',
    key: () => process.env.GROQ_API_KEY,
    schemaSupport: false,
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

export async function generateJSON(prompt, description = 'conteudo', jsonSchema = null) {
  for (const provider of PROVIDERS) {
    const key = provider.key();
    if (!key) {
      console.log(`  ${provider.name}: sem API_KEY configurada, pulando.`);
      continue;
    }

    console.log(`  ${provider.name}: gerando ${description}...`);
    try {
      let schemaArg = null;
      if (jsonSchema && provider.schemaSupport) {
        const builder = provider.name === 'Gemini' ? buildGeminiSchema : buildOpenAiSchema;
        schemaArg = builder(jsonSchema);
      }
      const text = await provider.call(prompt, schemaArg);
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
