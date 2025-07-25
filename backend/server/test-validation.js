// Test language validation
const { runCode } = require('./runners/testRunner');

async function testLanguageValidation() {
  console.log("🧪 Testing Language Validation...\n");

  // Test 1: Java code submitted as Python
  console.log("📍 Test 1: Java code submitted as Python (should fail)");
  const javaCodeAsPython = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`.trim();
  
  const result1 = await runCode('python', javaCodeAsPython, '');
  console.log("Result:", {
    compilationError: result1.compilationError,
    runtimeError: result1.runtimeError,
    error: result1.error
  });
  console.log();

  // Test 2: Python code submitted as Java
  console.log("📍 Test 2: Python code submitted as Java (should fail)");
  const pythonCodeAsJava = `
def main():
    print("Hello World")

if __name__ == "__main__":
    main()`.trim();
  
  const result2 = await runCode('java', pythonCodeAsJava, '');
  console.log("Result:", {
    compilationError: result2.compilationError,
    runtimeError: result2.runtimeError,
    error: result2.error
  });
  console.log();

  // Test 3: C++ code submitted as Python
  console.log("📍 Test 3: C++ code submitted as Python (should fail)");
  const cppCodeAsPython = `
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}`.trim();
  
  const result3 = await runCode('python', cppCodeAsPython, '');
  console.log("Result:", {
    compilationError: result3.compilationError,
    runtimeError: result3.runtimeError,
    error: result3.error
  });
  console.log();

  // Test 4: Correct Python code as Python (should succeed)
  console.log("📍 Test 4: Correct Python code as Python (should succeed)");
  const correctPython = `print("Hello World")`;
  
  const result4 = await runCode('python', correctPython, '');
  console.log("Result:", {
    compilationError: result4.compilationError,
    runtimeError: result4.runtimeError,
    output: result4.output.trim(),
    error: result4.error || "No error"
  });
  console.log();

  console.log("✅ Language validation tests completed!");
}

testLanguageValidation().catch(console.error);
