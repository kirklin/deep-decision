import type { AIProviderFactory, AIProviderInterface, ProviderConfig } from "../base-provider";
import type { OpenAIProviderConfig } from "./openai-provider";
import { OpenAIProvider } from "./openai-provider";

/**
 * OpenAI提供者工厂类
 * OpenAI Provider Factory Class
 */
export class OpenAIProviderFactory implements AIProviderFactory {
  /**
   * 创建OpenAI提供者实例
   * Create OpenAI Provider instance
   *
   * @param config - 提供者配置
   * @returns OpenAI提供者实例
   */
  public createProvider(config: ProviderConfig): AIProviderInterface {
    // 转换为OpenAI提供者配置
    const openaiConfig = config as OpenAIProviderConfig;

    // 验证必要的配置项
    if (!openaiConfig.apiKey) {
      throw new Error("OpenAI API key is required");
    }

    // 创建并返回OpenAI提供者实例
    return new OpenAIProvider(openaiConfig);
  }
}

// 导出实例
export const openaiProviderFactory = new OpenAIProviderFactory();
