const { getLLMReview } = require('../../llm/reviewEngine');

async function llmReview(state) {
  console.log('🤖 [Node] llmReview — calling Groq LLM for review');
  try {
    // Only send issues classified as needing LLM judgment (critical/high).
    // Deterministic/auto-comment issues (e.g. syntax errors) are already
    // handled by deterministicReport and merged in during aggregateResults —
    // sending everything here made the classification step meaningless.
    const llmQueueIssues = state.classifiedIssues?.llm_queue || state.analysisIssues || [];

    const llmReview = await getLLMReview({
      metadata: state.metadata,
      parsedDiff: state.parsedDiff,
      analysisIssues: llmQueueIssues,
    });
    console.log(`   → verdict: ${llmReview.verdict}, risk: ${llmReview.overall_risk}`);
    return { llmReview };
  } catch (err) {
    console.error('❌ llmReview failed:', err.message);
    return { error: err.message };
  }
}

module.exports = { llmReview };
