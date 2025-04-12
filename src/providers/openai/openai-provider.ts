import type { LanguageModel } from "ai";
import type { TiktokenEncoding } from "js-tiktoken";
import type { AIProviderInterface, ProviderConfig } from "../base-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { getEncoding } from "js-tiktoken";
import { TEXT_CONFIG } from "../../config/env";
import { RecursiveCharacterTextSplitter } from "../../utils/text/text-splitter";

/**
 * OpenAI提供者配置
 * OpenAI Provider Configuration
 */
export interface OpenAIProviderConfig extends ProviderConfig {
  apiKey: string;
  baseURL?: string;
  modelName?: string;
  contextSize?: number;
  reasoningEffort?: "low" | "medium" | "high";
  structuredOutputs?: boolean;
}

/**
 * OpenAI提供者类
 * OpenAI Provider Class
 */
export class OpenAIProvider implements AIProviderInterface {
  private openai: ReturnType<typeof createOpenAI>;
  private model: LanguageModel;
  private modelName: string;
  private contextSize: number;
  private encoder: ReturnType<typeof getEncoding>;

  /**
   * 构造函数
   * Constructor
   *
   * @param config - OpenAI提供者配置
   */
  constructor(config: OpenAIProviderConfig) {
    // 创建OpenAI实例
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || "https://api.openai.com/v1",
    });

    // 设置模型名称
    this.modelName = config.modelName || "o3-mini";

    // 设置上下文大小
    this.contextSize = config.contextSize || 128_000;

    // 创建模型实例
    const baseModel = this.openai(this.modelName, {
      reasoningEffort: config.reasoningEffort || "medium",
      structuredOutputs: config.structuredOutputs !== false,
    });

    // 包装模型
    this.model = wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    });

    // 初始化编码器
    this.encoder = getEncoding(TEXT_CONFIG.ENCODING as TiktokenEncoding);
  }

  /**
   * 获取语言模型
   * Get language model
   *
   * @returns 语言模型
   */
  public getModel(): LanguageModel {
    return this.model;
  }

  /**
   * 获取模型ID
   * Get model ID
   *
   * @returns 模型ID
   */
  public getModelId(): string {
    return this.model.modelId || this.modelName;
  }

  /**
   * 裁剪提示文本以符合最大上下文大小限制
   * Trim prompt to maximum context size
   *
   * @param prompt - 需要裁剪的提示文本
   * @param contextSize - 最大上下文大小
   * @returns 裁剪后的提示文本
   */
  public trimPrompt(prompt: string, contextSize = this.contextSize): string {
    if (!prompt) {
      return "";
    }

    const length = this.encoder.encode(prompt).length;
    if (length <= contextSize) {
      return prompt;
    }

    const overflowTokens = length - contextSize;
    // on average it's 3 characters per token, so multiply by 3 to get a rough estimate of the number of characters
    const chunkSize = prompt.length - overflowTokens * 3;
    if (chunkSize < TEXT_CONFIG.MIN_CHUNK_SIZE) {
      return prompt.slice(0, TEXT_CONFIG.MIN_CHUNK_SIZE);
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap: 0,
    });
    const trimmedPrompt = splitter.splitText(prompt)[0] ?? "";

    // last catch, there's a chance that the trimmed prompt is same length as the original prompt, due to how tokens are split & innerworkings of the splitter, handle this case by just doing a hard cut
    if (trimmedPrompt.length === prompt.length) {
      return this.trimPrompt(prompt.slice(0, chunkSize), contextSize);
    }

    // recursively trim until the prompt is within the context size
    return this.trimPrompt(trimmedPrompt, contextSize);
  }
}
