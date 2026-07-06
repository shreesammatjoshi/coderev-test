/**
 * Builds the notification email sent after the agent posts a review
 * comment on a PR — gives reviewers/leads the PR context and what the LLM
 * proposed without needing to open GitHub.
 */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function buildReviewEmail(state) {
  const metadata = state.metadata || {};
  const review = state.llmReview || {};
  const commentUrl =
    state.postResult?.html_url ||
    `https://github.com/${metadata.repo}/pull/${metadata.pr_number}`;

  const verdict = review.verdict || 'comment';
  const risk = (review.overall_risk || 'unknown').toUpperCase();

  const subject = `[AI Code Review] PR #${metadata.pr_number} — ${metadata.pr_title} (${verdict})`;

  const filesWithIssues = (review.files || []).filter(f => f.issues && f.issues.length > 0);

  const issuesText = filesWithIssues.length > 0
    ? filesWithIssues.map(f => {
        const lines = f.issues.map(i =>
          `    - [${(i.severity || '').toUpperCase()}] ${i.type}: ${i.description}${i.suggestion ? ` → ${i.suggestion}` : ''}`
        ).join('\n');
        return `  ${f.filename}:\n${lines}`;
      }).join('\n\n')
    : '  No file-level issues were raised.';

  const text = [
    'AI Code Review posted a comment on a pull request.',
    '',
    `Repository:  ${metadata.repo}`,
    `Pull Request: #${metadata.pr_number} — ${metadata.pr_title}`,
    `Author:      ${metadata.author}`,
    `Branch:      ${metadata.head_branch} -> ${metadata.base_branch}`,
    '',
    `Verdict:      ${verdict}`,
    `Overall risk: ${risk}`,
    '',
    'Summary:',
    review.summary || '(no summary available)',
    '',
    'Proposed changes / issues raised:',
    issuesText,
    '',
    `View the full review comment: ${commentUrl}`,
  ].join('\n');

  const issuesHtml = filesWithIssues.length > 0
    ? filesWithIssues.map(f => `
      <p style="margin:12px 0 4px 0;"><strong>${escapeHtml(f.filename)}</strong></p>
      <ul style="margin:0 0 8px 0;">
        ${f.issues.map(i => `<li>[<strong>${escapeHtml((i.severity || '').toUpperCase())}</strong>] ${escapeHtml(i.type)}: ${escapeHtml(i.description)}${i.suggestion ? ` &rarr; ${escapeHtml(i.suggestion)}` : ''}</li>`).join('\n')}
      </ul>`).join('\n')
    : '<p>No file-level issues were raised.</p>';

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; font-size: 14px; color: #1a1a1a;">
      <h2 style="margin-bottom:4px;">🤖 AI Code Review — ${escapeHtml(metadata.pr_title)}</h2>
      <p style="margin:0 0 12px 0; color:#555;">
        ${escapeHtml(metadata.repo)} · PR #${metadata.pr_number} · ${escapeHtml(metadata.author)}<br/>
        <code>${escapeHtml(metadata.head_branch)}</code> &rarr; <code>${escapeHtml(metadata.base_branch)}</code>
      </p>
      <p><strong>Verdict:</strong> ${escapeHtml(verdict)} &nbsp;|&nbsp; <strong>Overall risk:</strong> ${escapeHtml(risk)}</p>
      <p><strong>Summary:</strong><br/>${escapeHtml(review.summary || '(no summary available)')}</p>
      <h3 style="margin-bottom:4px;">Proposed changes / issues raised</h3>
      ${issuesHtml}
      <p style="margin-top:16px;"><a href="${commentUrl}">View the full review comment on GitHub</a></p>
    </div>
  `;

  return { subject, text, html };
}

module.exports = { buildReviewEmail };
