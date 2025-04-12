/**
 * 递归字符文本分割器
 * Recursive Character Text Splitter
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  /**
   * 构造函数
   * Constructor
   *
   * @param options - 分割器配置
   */
  constructor(options: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  } = {}) {
    this.chunkSize = options.chunkSize || 4000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.separators = options.separators || [
      "\n\n",
      "\n",
      " ",
      "",
    ];
  }

  /**
   * 分割文本
   * Split text
   *
   * @param text - 要分割的文本
   * @returns 分割后的文本块数组
   */
  public splitText(text: string): string[] {
    // 处理空文本
    if (!text) {
      return [];
    }

    // 如果文本长度小于块大小，直接返回
    if (text.length <= this.chunkSize) {
      return [text];
    }

    // 递归分割文本
    return this.splitTextRecursive(text);
  }

  /**
   * 递归分割文本
   * Split text recursively
   *
   * @param text - 要分割的文本
   * @returns 分割后的文本块数组
   */
  private splitTextRecursive(text: string): string[] {
    let finalChunks: string[] = [];

    // 尝试使用每个分隔符分割文本
    for (const separator of this.separators) {
      if (separator === "") {
        // 如果分隔符为空，则按照字符进行分割
        const chunks = this.splitBySize(text);
        if (chunks.length > 1) {
          finalChunks = chunks;
          break;
        }
      } else if (text.includes(separator)) {
        // 如果文本包含分隔符，则按照分隔符进行分割
        const splits = text.split(separator);

        // 合并分割后的文本块，确保每个块的大小不超过 chunkSize
        const goodSplits = [];
        let currentSplit = "";

        for (const s of splits) {
          if (s === "") {
            continue;
          }

          const potentialSplit = currentSplit === ""
            ? s
            : `${currentSplit}${separator}${s}`;

          if (potentialSplit.length <= this.chunkSize) {
            currentSplit = potentialSplit;
          } else {
            if (currentSplit !== "") {
              goodSplits.push(currentSplit);
            }
            currentSplit = s;
          }
        }

        if (currentSplit !== "") {
          goodSplits.push(currentSplit);
        }

        if (goodSplits.length > 1) {
          finalChunks = goodSplits;
          break;
        }
      }
    }

    // 如果没有找到合适的分隔符，则按照大小进行分割
    if (finalChunks.length === 0) {
      finalChunks = this.splitBySize(text);
    }

    // 进一步递归分割，确保每个块的大小不超过 chunkSize
    const result: string[] = [];
    for (const chunk of finalChunks) {
      if (chunk.length > this.chunkSize) {
        result.push(...this.splitTextRecursive(chunk));
      } else {
        result.push(chunk);
      }
    }

    return result;
  }

  /**
   * 按大小分割文本
   * Split text by size
   *
   * @param text - 要分割的文本
   * @returns 分割后的文本块数组
   */
  private splitBySize(text: string): string[] {
    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      const chunk = text.slice(i, i + this.chunkSize);
      chunks.push(chunk);
      i += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }
}
