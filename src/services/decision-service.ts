import type { DecisionNode, DecisionProgress, DecisionResult, GeneratedNode } from "../types/decision";
import { generateObject } from "ai";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { decisionSystemPrompt } from "../config/prompts";
import { getModel, trimPrompt } from "../providers";
import { info, warn } from "../utils/logger";

/**
 * 决策服务类
 * Decision Service class
 */
export class DecisionService {
  private static instance: DecisionService;

  /**
   * 私有构造函数
   * Private constructor
   */
  private constructor() {
    info("Decision Service initialized");
  }

  /**
   * 获取决策服务实例
   * Get Decision Service instance
   *
   * @returns {DecisionService} 决策服务实例
   */
  public static getInstance(): DecisionService {
    if (!DecisionService.instance) {
      DecisionService.instance = new DecisionService();
    }
    return DecisionService.instance;
  }

  /**
   * 将生成的节点转换为标准节点
   * Convert generated node to standard node
   *
   * @param {GeneratedNode} node - 生成的节点
   * @param {string | null} defaultParentId - 默认父节点ID
   * @returns {DecisionNode} 标准节点
   */
  private normalizeNode(node: GeneratedNode, defaultParentId: string | null = null): DecisionNode {
    // 确保所有必需的字段都有值
    return {
      id: node.id || uuidv4(),
      description: node.description || "未命名选项",
      type: node.type || "decision",
      parentId: node.parentId !== undefined ? node.parentId : defaultParentId,
      risk: node.risk,
      opportunity: node.opportunity,
      probability: node.probability,
      children: Array.isArray(node.children)
        ? node.children.map((child: GeneratedNode) =>
            this.normalizeNode(child, node.id))
        : [],
    };
  }

  /**
   * 生成决策反馈问题
   * Generate decision feedback questions
   *
   * @param {object} params - 参数对象
   * @param {string} params.problem - 决策问题
   * @param {number} params.numQuestions - 问题数量
   * @returns {Promise<string[]>} 问题列表
   */
  public async generateDecisionFeedback({
    problem,
    numQuestions = 3,
  }: {
    problem: string;
    numQuestions?: number;
  }): Promise<string[]> {
    const res = await generateObject({
      model: getModel(),
      system: decisionSystemPrompt(),
      prompt: `Given the following decision problem, generate ${numQuestions} follow-up questions to better understand the context, constraints, and preferences:
      
      <problem>${problem}</problem>
      
      The questions should help clarify:
      - Key stakeholders and their interests
      - Constraints and limitations
      - Decision criteria and priorities
      - Resources available
      - Timeline considerations
      - Risk tolerance
      - Previous related decisions
      
      Ask thoughtful, open-ended questions that will provide valuable context for analyzing this decision.`,
      schema: z.object({
        questions: z.array(z.string().describe("Follow-up question to understand the decision context better")).describe(`List of ${numQuestions} follow-up questions`),
      }),
    });

    info(`Generated ${res.object.questions.length} feedback questions`);

    return res.object.questions;
  }

  /**
   * 生成初始决策树
   * Generate initial decision tree
   *
   * @param {object} params - 参数对象
   * @param {string} params.problem - 决策问题
   * @param {number} params.breadth - 生成的选项数量
   * @returns {Promise<DecisionNode>} 初始决策树
   */
  private async generateInitialDecisionTree({
    problem,
    breadth = 4,
  }: {
    problem: string;
    breadth?: number;
  }): Promise<DecisionNode> {
    const rootNodeId = uuidv4();

    const res = await generateObject({
      model: getModel(),
      system: decisionSystemPrompt(),
      prompt: `Given this decision problem, generate a structured decision tree with ${breadth} initial options:
      
      <problem>${problem}</problem>
      
      The root node should represent the main decision, and each child node should represent a distinct option or approach.
      
      For each option, assess:
      - A clear description of the option
      - Risk level (1-10 scale, 10 being highest risk)
      - Opportunity level (1-10 scale, 10 being highest opportunity)
      
      Each option should be distinct and meaningful - represent truly different approaches, not just variations of the same approach.
      
      Generate ONLY the initial options - do not explore any second-level consequences yet. Keep the description of each option concise.`,
      schema: z.object({
        decisionTree: z.object({
          id: z.string().describe("UUID of the root decision node").default(rootNodeId),
          description: z.string().describe("Description of the main decision to be made"),
          type: z.literal("decision").describe("Type of node - root should be 'decision'"),
          parentId: z.null().describe("Parent ID - root node should have null parent"),
          children: z.array(z.object({
            id: z.string().describe("UUID of this option").default(""),
            description: z.string().describe("Description of this option/approach"),
            type: z.literal("chance").describe("Type of node - options should be 'chance' nodes"),
            parentId: z.string().describe("Parent ID - should be the root node's ID").default(rootNodeId),
            risk: z.number().min(1).max(10).describe("Risk assessment (1-10, 10 being highest risk)"),
            opportunity: z.number().min(1).max(10).describe("Opportunity assessment (1-10, 10 being highest opportunity)"),
            children: z.array(z.any()).describe("Child nodes - should be empty at this stage").default([]),
          })).max(breadth).describe(`Up to ${breadth} distinct options/approaches`),
        }).describe("The decision tree with the root decision and initial options"),
      }),
    });

    // 规范化决策树
    const normalizedTree = this.normalizeNode(res.object.decisionTree);
    info(`Generated initial decision tree with ${normalizedTree.children.length} options`);

    return normalizedTree;
  }

  /**
   * 扩展决策节点
   * Expand decision node
   *
   * @param {object} params - 参数对象
   * @param {DecisionNode} params.node - 决策节点
   * @param {number} params.depth - 当前深度
   * @param {number} params.breadth - 展开广度
   * @param {string} params.problem - 决策问题
   * @param {string} params.path - 当前路径
   * @returns {Promise<DecisionNode>} 扩展后的决策节点
   */
  private async expandDecisionNode({
    node,
    depth: _depth,
    breadth,
    problem,
    path,
  }: {
    node: DecisionNode;
    depth: number;
    breadth: number;
    problem: string;
    path: string;
  }): Promise<DecisionNode> {
    if (node.children.length > 0) {
      return node; // 已经展开过了
    }

    const fullPath = path ? `${path} → ${node.description}` : node.description;

    try {
      const res = await generateObject({
        model: getModel(),
        system: decisionSystemPrompt(),
        prompt: trimPrompt(`For the following decision problem:
        
        <problem>${problem}</problem>
        
        Given the current decision path:
        ${fullPath}
        
        Please analyze the potential outcomes of this option. Generate up to ${breadth} distinct, meaningful consequences or follow-up decisions that would naturally flow from this option.
        
        For each consequence/follow-up:
        
        - If it's a follow-up decision that requires further choices, label it as a "decision" type and describe the new decision to be made
        - If it's a chance event or outcome, label it as an "outcome" type and describe what happens
        - For chance outcomes, assess the probability (0-100%) of that outcome occurring
        - For all outcomes, evaluate both the risk level (1-10) and opportunity level (1-10)
        
        Ensure that:
        - Each consequence is distinct and meaningful
        - The set of consequences covers the most important possible developments
        - Descriptions are concise but clear
        - Together they represent a reasonable distribution of what might happen next
        `),
        schema: z.object({
          consequences: z.array(z.object({
            id: z.string().describe("UUID for this consequence node").default(""),
            description: z.string().describe("Description of this consequence or follow-up decision"),
            type: z.enum(["decision", "outcome"]).describe("Type of node - 'decision' for follow-up decisions, 'outcome' for chance events or results"),
            parentId: z.string().describe("Parent ID - should be the current node's ID").default(node.id),
            risk: z.number().min(1).max(10).describe("Risk assessment (1-10, 10 being highest risk)"),
            opportunity: z.number().min(1).max(10).describe("Opportunity assessment (1-10, 10 being highest opportunity)"),
            probability: z.number().min(0).max(100).optional().describe("Probability assessment (0-100%) - only for 'outcome' type nodes"),
            children: z.array(z.any()).describe("Child nodes - should be empty at this stage").default([]),
          })).max(breadth).describe(`Up to ${breadth} distinct consequences or follow-up decisions`),
        }),
      });

      // 更新节点的子节点
      node.children = res.object.consequences.map((child: GeneratedNode) =>
        this.normalizeNode(child, node.id));

      info(`Expanded node "${node.description}" with ${node.children.length} consequences`);
      return node;
    } catch (error) {
      warn(`Error expanding node ${node.description}:`, error);
      return node;
    }
  }

  /**
   * 分析决策树
   * Analyze decision tree
   *
   * @param {object} params - 参数对象
   * @param {DecisionNode} params.node - 决策节点
   * @param {number} params.depth - 当前深度
   * @param {number} params.maxDepth - 最大深度
   * @param {string} params.problem - 决策问题
   * @param {string} params.path - 当前路径
   * @param {Function} params.onProgress - 进度回调
   * @param {number} params.totalBranches - 总分支数
   * @param {{ value: number }} params.completedBranches - 已完成分支数
   * @param {number} params.breadth - 展开广度
   * @returns {Promise<DecisionNode>} 分析后的决策树
   */
  private async analyzeDecisionTree({
    node,
    depth = 0,
    maxDepth,
    problem,
    path = "",
    onProgress,
    totalBranches,
    completedBranches,
    breadth,
  }: {
    node: DecisionNode;
    depth?: number;
    maxDepth: number;
    problem: string;
    path?: string;
    onProgress?: (progress: DecisionProgress) => void;
    totalBranches: number;
    completedBranches: { value: number };
    breadth: number;
  }): Promise<DecisionNode> {
    const currentPath = path ? `${path} → ${node.description}` : node.description;

    // 如果已经达到最大深度，则不再展开
    if (depth >= maxDepth) {
      completedBranches.value += 1;
      if (onProgress) {
        onProgress({
          currentDepth: depth,
          totalDepth: maxDepth,
          currentBranch: currentPath,
          totalBranches,
          completedBranches: completedBranches.value,
        });
      }
      return node;
    }

    // 展开当前节点
    const expandedNode = await this.expandDecisionNode({
      node,
      depth,
      breadth,
      problem,
      path,
    });

    // 递归展开子节点
    const childPromises = expandedNode.children.map(async (child) => {
      // 递归分析子节点
      const analyzedChild = await this.analyzeDecisionTree({
        node: child,
        depth: depth + 1,
        maxDepth,
        problem,
        path: currentPath,
        onProgress,
        totalBranches,
        completedBranches,
        breadth,
      });
      return analyzedChild;
    });

    // 等待所有子节点分析完成
    expandedNode.children = await Promise.all(childPromises);

    // 如果是根节点，则完成一个分支
    if (depth === 0) {
      completedBranches.value += 1;
      if (onProgress) {
        onProgress({
          currentDepth: depth,
          totalDepth: maxDepth,
          currentBranch: currentPath,
          totalBranches,
          completedBranches: completedBranches.value,
        });
      }
    }

    return expandedNode;
  }

  /**
   * 生成决策报告
   * Generate decision report
   *
   * @param {object} params - 参数对象
   * @param {string} params.problem - 决策问题
   * @param {DecisionNode} params.decisionTree - 决策树
   * @param {string[]} params.insights - 关键见解
   * @returns {Promise<string>} 决策报告
   */
  public async generateDecisionReport({
    problem,
    decisionTree,
    insights,
  }: {
    problem: string;
    decisionTree: DecisionNode;
    insights: string[];
  }): Promise<string> {
    try {
      const res = await generateObject({
        model: getModel(),
        system: decisionSystemPrompt(),
        prompt: trimPrompt(`Generate a structured markdown report for the following decision analysis:
        
        <problem>${problem}</problem>
        
        <decision_tree>${JSON.stringify(decisionTree, null, 2)}</decision_tree>
        
        <insights>
        ${insights.join("\n")}
        </insights>
        
        Create a comprehensive report that follows the following structure:
        
        1. Executive Summary - brief overview of the decision problem and main insights
        2. Decision Context - more detailed explanation of the decision problem and relevant context
        3. Analysis Methodology - brief explanation of the approach used to analyze the decision
        4. Key Options:
           - For each major option from the decision tree, create a subsection with:
             - Description of the option
             - Risk and opportunity assessment
             - Key potential outcomes
             - Insights specific to this option
        5. Comparative Analysis - compare the options based on risk, opportunity, and outcomes
        6. Key Insights - list all the key insights from the analysis
        7. Recommendations - provide clear recommendations based on the analysis
        
        Use proper markdown formatting and structure.`),
        schema: z.object({
          report: z.string().describe("Complete markdown report for the decision analysis"),
        }),
      });

      return res.object.report;
    } catch (error) {
      warn("Error generating decision report:", error);
      return `# Decision Analysis Report\n\nError generating report: ${error}`;
    }
  }

  /**
   * 提取关键见解
   * Extract key insights
   *
   * @param {object} params - 参数对象
   * @param {string} params.problem - 决策问题
   * @param {DecisionNode} params.decisionTree - 决策树
   * @returns {Promise<string[]>} 关键见解列表
   */
  private async extractKeyInsights({
    problem,
    decisionTree,
  }: {
    problem: string;
    decisionTree: DecisionNode;
  }): Promise<string[]> {
    try {
      const res = await generateObject({
        model: getModel(),
        system: decisionSystemPrompt(),
        prompt: trimPrompt(`Based on the following decision problem and analysis, extract 5-8 key insights that emerge from the analysis.
        
        <problem>${problem}</problem>
        
        <decision_tree>${JSON.stringify(decisionTree, null, 2)}</decision_tree>
        
        An insight should be a meaningful observation about the decision that isn't immediately obvious, such as:
        - Patterns across different options
        - Hidden risks or opportunities
        - Critical dependencies or factors
        - Counter-intuitive findings
        - Strategic implications
        
        Each insight should be expressed as a clear, concise statement (1-2 sentences).`),
        schema: z.object({
          insights: z.array(z.string().describe("A key insight from the decision analysis")).describe("List of 5-8 key insights extracted from the decision analysis"),
        }),
      });

      info(`Generated ${res.object.insights.length} key insights`);
      return res.object.insights;
    } catch (error) {
      warn("Error extracting key insights:", error);
      return ["Unable to extract insights due to an error."];
    }
  }

  /**
   * 计算总分支数
   * Calculate total branches
   *
   * @param {DecisionNode} node - 决策节点
   * @param {number} depth - 当前深度
   * @param {number} maxDepth - 最大深度
   * @param {number} breadth - 展开广度
   * @returns {number} 总分支数
   */
  private calculateTotalBranches(
    node: DecisionNode,
    depth: number,
    maxDepth: number,
    breadth: number = 4,
  ): number {
    // 如果达到最大深度，则只有一个分支
    if (depth >= maxDepth) {
      return 1;
    }

    // 如果节点已经有子节点，则使用实际的子节点数量
    if (node.children.length > 0) {
      return 1 + node.children.reduce(
        (acc, child) => acc + this.calculateTotalBranches(child, depth + 1, maxDepth, breadth),
        0,
      );
    }

    // 否则，使用估计的分支数
    return 1 + breadth * breadth ** (maxDepth - depth - 1);
  }

  /**
   * 分析决策
   * Analyze decision
   *
   * @param {object} params - 参数对象
   * @param {string} params.problem - 决策问题
   * @param {number} params.depth - 分析深度
   * @param {number} params.breadth - 分析广度
   * @param {Function} params.onProgress - 进度回调
   * @returns {Promise<DecisionResult>} 决策分析结果
   */
  public async analyzeDecision({
    problem,
    depth,
    breadth = 4,
    onProgress,
  }: {
    problem: string;
    depth: number;
    breadth?: number;
    onProgress?: (progress: DecisionProgress) => void;
  }): Promise<DecisionResult> {
    // 生成初始决策树
    const initialTree = await this.generateInitialDecisionTree({
      problem,
      breadth,
    });

    // 计算总分支数
    const totalBranches = this.calculateTotalBranches(initialTree, 0, depth, breadth);
    const completedBranches = { value: 0 };

    // 分析决策树
    const decisionTree = await this.analyzeDecisionTree({
      node: initialTree,
      maxDepth: depth,
      problem,
      onProgress,
      totalBranches,
      completedBranches,
      breadth,
    });

    // 提取关键见解
    const insights = await this.extractKeyInsights({
      problem,
      decisionTree,
    });

    return {
      decisionTree,
      insights,
    };
  }

  /**
   * 将决策树转换为JSON字符串
   * Convert decision tree to JSON string
   *
   * @param {DecisionNode} decisionTree - 决策树
   * @returns {string} JSON字符串
   */
  public decisionTreeToJson(decisionTree: DecisionNode): string {
    return JSON.stringify(decisionTree, null, 2);
  }

  /**
   * 将JSON字符串转换为决策树
   * Convert JSON string to decision tree
   *
   * @param {string} json - JSON字符串
   * @returns {DecisionNode} 决策树
   */
  public jsonToDecisionTree(json: string): DecisionNode {
    return JSON.parse(json) as DecisionNode;
  }
}

// 单例实例导出
// Export singleton instance
const decisionService = DecisionService.getInstance();

/**
 * 生成决策反馈问题
 * Generate decision feedback questions
 *
 * @param {object} params - 参数对象
 * @returns {Promise<string[]>} 问题列表
 */
export function generateDecisionFeedback(params: {
  problem: string;
  numQuestions?: number;
}): Promise<string[]> {
  return decisionService.generateDecisionFeedback(params);
}

/**
 * 分析决策
 * Analyze decision
 *
 * @param {object} params - 参数对象
 * @returns {Promise<DecisionResult>} 决策分析结果
 */
export function analyzeDecision(params: {
  problem: string;
  depth: number;
  breadth?: number;
  onProgress?: (progress: DecisionProgress) => void;
}): Promise<DecisionResult> {
  return decisionService.analyzeDecision(params);
}

/**
 * 生成决策报告
 * Generate decision report
 *
 * @param {object} params - 参数对象
 * @returns {Promise<string>} 决策报告
 */
export function generateDecisionReport(params: {
  problem: string;
  decisionTree: DecisionNode;
  insights: string[];
}): Promise<string> {
  return decisionService.generateDecisionReport(params);
}

/**
 * 将决策树转换为JSON字符串
 * Convert decision tree to JSON string
 *
 * @param {DecisionNode} decisionTree - 决策树
 * @returns {string} JSON字符串
 */
export function decisionTreeToJson(decisionTree: DecisionNode): string {
  return decisionService.decisionTreeToJson(decisionTree);
}

/**
 * 将JSON字符串转换为决策树
 * Convert JSON string to decision tree
 *
 * @param {string} json - JSON字符串
 * @returns {DecisionNode} 决策树
 */
export function jsonToDecisionTree(json: string): DecisionNode {
  return decisionService.jsonToDecisionTree(json);
}
