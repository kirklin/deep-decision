import type { LanguageModel } from "ai";

/**
 * AI提供者接口
 * AI Provider Interface
 */
export interface AIProviderInterface {
  /**
   * 获取语言模型
   * Get language model
   */
  getModel: () => LanguageModel;

  /**
   * 获取模型ID
   * Get model ID
   */
  getModelId: () => string;

  /**
   * 裁剪提示文本以符合最大上下文大小限制
   * Trim prompt to maximum context size
   *
   * @param prompt - 需要裁剪的提示文本
   * @param contextSize - 最大上下文大小
   */
  trimPrompt: (prompt: string, contextSize?: number) => string;
}

/**
 * 提供者配置接口
 * Provider Configuration Interface
 */
export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  modelName?: string;
  contextSize?: number;
  [key: string]: any;
}

/**
 * AI提供者工厂接口
 * AI Provider Factory Interface
 */
export interface AIProviderFactory {
  /**
   * 创建AI提供者实例
   * Create AI Provider instance
   *
   * @param config - 提供者配置
   */
  createProvider: (config: ProviderConfig) => AIProviderInterface;
}
