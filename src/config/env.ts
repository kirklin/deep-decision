import process from "node:process";

/**
 * 提供者类型枚举
 * Provider Type Enum
 */
export enum ProviderType {
  OPENAI = "openai",
  OLLAMA = "ollama",
  CUSTOM = "custom",
}

/**
 * 环境配置
 * Environment configuration
 */
export const ENV = {
  // 提供商配置
  // Provider configuration
  PROVIDER_TYPE: (process.env.PROVIDER_TYPE as ProviderType) || ProviderType.OPENAI,

  // OpenAI提供商配置
  // OpenAI provider configuration
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY,
    BASE_URL: process.env.OPENAI_BASE_URL || process.env.OPENAI_ENDPOINT || "https://api.openai.com/v1",
    MODEL_NAME: process.env.OPENAI_MODEL_NAME || "o3-mini",
  },

  // Ollama提供商配置
  // Ollama provider configuration
  OLLAMA: {
    ENABLED: process.env.OLLAMA_ENABLED === "true" || false,
    BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
    MODEL_NAME: process.env.OLLAMA_MODEL_NAME || "llama4",
  },

  // 通用模型配置
  // Common model configuration
  MODEL: {
    CONTEXT_SIZE: Number(process.env.CONTEXT_SIZE) || 128_000,
  },

  // 决策分析默认配置
  // Decision analysis default configuration
  DECISION: {
    DEFAULT_DEPTH: Number(process.env.DEFAULT_DEPTH) || 3,
    DEFAULT_BREADTH: Number(process.env.DEFAULT_BREADTH) || 4,
    DEFAULT_QUESTIONS: Number(process.env.DEFAULT_QUESTIONS) || 3,
  },

  // API服务配置
  // API service configuration
  API: {
    DEFAULT_PORT: Number(process.env.API_PORT) || 8080,
  },

  // 语言设置
  // Language settings
  LANGUAGE: {
    RESPONSE: process.env.RESPONSE_LANGUAGE || "zh",
    // 支持的语言列表
    // Supported languages list
    SUPPORTED: ["zh", "en", "jp", "fr", "de", "es", "ru"],
  },
};

/**
 * 文本处理配置
 * Text processing configuration
 */
export const TEXT_CONFIG = {
  MIN_CHUNK_SIZE: 140,
  ENCODING: "o200k_base",
};
