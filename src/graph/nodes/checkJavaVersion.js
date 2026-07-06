const { checkJavaVersion: runCheck } = require('../../analysis/javaVersionChecker');

async function checkJavaVersion(state) {
  console.log('☕ [Node] checkJavaVersion — checking for Java version mismatches');
  try {
    const javaVersionIssues = runCheck(state.parsedDiff || []);
    console.log(`   → ${javaVersionIssues.length} Java version issue(s) found`);
    return { javaVersionIssues };
  } catch (err) {
    // Never fatal — a checker bug shouldn't block the whole review.
    console.warn('⚠️  checkJavaVersion failed, skipping —', err.message);
    return { javaVersionIssues: [] };
  }
}

module.exports = { checkJavaVersion };
