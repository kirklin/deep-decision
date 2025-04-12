import type { LanguageModel } from "ai";
import type { AIProviderFactory, AIProviderInterface, ProviderConfig } from "./base-provider";
import { ENV, ProviderType } from "../config/env";
import { debug } from "../utils/logger";
import { ollamaProviderFactory } from "./ollama";
import { openaiProviderFactory } from "./openai";

/**
 * AI提供者管理类
 * AI Provider Manager Class
 */
export class AIProviderManager {
  private static instance: AIProviderManager;
  private providers: Map<ProviderType, AIProviderFactory>;
  private activeProvider: AIProviderInterface | null = null;
  private defaultProviderType: ProviderType = ProviderType.OPENAI;

  /**
   * 私有构造函数
   * Private constructor
   */
  private constructor() {
    this.providers = new Map();

    // 注册内置提供者
    this.registerProvider(ProviderType.OPENAI, openaiProviderFactory);
    this.registerProvider(ProviderType.OLLAMA, ollamaProviderFactory);

    // 根据环境变量初始化默认提供者
    this.initializeDefaultProvider();

    debug("AI Provider Manager initialized");
  }

  /**
   * 获取单例实例
   * Get singleton instance
   *
   * @returns AI提供者管理类实例
   */
  public static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  /**
   * 注册提供者工厂
   * Register provider factory
   *
   * @param type - 提供者类型
   * @param factory - 提供者工厂实例
   */
  public registerProvider(type: ProviderType | string, factory: AIProviderFactory): void {
    this.providers.set(type as ProviderType, factory);
    debug(`Registered provider: ${type}`);
  }

  /**
   * 根据环境变量初始化默认提供者
   * Initialize default provider based on environment variables
   */
  private initializeDefaultProvider(): void {
    try {
      // 设置默认提供者类型
      this.defaultProviderType = ENV.PROVIDER_TYPE;

      // 根据提供者类型创建对应的提供者实例
      switch (this.defaultProviderType) {
        case ProviderType.OPENAI:
          if (!ENV.OPENAI.API_KEY) {
            debug("OpenAI API key not found, looking for alternative provider");
            // 如果没有提供OpenAI API密钥，尝试使用Ollama
            if (ENV.OLLAMA.ENABLED && ENV.OLLAMA.MODEL_NAME) {
              this.defaultProviderType = ProviderType.OLLAMA;
              this.createOllamaProvider();
            } else {
              debug("No valid provider configuration found");
            }
          } else {
            this.createOpenAIProvider();
          }
          break;

        case ProviderType.OLLAMA:
          if (!ENV.OLLAMA.ENABLED || !ENV.OLLAMA.MODEL_NAME) {
            debug("Ollama configuration not complete, looking for alternative provider");
            // 如果Ollama配置不完整，尝试使用OpenAI
            if (ENV.OPENAI.API_KEY) {
              this.defaultProviderType = ProviderType.OPENAI;
              this.createOpenAIProvider();
            } else {
              debug("No valid provider configuration found");
            }
          } else {
            this.createOllamaProvider();
          }
          break;

        default:
          debug(`Unknown provider type: ${this.defaultProviderType}, trying OpenAI as fallback`);
          if (ENV.OPENAI.API_KEY) {
            this.defaultProviderType = ProviderType.OPENAI;
            this.createOpenAIProvider();
          } else if (ENV.OLLAMA.ENABLED && ENV.OLLAMA.MODEL_NAME) {
            this.defaultProviderType = ProviderType.OLLAMA;
            this.createOllamaProvider();
          } else {
            debug("No valid provider configuration found");
          }
      }

      if (this.activeProvider) {
        debug(`Initialized default provider: ${this.defaultProviderType}`);
      } else {
        debug("No active provider initialized");
      }
    } catch (error) {
      debug(`Error initializing default provider: ${error}`);
    }
  }

  /**
   * 创建OpenAI提供者
   * Create OpenAI provider
   */
  private createOpenAIProvider(): void {
    this.activeProvider = this.createProvider(ProviderType.OPENAI, {
      apiKey: ENV.OPENAI.API_KEY,
      baseURL: ENV.OPENAI.BASE_URL,
      modelName: ENV.OPENAI.MODEL_NAME,
      contextSize: ENV.MODEL.CONTEXT_SIZE,
    });
  }

  /**
   * 创建Ollama提供者
   * Create Ollama provider
   */
  private createOllamaProvider(): void {
    this.activeProvider = this.createProvider(ProviderType.OLLAMA, {
      baseURL: ENV.OLLAMA.BASE_URL,
      modelName: ENV.OLLAMA.MODEL_NAME,
      contextSize: ENV.MODEL.CONTEXT_SIZE,
    });
  }

  /**
   * 创建提供者实例
   * Create provider instance
   *
   * @param type - 提供者类型
   * @param config - 提供者配置
   * @returns 提供者实例
   */
  public createProvider(type: ProviderType | string, config: ProviderConfig): AIProviderInterface {
    const factory = this.providers.get(type as ProviderType);
    if (!factory) {
      throw new Error(`Provider type not registered: ${type}`);
    }
    return factory.createProvider(config);
  }

  /**
   * 设置活动提供者
   * Set active provider
   *
   * @param provider - 提供者实例
   */
  public setActiveProvider(provider: AIProviderInterface): void {
    this.activeProvider = provider;
  }

  /**
   * 获取活动提供者
   * Get active provider
   *
   * @returns 活动提供者实例
   */
  public getActiveProvider(): AIProviderInterface {
    if (!this.activeProvider) {
      throw new Error("No active provider available");
    }
    return this.activeProvider;
  }

  /**
   * 获取模型
   * Get model
   *
   * @returns 语言模型
   */
  public getModel(): LanguageModel {
    return this.getActiveProvider().getModel();
  }

  /**
   * 获取模型ID
   * Get model ID
   *
   * @returns 模型ID
   */
  public getModelId(): string {
    return this.getActiveProvider().getModelId();
  }

  /**
   * 裁剪提示文本
   * Trim prompt
   *
   * @param prompt - 提示文本
   * @param contextSize - 上下文大小
   * @returns 裁剪后的提示文本
   */
  public trimPrompt(prompt: string, contextSize?: number): string {
    return this.getActiveProvider().trimPrompt(prompt, contextSize ?? ENV.MODEL.CONTEXT_SIZE);
  }
}

// 导出单例实例
const aiProviderManager = AIProviderManager.getInstance();

/**
 * 获取模型
 * Get model
 *
 * @returns 语言模型
 */
export function getModel(): LanguageModel {
  return aiProviderManager.getModel();
}

/**
 * 获取模型ID
 * Get model ID
 *
 * @returns 模型ID
 */
export function getModelId(): string {
  return aiProviderManager.getModelId();
}

/**
 * 裁剪提示文本
 * Trim prompt
 *
 * @param prompt - 提示文本
 * @param contextSize - 上下文大小
 * @returns 裁剪后的提示文本
 */
export function trimPrompt(prompt: string, contextSize?: number): string {
  return aiProviderManager.trimPrompt(prompt, contextSize);
}

// 导出所有提供者相关类型和接口
export * from "./base-provider";
export * from "./ollama";
export * from "./openai";
