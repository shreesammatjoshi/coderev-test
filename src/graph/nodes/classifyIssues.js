const { classifyIssues: classify, flattenSyntaxIssues } = require('../../classification/issueClassifier');

async function classifyIssues(state) {
  console.log('📊 [Node] classifyIssues — classifying analysis findings');

  // Combine Semgrep findings, tree-sitter syntax errors, and Java-version
  // mismatches — previously syntaxIssues was computed and never consumed.
  const combinedIssues = [
    ...(state.analysisIssues || []),
    ...flattenSyntaxIssues(state.syntaxIssues),
    ...(state.javaVersionIssues || []),
  ];

  const classifiedIssues = classify(combinedIssues);
  console.log(`   → llm_queue: ${classifiedIssues.llm_queue.length}, auto: ${classifiedIssues.auto_comment.length}, skip: ${classifiedIssues.skip.length}`);
  return { classifiedIssues };
}

module.exports = { classifyIssues };
