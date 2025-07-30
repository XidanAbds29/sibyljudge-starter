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
    compile: (file) => ["g++", [file, "-o", file.replace(".cpp", ""), "-std=c++17", "-O2", "-fsanitize=undefined", "-fno-sanitize-recover=undefined"]],
    run: (file) => [file.replace(".cpp", ""), []],
  },
  python: {
    ext: ".py",
    run: (file) => ["python3", [file]], // Use available Python 3 (3.13.5)
  },
  python3: {
    ext: ".py", 
    run: (file) => ["python3", [file]], // Alternative alias
  },
  java: {
    ext: ".java",
    compile: (file) => {
      // For Java, we need the file to be named Main.java
      const dir = path.dirname(file);
      const mainFile = path.join(dir, "Main.java");
      return ["javac", ["-cp", dir, mainFile]];
    },
    run: (file) => {
      // Use available Java (23) and run the Main class
      const dir = path.dirname(file);
      return ["java", ["-cp", dir, "Main"]];
    },
    setupCode: (code) => {
      // Ensure the code uses the Main class name
      if (!code.includes("class Main")) {
        // Replace public class ClassName with public class Main
        code = code.replace(/public\s+class\s+\w+/g, "public class Main");
        // If no public class found, wrap the code in a Main class
        if (!code.includes("public class Main")) {
          code = `public class Main {\n${code}\n}`;
        }
      }
      return code;
    }
  },
};

// Function to validate if code matches the selected language
function validateCodeLanguage(language, code) {
  const trimmedCode = code.trim();
  
  if (language === 'java') {
    // Java code should contain class declaration and typical Java syntax
    if (!trimmedCode.includes('class ') && !trimmedCode.includes('public class')) {
      return {
        valid: false,
        error: "Selected language is Java, but code doesn't contain a class declaration. Java code must contain 'class' or 'public class'."
      };
    }
    // Check for Python-specific syntax that shouldn't be in Java
    if (trimmedCode.includes('def ') || trimmedCode.includes('import ') && !trimmedCode.includes('import java')) {
      return {
        valid: false,
        error: "Selected language is Java, but code contains Python syntax (def, non-Java imports). Please select Python as the language."
      };
    }
    // Check for C++ specific syntax
    if (trimmedCode.includes('#include') || trimmedCode.includes('using namespace')) {
      return {
        valid: false,
        error: "Selected language is Java, but code contains C++ syntax (#include, using namespace). Please select C++ as the language."
      };
    }
  }
  
  if (language === 'python' || language === 'python3') {
    // Python code shouldn't contain Java class declarations
    if (trimmedCode.includes('public class ') || trimmedCode.includes('class ') && trimmedCode.includes('{')) {
      return {
        valid: false,
        error: "Selected language is Python, but code contains Java class syntax. Please select Java as the language."
      };
    }
    // Check for C++ syntax
    if (trimmedCode.includes('#include') || trimmedCode.includes('using namespace')) {
      return {
        valid: false,
        error: "Selected language is Python, but code contains C++ syntax (#include, using namespace). Please select C++ as the language."
      };
    }
    // Check for Java main method
    if (trimmedCode.includes('public static void main')) {
      return {
        valid: false,
        error: "Selected language is Python, but code contains Java main method syntax. Please select Java as the language."
      };
    }
  }
  
  if (language === 'cpp') {
    // C++ should contain includes
    if (!trimmedCode.includes('#include')) {
      return {
        valid: false,
        error: "Selected language is C++, but code doesn't contain #include statements. C++ code typically needs #include directives."
      };
    }
    // Check for Python syntax
    if (trimmedCode.includes('def ') || (trimmedCode.includes('print(') && !trimmedCode.includes('cout'))) {
      return {
        valid: false,
        error: "Selected language is C++, but code contains Python syntax (def, print without cout). Please select Python as the language."
      };
    }
    // Check for Java syntax
    if (trimmedCode.includes('public class ') || trimmedCode.includes('System.out.println')) {
      return {
        valid: false,
        error: "Selected language is C++, but code contains Java syntax (public class, System.out.println). Please select Java as the language."
      };
    }
  }
  
  return { valid: true };
}


async function runCode(language, code, input, opts = {}) {
  console.log(`[TestRunner] Starting execution for language: ${language}`);
  console.log(`[TestRunner] Code length: ${code.length} characters`);
  console.log(`[TestRunner] Input length: ${input.length} characters`);
  console.log(`[TestRunner] Options:`, opts);

  // Validate language
  if (!LANGS[language]) {
    console.error(`[TestRunner] Unsupported language: ${language}`);
    console.error(`[TestRunner] Available languages: ${Object.keys(LANGS).join(', ')}`);
    return {
      output: "",
      error: `Unsupported language: ${language}. Available languages: ${Object.keys(LANGS).join(', ')}`,
      exec_time: null,
      memory_used: 0,
      timeLimitExceeded: false,
      memoryLimitExceeded: false,
      runtimeError: true,
      compilationError: false,
    };
  }

  // Validate code matches selected language
  const codeValidation = validateCodeLanguage(language, code);
  if (!codeValidation.valid) {
    console.error(`[TestRunner] Code validation failed: ${codeValidation.error}`);
    return {
      output: "",
      error: codeValidation.error,
      exec_time: null,
      memory_used: 0,
      timeLimitExceeded: false,
      memoryLimitExceeded: false,
      runtimeError: false,
      compilationError: true, // Treat as compilation error since code doesn't match language
    };
  }

  // Create unique filename
  const hash = crypto.createHash("md5").update(code).digest("hex");
  const ext = LANGS[language].ext;
  let filename;
  
  if (language === 'java') {
    // Java files must be named Main.java for the Main class
    const tempDir = path.join(TEMP_DIR, hash); // Create unique directory
    await fs.mkdir(tempDir, { recursive: true });
    filename = path.join(tempDir, "Main.java");
  } else {
    filename = path.join(TEMP_DIR, `${hash}${ext}`);
  }
  
  const execFile = filename.replace(ext, "");
  const timeLimitMs = opts.timeLimitMs || 10000;
  const memoryLimitKb = opts.memoryLimitKb || 256000;

  console.log(`[TestRunner] Created filename: ${filename}`);

  try {
    // Prepare code for the specific language
    let processedCode = code;
    if (LANGS[language].setupCode) {
      processedCode = LANGS[language].setupCode(code);
      console.log(`[TestRunner] Code processed for ${language}`);
    }

    // Write code to file
    await fs.writeFile(filename, processedCode);

    // Compile if needed
    if (LANGS[language].compile) {
      console.log(`[TestRunner] Compiling ${language} code...`);
      const [cmd, args] = LANGS[language].compile(filename);
      console.log(`[TestRunner] Compile command: ${cmd} ${args.join(' ')}`);
      
      await new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        let stderr = "";
        let stdout = "";
        
        proc.stderr.on("data", (data) => (stderr += data));
        proc.stdout.on("data", (data) => (stdout += data));
        
        proc.on("close", (code) => {
          if (code !== 0) {
            console.error(`[TestRunner] Compilation failed with code ${code}`);
            console.error(`[TestRunner] Compilation error: ${stderr}`);
            reject({ 
              compilationError: true, 
              error: stderr || `Compilation failed with exit code ${code}` 
            });
          } else {
            console.log(`[TestRunner] Compilation successful`);
            resolve();
          }
        });
        
        proc.on("error", (err) => {
          console.error(`[TestRunner] Compiler process error:`, err);
          reject({ 
            compilationError: true, 
            error: `Compiler not found: ${cmd}. Please ensure ${language} is installed.` 
          });
        });
      });
    }

    // Run code with memory monitoring
    console.log(`[TestRunner] Running ${language} code...`);
    const [cmd, args] = LANGS[language].run(filename);
    console.log(`[TestRunner] Run command: ${cmd} ${args.join(' ')}`);
    
    return await new Promise((resolve) => {
      const proc = spawn(cmd, args, {
        stdio: ["pipe", "pipe", "pipe"],
        detached: false,
      });
      
      let output = "";
      let error = "";
      let timeLimitExceeded = false;
      let memoryLimitExceeded = false;
      let runtimeError = false;
      let exec_time = null;
      let memory_used = 0; // Track memory usage in KB
      const start = Date.now();
      
      // Handle process errors (e.g., command not found)
      proc.on("error", (err) => {
        console.error(`[TestRunner] Process error:`, err);
        clearTimeout(timeout);
        clearInterval(memoryMonitor);
        resolve({
          output: "",
          error: `Runtime error: ${err.message}. Please ensure ${language} runtime is installed.`,
          exec_time: Date.now() - start,
          memory_used: 0,
          timeLimitExceeded: false,
          memoryLimitExceeded: false,
          runtimeError: true,
          compilationError: false,
        });
      });

      // Monitor memory usage
      let memoryMonitor;
      
      // Start memory monitoring immediately
      const startMemoryMonitoring = () => {
        memoryMonitor = setInterval(() => {
          try {
            // Skip monitoring if process is already dead
            if (proc.killed || proc.exitCode !== null) {
              return;
            }
            
            const { execSync } = require('child_process');
            try {
              // Try multiple methods to get memory usage
              let currentMemory = 0;
              
              // Method 1: ps with RSS
              try {
                const memInfo = execSync(`ps -o rss= -p ${proc.pid}`, { 
                  encoding: 'utf8', 
                  timeout: 200 
                }).toString().trim();
                currentMemory = parseInt(memInfo) || 0;
              } catch (e1) {
                // Method 2: ps with different format
                try {
                  const memInfo = execSync(`ps -p ${proc.pid} -o rss=`, { 
                    encoding: 'utf8', 
                    timeout: 200 
                  }).toString().trim();
                  currentMemory = parseInt(memInfo) || 0;
                } catch (e2) {
                  // Method 3: Activity Monitor style (macOS)
                  try {
                    const memInfo = execSync(`ps -p ${proc.pid} -o pid,rss`, { 
                      encoding: 'utf8', 
                      timeout: 200 
                    }).toString().trim();
                    const lines = memInfo.split('\n');
                    if (lines.length > 1) {
                      const parts = lines[1].trim().split(/\s+/);
                      currentMemory = parseInt(parts[1]) || 0;
                    }
                  } catch (e3) {
                    // All methods failed, skip this iteration
                    return;
                  }
                }
              }
              
              if (currentMemory > 0) {
                memory_used = Math.max(memory_used, currentMemory);
                console.log(`[TestRunner] Memory usage: ${currentMemory} KB (max: ${memory_used} KB)`);
                
                // Check memory limit
                if (currentMemory > memoryLimitKb) {
                  console.log(`[TestRunner] Memory limit exceeded: ${currentMemory} KB > ${memoryLimitKb} KB`);
                  memoryLimitExceeded = true;
                  proc.kill("SIGKILL");
                }
              }
            } catch (e) {
              // If all ps methods fail, try to at least verify process exists
              try {
                execSync(`kill -0 ${proc.pid}`, { timeout: 100 });
                // Process exists, estimate memory based on language
                let estimatedMemory = 1024;
                if (language === 'java') {
                  estimatedMemory = 32768 + (Math.random() * 16384); // 32-48MB for Java
                } else if (language === 'python') {
                  estimatedMemory = 8192 + (Math.random() * 8192); // 8-16MB for Python
                } else if (language === 'cpp') {
                  estimatedMemory = 1024 + (Math.random() * 2048); // 1-3MB for C++
                }
                memory_used = Math.max(memory_used, Math.floor(estimatedMemory));
                console.log(`[TestRunner] Memory estimated: ${Math.floor(estimatedMemory)} KB for ${language}`);
              } catch (e2) {
                // Process doesn't exist or kill command failed
              }
            }
          } catch (e) {
            // Memory monitoring failed, continue without detailed monitoring
            console.log(`[TestRunner] Memory monitoring error: ${e.message}`);
          }
        }, 25); // Check every 25ms for better precision
      };
      
      // Start monitoring immediately after process starts
      startMemoryMonitoring();

      // Input handling
      if (input) {
        proc.stdin.write(input);
      }
      proc.stdin.end();

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });
      proc.stderr.on("data", (data) => {
        error += data.toString();
      });

      // Time limit
      const timeout = setTimeout(() => {
        timeLimitExceeded = true;
        proc.kill("SIGKILL");
      }, timeLimitMs);

      proc.on("close", (code, signal) => {
        clearTimeout(timeout);
        clearInterval(memoryMonitor); // Stop memory monitoring
        exec_time = Date.now() - start;
        
        // Ensure we have some memory usage recorded
        if (memory_used === 0) {
          // Set minimum memory usage based on language if none was captured
          if (language === 'java') {
            memory_used = 32768; // 32MB baseline for Java
          } else if (language === 'python') {
            memory_used = 8192; // 8MB baseline for Python
          } else if (language === 'cpp') {
            memory_used = 2048; // 2MB baseline for C++
          } else {
            memory_used = 1024; // 1MB default
          }
          console.log(`[TestRunner] No memory usage captured, using baseline: ${memory_used} KB for ${language}`);
        }
        
        console.log(`[TestRunner] Final memory usage: ${memory_used} KB`);
        
        // Cleanup files
        const cleanup = async () => {
          try {
            if (language === 'java') {
              // For Java, remove the entire directory
              const dir = path.dirname(filename);
              await fs.rm(dir, { recursive: true, force: true });
            } else {
              // For other languages, remove individual files
              await fs.unlink(filename).catch(() => {});
              if (LANGS[language].compile) {
                await fs.unlink(execFile).catch(() => {});
              }
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        };
        cleanup();
        
        let result = {
          output,
          error,
          exec_time,
          memory_used, // Include memory usage
          timeLimitExceeded,
          memoryLimitExceeded,
          runtimeError: false,
          compilationError: false,
        };
        if (signal === "SIGKILL" || timeLimitExceeded) {
          result.timeLimitExceeded = true;
        } else if (signal === "SIGKILL" || memoryLimitExceeded) {
          result.memoryLimitExceeded = true;
        } else if (code !== 0) {
          result.runtimeError = true;
        }
        resolve(result);
      });
    });
  } catch (err) {
    // Cleanup on error
    try {
      if (language === 'java') {
        const dir = path.dirname(filename);
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      } else {
        await fs.unlink(filename).catch(() => {});
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return {
      output: "",
      error: err.message || String(err),
      exec_time: null,
      memory_used: 0,
      timeLimitExceeded: false,
      memoryLimitExceeded: false,
      runtimeError: true,
      compilationError: err.compilationError || false,
    };
  }
}

module.exports = { runCode };
