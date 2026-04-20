import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const TIMEOUT_MS = 10000; // 10 second execution timeout

const LANG_CONFIG = {
  javascript: { cmd: (filePath) => `node "${filePath}"`, ext: "js" },
  python: { cmd: (filePath) => `python "${filePath}"`, ext: "py" },
  java: {
    cmd: (filePath) => {
      const dir = path.dirname(filePath);
      const className = path.basename(filePath, ".java");
      return `javac "${filePath}" -d "${dir}" && java -cp "${dir}" ${className}`;
    },
    ext: "java",
    // Java needs the public class name to match filename
    transform: (code) => {
      // Try to extract class name then rename
      const match = code.match(/public\s+class\s+(\w+)/);
      return { code, className: match ? match[1] : "Solution" };
    },
  },
};

export async function executeCode(req, res) {
  const { language, code, stdin = "" } = req.body;

  if (!language || !code) {
    return res.status(400).json({ message: "language and code are required" });
  }

  const config = LANG_CONFIG[language];
  if (!config) {
    return res.status(400).json({ message: `Unsupported language: ${language}` });
  }

  const tmpDir = os.tmpdir();
  let fileName = `deviq_exec_${Date.now()}`;

  // Java: use class name as file name
  if (language === "java" && config.transform) {
    const { className } = config.transform(code);
    fileName = className;
  }

  const filePath = path.join(tmpDir, `${fileName}.${config.ext}`);

  try {
    // Write code to temp file
    await writeFile(filePath, code, "utf-8");

    const command = config.cmd(filePath);

    const result = await new Promise((resolve) => {
      const proc = exec(
        command,
        { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error && error.killed) {
            return resolve({ success: false, error: "⏱ Execution timed out (10s limit)" });
          }
          if (stderr && !stdout) {
            return resolve({ success: false, error: stderr.trim() });
          }
          if (error) {
            return resolve({ success: false, error: stderr?.trim() || error.message });
          }
          resolve({ success: true, output: stdout || "No output" });
        }
      );

      // Feed stdin if provided
      if (stdin && proc.stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      }
    });

    // Cleanup temp file
    unlink(filePath).catch(() => {});

    return res.status(200).json(result);
  } catch (err) {
    unlink(filePath).catch(() => {});
    return res.status(500).json({ success: false, error: err.message });
  }
}
