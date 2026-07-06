/**
 * Classifies static analysis issues into three buckets:
 *   - llm_queue:     Needs LLM review (high/critical severity)
 *   - auto_comment:  Low severity, post a standard comment without LLM
 *   - skip:          Noise / informational only
 */

/**
 * Flattens the per-file tree-sitter output (from analysis/syntaxParser.js)
 * into the same flat issue shape used by the security scanner, so syntax
 * errors can be classified/reported alongside Semgrep findings instead of
 * being silently dropped.
 *
 * Syntax errors are deterministic facts (the parser either found an ERROR
 * node or it didn't) — they don't need an LLM's judgment call, so they're
 * tagged 'medium' to route into the auto_comment bucket rather than
 * llm_queue.
 */
function flattenSyntaxIssues(syntaxIssues) {
  const issues = [];
  for (const fileResult of syntaxIssues || []) {
    if (!fileResult.hasErrors) continue;
    for (const err of fileResult.errors) {
      issues.push({
        file: fileResult.file,
        line: `L${err.line}:${err.column} — ${err.text || ''}`.trim(),
        rule_id: `syntax.${err.type}`,
        severity: 'medium',
        description: err.type === 'missing_token'
          ? `Parser expected a token that is missing near line ${err.line}, column ${err.column}.`
          : `Syntax error detected near line ${err.line}, column ${err.column}.`,
        needs_llm: false,
      });
    }
  }
  return issues;
}

function classifyIssues(analysisIssues) {
  const llm_queue = [];
  const auto_comment = [];
  const skip = [];

  for (const issue of analysisIssues) {
    if (['critical', 'high'].includes(issue.severity)) {
      llm_queue.push(issue);
    } else if (issue.severity === 'medium') {
      auto_comment.push(issue);
    } else {
      skip.push(issue);
    }
  }

  return { llm_queue, auto_comment, skip };
}

module.exports = { classifyIssues, flattenSyntaxIssues };
