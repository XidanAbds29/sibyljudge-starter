// backend/server/runners/testRunner.js
const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const TEMP_DIR = path.join(__dirname, "../temp");

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Language configurations
const LANGS = {
  cpp: {
    ext: ".cpp",
    compile: (file) => ["g++", [file, "-o", file.replace(".cpp", "")]],
    run: (file) => [file.replace(".cpp", ""), []],
  },
  python: {
    ext: ".py",
    run: (file) => ["python", [file]],
  },
  java: {
    ext: ".java",
    compile: (file) => ["javac", [file]],
    run: (file) => ["java", ["-cp", path.dirname(file), "Main"]],
  },
};

async function runCode(language, code, input) {
  // Create unique filename
  const hash = crypto.createHash("md5").update(code).digest("hex");
  const ext = LANGS[language].ext;
  const filename = path.join(TEMP_DIR, `${hash}${ext}`);

  try {
    // Write code to file
    await fs.writeFile(filename, code);

    // Compile if needed
    if (LANGS[language].compile) {
      const [cmd, args] = LANGS[language].compile(filename);
      await new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        let stderr = "";
        proc.stderr.on("data", (data) => (stderr += data));
        proc.on("close", (code) => {
          if (code !== 0) reject(new Error(`Compilation error:\\n${stderr}`));
          else resolve();
        });
      });
    }

    // Run code
    const [cmd, args] = LANGS[language].run(filename);
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args);
      let output = "";
      let error = "";

      // Send input if provided
      if (input) {
        proc.stdin.write(input);
        proc.stdin.end();
      }

      proc.stdout.on("data", (data) => (output += data));
      proc.stderr.on("data", (data) => (error += data));

      proc.on("close", (code) => {
        // Cleanup
        fs.unlink(filename).catch(console.error);
        if (LANGS[language].compile) {
          fs.unlink(filename.replace(ext, "")).catch(console.error);
        }

        if (code !== 0) {
          reject(new Error(error || "Runtime error"));
        } else {
          resolve(output);
        }
      });

      // Set timeout
      setTimeout(() => {
        proc.kill();
        reject(new Error("Time limit exceeded"));
      }, 10000); // 10 second timeout
    });
  } catch (err) {
    // Cleanup on error
    fs.unlink(filename).catch(console.error);
    throw err;
  }
}

module.exports = { runCode };
