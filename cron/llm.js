import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  requestTimeoutMs: 60000,
  minIntervalMs: 500,
};

function isTransientError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.code || 0;

  if (msg.includes('timeout') || msg.includes('timed out')) return true;
  if (msg.includes('econnrefused') || msg.includes('econnreset') || msg.includes('enotfound')) return true;
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('quota')) return true;
  if (msg.includes('internal server error') || msg.includes('service unavailable')) return true;
  if (msg.includes('429') || msg.includes('500') || msg.includes('502') || msg.includes('503')) return true;
  if (status === 429 || status === 500 || status === 502 || status === 503) return true;
  if (msg.includes('network') || msg.includes('socket')) return true;

  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitter(delay) {
  return Math.round(delay * (0.5 + Math.random() * 0.5));
}

async function callWithRetry(fn, context) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error('Request timed out')), RETRY_CONFIG.requestTimeoutMs);

      try {
        const result = await fn(controller.signal);
        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = err;

      if (err.name === 'AbortError' || err.message?.includes('timed out')) {
        console.log(`    ${context}: timeout (tentativa ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
      } else {
        console.log(`    ${context}: erro (${err.message}, tentativa ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
      }

      if (attempt < RETRY_CONFIG.maxRetries && isTransientError(err)) {
        const delay = jitter(Math.min(RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt), RETRY_CONFIG.maxDelayMs));
        console.log(`    ${context}: aguardando ${delay}ms antes de retentar...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

class RateLimiter {
  constructor(minIntervalMs) {
    this.minIntervalMs = minIntervalMs;
    this.lastCallTime = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastCallTime = Date.now();
  }
}

const rateLimiter = new RateLimiter(RETRY_CONFIG.minIntervalMs);

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
      return callWithRetry(async (signal) => {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const config = { responseMimeType: 'application/json' };
        if (schema) config.responseSchema = schema;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config,
          ...(signal && { signal }),
        });
        return response.text;
      }, 'Gemini');
    },
  },
  {
    name: 'Groq',
    key: () => process.env.GROQ_API_KEY,
    schemaSupport: false,
    call: async (prompt) => {
      return callWithRetry(async (signal) => {
        const client = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1',
        });
        const response = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          ...(signal && { signal }),
        });
        return response.choices[0]?.message?.content;
      }, 'Groq');
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
      await rateLimiter.wait();

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
      const permanent = !isTransientError(err);
      console.log(`  ${provider.name}: ${permanent ? 'falha permanente' : 'falhou após retries'} (${err.message}), tentando proximo...`);
    }
  }

  console.log('  Todos os LLMs falharam.');
  return null;
}
