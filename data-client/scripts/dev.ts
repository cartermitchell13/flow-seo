import { spawn } from "child_process";
import chalk from "chalk";

/**
 * Development Environment Setup
 * ---------------------------
 * This script starts the Next.js development server.
 */

async function main() {
  try {
    // Start Next.js dev server
    const nextProcess = spawn("next", ["dev"], {
      stdio: "inherit",
      shell: true,
    });

    // Handle process exit
    nextProcess.on("exit", (code) => {
      if (code !== 0) {
        console.error(chalk.red(`Next.js process exited with code ${code}`));
        process.exit(code || 1);
      }
    });

    // Handle process errors
    nextProcess.on("error", (err) => {
      console.error(chalk.red("Failed to start Next.js process:"), err);
      process.exit(1);
    });

  } catch (error) {
    console.error(chalk.red("Error starting development environment:"), error);
    process.exit(1);
  }
}

main();
