import type { Request, Response } from "express";
import * as fs from "node:fs/promises";
import cors from "cors";
import express from "express";
import { ENV } from "../config/env";
import { getModelId } from "../providers";
import { error, info, log } from "../utils/logger";
import {
  analyzeDecision,
  decisionTreeToJson,
  generateDecisionFeedback,
  generateDecisionReport,
} from "./decision-service";

/**
 * API服务类
 * API Service class
 */
export class APIService {
  private static instance: APIService;
  private app: express.Express;
  private port: number;

  /**
   * 私有构造函数
   * Private constructor
   */
  private constructor() {
    this.app = express();
    this.port = ENV.API.DEFAULT_PORT;
    this.setupMiddleware();
    this.setupRoutes();
    info("API Service initialized");
  }

  /**
   * 获取API服务实例
   * Get API Service instance
   *
   * @returns {APIService} API服务实例
   */
  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  /**
   * 设置中间件
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /**
   * 设置路由
   * Setup routes
   */
  private setupRoutes(): void {
    // API endpoint to generate feedback questions
    this.app.post("/api/feedback-questions", (req, res) => {
      void this.handleFeedbackQuestions(req, res);
    });

    // API endpoint to run decision analysis
    this.app.post("/api/analyze-decision", (req, res) => {
      void this.handleAnalyzeDecision(req, res);
    });

    // Get saved decision report
    this.app.get("/api/decision-report", (req, res) => {
      void this.handleGetDecisionReport(req, res);
    });

    // Get saved decision tree
    this.app.get("/api/decision-tree", (req, res) => {
      void this.handleGetDecisionTree(req, res);
    });

    // Get model info
    this.app.get("/api/model-info", (_req, res) => {
      res.json({
        modelId: getModelId(),
        providerType: ENV.PROVIDER_TYPE,
      });
    });
  }

  /**
   * 处理反馈问题请求
   * Handle feedback questions request
   *
   * @param {Request} req - 请求
   * @param {Response} res - 响应
   */
  private async handleFeedbackQuestions(req: Request, res: Response): Promise<Response> {
    try {
      const { problem, numQuestions = ENV.DECISION.DEFAULT_QUESTIONS } = req.body;

      if (!problem) {
        return res.status(400).json({ error: "决策问题是必需的" });
      }

      const questions = await generateDecisionFeedback({
        problem,
        numQuestions,
      });

      return res.json({
        success: true,
        questions,
      });
    } catch (err: unknown) {
      error("生成反馈问题错误:", err);
      return res.status(500).json({
        error: "生成反馈问题过程中发生错误",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * 处理决策分析请求
   * Handle analyze decision request
   *
   * @param {Request} req - 请求
   * @param {Response} res - 响应
   */
  private async handleAnalyzeDecision(req: Request, res: Response): Promise<Response> {
    try {
      const {
        problem,
        depth = ENV.DECISION.DEFAULT_DEPTH,
        breadth = ENV.DECISION.DEFAULT_BREADTH,
      } = req.body;

      if (!problem) {
        return res.status(400).json({ error: "决策问题是必需的" });
      }

      log("\n开始决策分析...\n");

      const { decisionTree, insights } = await analyzeDecision({
        problem,
        depth,
        breadth,
      });

      // 生成并保存决策树JSON
      const decisionTreeJson = decisionTreeToJson(decisionTree);
      await fs.writeFile("decision-tree.json", decisionTreeJson, "utf-8");

      // 生成决策报告
      const report = await generateDecisionReport({
        problem,
        decisionTree,
        insights,
      });

      // 保存决策报告
      await fs.writeFile("decision-report.md", report, "utf-8");

      // 返回结果
      return res.json({
        success: true,
        report,
        insights,
        decisionTree,
      });
    } catch (err: unknown) {
      error("决策分析API错误:", err);
      return res.status(500).json({
        error: "决策分析过程中发生错误",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * 处理获取决策报告请求
   * Handle get decision report request
   *
   * @param {Request} _req - 请求
   * @param {Response} res - 响应
   */
  private async handleGetDecisionReport(_req: Request, res: Response): Promise<Response> {
    try {
      const report = await fs.readFile("decision-report.md", "utf-8");
      return res.json({ success: true, report });
    } catch {
      return res.status(404).json({ error: "决策报告未找到" });
    }
  }

  /**
   * 处理获取决策树请求
   * Handle get decision tree request
   *
   * @param {Request} _req - 请求
   * @param {Response} res - 响应
   */
  private async handleGetDecisionTree(_req: Request, res: Response): Promise<Response> {
    try {
      const decisionTree = await fs.readFile("decision-tree.json", "utf-8");
      return res.json({ success: true, decisionTree: JSON.parse(decisionTree) });
    } catch {
      return res.status(404).json({ error: "决策树未找到" });
    }
  }

  /**
   * 启动API服务
   * Start API server
   */
  public start(): void {
    this.app.listen(this.port, () => {
      log(`Deep Decision API running on port ${this.port}`);
    });
  }
}

// 单例实例导出
// Export singleton instance
const apiService = APIService.getInstance();

/**
 * 启动API服务
 * Start API server
 */
export function startAPI(): void {
  apiService.start();
}
