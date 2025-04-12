import type { DecisionProgress } from "../types/decision";
import * as fs from "node:fs/promises";
import process from "node:process";
import * as readline from "node:readline";
import { ENV } from "../config/env";
import { getModelId } from "../providers";
import { info, log } from "../utils/logger";
import {
  analyzeDecision,
  decisionTreeToJson,
  generateDecisionFeedback,
  generateDecisionReport,
} from "./decision-service";

/**
 * CLI服务类
 * CLI Service class
 */
export class CLIService {
  private static instance: CLIService;
  private rl: readline.Interface;

  /**
   * 私有构造函数
   * Private constructor
   */
  private constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    info("CLI Service initialized");
  }

  /**
   * 获取CLI服务实例
   * Get CLI Service instance
   *
   * @returns {CLIService} CLI服务实例
   */
  public static getInstance(): CLIService {
    if (!CLIService.instance) {
      CLIService.instance = new CLIService();
    }
    return CLIService.instance;
  }

  /**
   * 获取用户输入
   * Get user input
   *
   * @param {string} query - 提示信息
   * @returns {Promise<string>} 用户输入
   */
  public async askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * 关闭CLI界面
   * Close CLI interface
   */
  public close(): void {
    this.rl.close();
  }

  /**
   * 运行决策分析系统
   * Run decision analysis system
   */
  public async run(): Promise<void> {
    try {
      log("使用模型: ", getModelId());

      // 获取决策问题
      const initialProblem = await this.askQuestion("请输入需要分析的复杂决策问题: ");

      // 获取分析深度和广度
      const breadth
        = Number.parseInt(
          await this.askQuestion(
            `请输入分析广度（推荐 3-6，默认 ${ENV.DECISION.DEFAULT_BREADTH}）: `,
          ),
          10,
        ) || ENV.DECISION.DEFAULT_BREADTH;

      const depth
        = Number.parseInt(
          await this.askQuestion(
            `请输入分析深度（推荐 2-5，默认 ${ENV.DECISION.DEFAULT_DEPTH}）: `,
          ),
          10,
        ) || ENV.DECISION.DEFAULT_DEPTH;

      let combinedProblem = initialProblem;

      // 生成跟进问题以获取更多信息
      log("\n为了更好地理解您的决策需求，我们将提出一些跟进问题...");
      const followUpQuestions = await generateDecisionFeedback({
        problem: initialProblem,
        numQuestions: ENV.DECISION.DEFAULT_QUESTIONS,
      });

      // 收集跟进问题的答案
      const answers: string[] = [];
      for (const question of followUpQuestions) {
        const answer = await this.askQuestion(`\n${question}\n您的回答: `);
        answers.push(answer);
      }

      // 合并所有信息用于决策分析
      combinedProblem = `
初始决策问题: ${initialProblem}

跟进问题和回答:
${followUpQuestions.map((q: string, i: number) => `问: ${q}\n答: ${answers[i]}`).join("\n\n")}
`;

      log("\n开始决策分析...\n");

      // 显示进度的回调函数
      const onProgress = (progress: DecisionProgress) => {
        const percentComplete = Math.floor((progress.completedBranches / progress.totalBranches) * 100);
        log(`分析进度: ${percentComplete}% | 深度: ${progress.currentDepth}/${progress.totalDepth} | 分支: ${progress.completedBranches}/${progress.totalBranches}`);
        if (progress.currentBranch) {
          log(`当前分析的决策路径: ${progress.currentBranch}`);
        }
        log(""); // 打印空行，增加可读性
      };

      // 执行决策分析
      const { decisionTree, insights } = await analyzeDecision({
        problem: combinedProblem,
        depth,
        breadth,
        onProgress,
      });

      // 保存决策树JSON
      const decisionTreeJson = decisionTreeToJson(decisionTree);
      await fs.writeFile("decision-tree.json", decisionTreeJson, "utf-8");
      log("\n决策树已保存到 decision-tree.json");

      // 显示关键见解
      log("\n主要决策见解:\n");
      insights.forEach((insight, index) => {
        log(`${index + 1}. ${insight}`);
      });

      // 生成决策报告
      log("\n正在生成决策分析报告...");
      const report = await generateDecisionReport({
        problem: combinedProblem,
        decisionTree,
        insights,
      });

      // 保存决策报告
      await fs.writeFile("decision-report.md", report, "utf-8");
      log("\n决策分析报告已生成并保存到 decision-report.md");

      this.close();
    } catch (error) {
      log("执行过程中出现错误:", error);
      this.close();
    }
  }
}

// 单例实例导出
// Export singleton instance
const cliService = CLIService.getInstance();

/**
 * 运行CLI服务
 * Run CLI service
 */
export function runCLI(): Promise<void> {
  return cliService.run();
}
