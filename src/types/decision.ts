/**
 * 决策树节点接口
 * Decision tree node interface
 */
export interface DecisionNode {
  /**
   * 节点ID
   * Node ID
   */
  id: string;
  /**
   * 决策或结果描述
   * Decision or outcome description
   */
  description: string;
  /**
   * 节点类型：决策(decision)、机会(chance)、结果(outcome)
   * Node type: decision, chance, or outcome
   */
  type: "decision" | "chance" | "outcome";
  /**
   * 父节点ID
   * Parent node ID
   */
  parentId: string | null;
  /**
   * 风险评估（1-10，10为最高风险）
   * Risk assessment (1-10, 10 being highest risk)
   */
  risk?: number;
  /**
   * 机会评估（1-10，10为最高机会）
   * Opportunity assessment (1-10, 10 being highest opportunity)
   */
  opportunity?: number;
  /**
   * 可能性评估（0-100%）
   * Probability assessment (0-100%)
   */
  probability?: number;
  /**
   * 子节点列表
   * Child nodes
   */
  children: DecisionNode[];
}

/**
 * 用于LLM生成结果的节点类型（属性可能为undefined）
 * Node type for LLM generated results (properties may be undefined)
 */
export interface GeneratedNode {
  id?: string;
  description?: string;
  type?: "decision" | "chance" | "outcome";
  parentId?: string | null;
  risk?: number;
  opportunity?: number;
  probability?: number;
  children?: any[];
}

/**
 * 决策分析进度接口
 * Decision analysis progress interface
 */
export interface DecisionProgress {
  /**
   * 当前深度
   * Current depth
   */
  currentDepth: number;
  /**
   * 总深度
   * Total depth
   */
  totalDepth: number;
  /**
   * 当前决策分支
   * Current decision branch
   */
  currentBranch?: string;
  /**
   * 总决策分支数
   * Total number of decision branches
   */
  totalBranches: number;
  /**
   * 已完成的分支数
   * Number of completed branches
   */
  completedBranches: number;
}

/**
 * 决策分析结果接口
 * Decision analysis result interface
 */
export interface DecisionResult {
  /**
   * 决策树根节点
   * Decision tree root node
   */
  decisionTree: DecisionNode;
  /**
   * 关键见解列表
   * List of key insights
   */
  insights: string[];
}
