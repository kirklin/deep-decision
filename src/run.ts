import process from "node:process";
import { runCLI } from "./services/cli-service";
import { error } from "./utils/logger";

/**
 * 主函数
 * Main function
 */
async function main(): Promise<void> {
  try {
    await runCLI();
  } catch (err) {
    error("程序运行出错:", err);
    process.exit(1);
  }
}

// 执行主函数
// Execute main function
main().catch((err) => {
  error("程序崩溃:", err);
  process.exit(1);
});
