const Groq = require('groq-sdk');
const { buildReviewPrompt } = require('./promptBuilder');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Run the full LLM review given PR context.
 *
 * @param {Object} opts
 * @param {Object} opts.metadata
 * @param {Array}  opts.parsedDiff
 * @param {Array}  opts.analysisIssues
 * @returns {Promise<Object>} Parsed ReviewOutput JSON
 */
async function getLLMReview({ metadata, parsedDiff, analysisIssues }) {
  const { systemPrompt, userPrompt } = buildReviewPrompt({ metadata, parsedDiff, analysisIssues });

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    // Ask Groq to guarantee a JSON object response instead of relying on
    // prompt instructions alone. Avoids the fragile markdown-fence-stripping
    // that could corrupt JSON containing embedded ``` in fix_snippet fields.
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;

  // Defensive fallback: some models still occasionally wrap output in a
  // fence even when json_object mode is requested. Only strip a fence that
  // wraps the ENTIRE response (anchored to the whole string, not per-line),
  // so a ``` embedded inside a fix_snippet string is never touched.
  const fenced = /^```(?:json)?\s*\n([\s\S]*)\n```\s*$/.exec(raw.trim());
  const cleaned = fenced ? fenced[1].trim() : raw.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('⚠️  LLM returned non-JSON:', raw.slice(0, 300));
    // Return a fallback review so the pipeline doesn't crash
    return {
      verdict: 'comment',
      summary: 'AI review could not parse structured output. Raw response attached.',
      overall_risk: 'low',
      positives: [],
      files: [],
      _raw: raw,
    };
  }
}

module.exports = { getLLMReview };
