import process from "node:process";
import { startAPI } from "./services/api-service";
import { error } from "./utils/logger";

/**
 * 主函数
 * Main function
 */
async function main(): Promise<void> {
  try {
    startAPI();
  } catch (err) {
    error("API服务启动出错:", err);
    process.exit(1);
  }
}

// 执行主函数
// Execute main function
main().catch((err) => {
  error("API服务崩溃:", err);
  process.exit(1);
});
