// Test the updated TestRunner with Python and Java
const { runCode } = require('./runners/testRunner');

async function testLanguages() {
  console.log("🧪 Testing TestRunner with multiple languages...\n");

  // Test Python
  console.log("📍 Testing Python:");
  const pythonCode = `
n = int(input())
print(f"Hello from Python! You entered: {n}")
  `.trim();
  
  const pythonResult = await runCode('python', pythonCode, '42');
  console.log("Python result:", pythonResult);
  console.log();

  // Test Java
  console.log("📍 Testing Java:");
  const javaCode = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        System.out.println("Hello from Java! You entered: " + n);
        scanner.close();
    }
}
  `.trim();
  
  const javaResult = await runCode('java', javaCode, '42');
  console.log("Java result:", javaResult);
  console.log();

  // Test C++
  console.log("📍 Testing C++:");
  const cppCode = `
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << "Hello from C++! You entered: " << n << endl;
    return 0;
}
  `.trim();
  
  const cppResult = await runCode('cpp', cppCode, '42');
  console.log("C++ result:", cppResult);
  console.log();

  console.log("✅ All tests completed!");
}

testLanguages().catch(console.error);
