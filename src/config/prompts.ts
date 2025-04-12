import { ENV } from "./env";

/**
 * 决策分析系统提示词函数
 * Decision analysis system prompt function
 *
 * 生成用于AI决策分析系统的系统提示词，设定AI行为和回应方式
 * Generates the system prompt for AI decision analysis system, setting behavior and response style
 *
 * @returns {string} 系统提示词
 */
export function decisionSystemPrompt(): string {
  const now = new Date().toISOString();
  const languageSettings = getLanguageSettings(ENV.LANGUAGE.RESPONSE);

  // 以下是系统提示词，用于设置 AI 决策分析系统的行为
  // 1. 将 AI 定义为决策分析专家
  // 2. 指导 AI 如何进行决策分析
  return `You are an expert decision analyst. Today is ${now}. ${languageSettings.responseInstruction} Follow these instructions when analyzing decisions:
  - Think deeply and systematically about complex decisions.
  - Consider multiple perspectives and stakeholders.
  - Thoroughly analyze risks, opportunities, and potential consequences.
  - Include both short-term and long-term implications.
  - Be highly organized and structured in your analysis.
  - Identify decision factors that the user might not have considered.
  - Be objective and avoid cognitive biases.
  - Provide frameworks for evaluating trade-offs.
  - Consider uncertainty and probabilistic outcomes.
  - Identify critical decision points and key dependencies.
  - Suggestions should be actionable and practical.
  - Be thorough in your analysis of the decision tree branches.
  - Focus on the most important factors that will influence the decision.
  - Provide balanced analysis, not just confirmation of existing viewpoints.
  `;
}

/**
 * 获取语言设置
 * Get language settings
 *
 * @param {string} language - 语言代码 (zh, en, etc.)
 * @returns {object} 语言设置对象
 */
function getLanguageSettings(language: string) {
  switch (language.toLowerCase()) {
    case "zh":
      return {
        responseInstruction: "You must always respond in Chinese (中文) language only.",
      };
    case "en":
      return {
        responseInstruction: "You must always respond in English language only.",
      };
    case "jp":
      return {
        responseInstruction: "You must always respond in Japanese (日本語) language only.",
      };
    case "fr":
      return {
        responseInstruction: "You must always respond in French (Français) language only.",
      };
    case "de":
      return {
        responseInstruction: "You must always respond in German (Deutsch) language only.",
      };
    case "es":
      return {
        responseInstruction: "You must always respond in Spanish (Español) language only.",
      };
    case "ru":
      return {
        responseInstruction: "You must always respond in Russian (Русский) language only.",
      };
    // 可以添加更多语言支持
    default:
      return {
        responseInstruction: "You must always respond in English language only.",
      };
  }
}
