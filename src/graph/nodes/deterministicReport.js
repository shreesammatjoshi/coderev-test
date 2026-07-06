/**
 * Handles issues classified as "auto-fix candidates" — clear-cut problems
 * that don't need LLM judgment (e.g. formatting, simple lint violations,
 * syntax errors, Java version mismatches).
 *
 * Java version compliance issues are split into their own bucket so the
 * report/comment can surface them as a prominent, mandatory callout rather
 * than lumping them in with informational findings.
 */
async function deterministicReport(state) {
  console.log('🛠️  [Node] deterministicReport — handling auto-fix candidates');

  const autoFixIssues = state.classifiedIssues?.auto_comment || [];

  if (autoFixIssues.length === 0) {
    console.log('   → no auto-fix candidates');
    return { autoFixReport: null };
  }

  const isJavaVersionIssue = (issue) => issue.rule_id && issue.rule_id.startsWith('java-version.');

  const javaVersionIssues = autoFixIssues.filter(isJavaVersionIssue);
  const otherIssues = autoFixIssues.filter(issue => !isJavaVersionIssue(issue));

  const autoFixReport = {
    count: autoFixIssues.length,
    issues: otherIssues,
    javaVersionIssues,
    summary: `${autoFixIssues.length} issue(s) auto-detected and reported without LLM review.`,
  };

  console.log(`   → ${otherIssues.length} auto-fix issue(s), ${javaVersionIssues.length} Java version issue(s) reported`);
  return { autoFixReport };
}

module.exports = { deterministicReport };