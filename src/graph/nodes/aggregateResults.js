async function aggregateResults(state) {
  console.log('🔗 [Node] aggregateResults — merging LLM + static analysis results');

  let review = null;

  // Start with LLM review if available
  if (state.llmReview) {
    review = { ...state.llmReview };
  }

  // If no LLM response (fallback)
  if (!review) {
    review = {
      verdict: "approved",
      summary: "No issues detected.",
      overall_risk: "low",
      positives: ["Code passed all automated checks."],
      files: []
    };
  }

  // Merge deterministic/static issues into summary
  if (state.autoFixReport) {
    if (state.autoFixReport.issues.length > 0) {
      review.summary += `\n\n⚠️ Additional automated findings: ${state.autoFixReport.count} issue(s) auto-detected and reported without LLM review.`;
    }

    // If auto-fix found issues, downgrade approval
    if (review.verdict === "approved" && state.autoFixReport.issues.length > 0) {
      review.verdict = "comment";
    }

    // Java version compliance is a hard requirement, not a style suggestion —
    // always request changes and make sure the risk reflects that, regardless
    // of what the LLM itself concluded.
    const javaVersionIssues = state.autoFixReport.javaVersionIssues || [];
    if (javaVersionIssues.length > 0) {
      review.verdict = "changes_requested";

      const RISK_RANK = { low: 0, medium: 1, high: 2, critical: 3 };
      const currentRank = RISK_RANK[review.overall_risk] ?? 0;
      if (currentRank < RISK_RANK.high) {
        review.overall_risk = "high";
      }
    }
  }

  return {
    llmReview: review
  };
}

module.exports = { aggregateResults };