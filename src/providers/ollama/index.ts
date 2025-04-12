import type { AIProviderFactory, AIProviderInterface, ProviderConfig } from "../base-provider";
import type { OllamaProviderConfig } from "./ollama-provider";
import { OllamaProvider } from "./ollama-provider";

/**
 * Ollama提供者工厂类
 * Ollama Provider Factory Class
 */
export class OllamaProviderFactory implements AIProviderFactory {
  /**
   * 创建Ollama提供者实例
   * Create Ollama Provider instance
   *
   * @param config - 提供者配置
   * @returns Ollama提供者实例
   */
  public createProvider(config: ProviderConfig): AIProviderInterface {
    // 转换为Ollama提供者配置
    const ollamaConfig = config as OllamaProviderConfig;

    // 验证必要的配置项
    if (!ollamaConfig.modelName) {
      throw new Error("Ollama model name is required");
    }

    // 创建并返回Ollama提供者实例
    return new OllamaProvider(ollamaConfig);
  }
}

// 导出实例
export const ollamaProviderFactory = new OllamaProviderFactory();
