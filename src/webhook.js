const express = require('express');
const { extractDiff } = require('./diff/extractor');
const { parseDiff } = require('./diff/parser');
const { runSecurityScan } = require('./analysis/securityScanner');
const { classifyIssues } = require('./classification/issueClassifier');
const { getLLMReview } = require('./llm/reviewEngine');
const { postComment } = require('./github/prCommenter');

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`\n📦 GitHub Event: ${event}`);

  if (event === 'pull_request') {
    const { action, pull_request, repository } = payload;

    if (!['opened', 'synchronize'].includes(action)) {
      return res.status(200).json({ status: 'ignored', action });
    }

    const metadata = {
      action,
      pr_number: pull_request.number,
      pr_title: pull_request.title,
      author: pull_request.user.login,
      repo: repository.full_name,
      base_branch: pull_request.base.ref,
      head_branch: pull_request.head.ref,
      diff_url: pull_request.diff_url,
      commits: pull_request.commits,
      changed_files: pull_request.changed_files,
    };

    console.log('✅ PR Metadata:', metadata);

    const rawDiff = await extractDiff(metadata.diff_url);
    const parsedDiff = parseDiff(rawDiff);
    console.log('\n🔍 Parsed Diff:', JSON.stringify(parsedDiff, null, 2));

    const securityIssues = await runSecurityScan(parsedDiff);
    console.log('\n🔒 Security Issues:', JSON.stringify(securityIssues, null, 2));

    const classifiedIssues = classifyIssues(securityIssues);
    console.log('\n📊 Classified Issues:', JSON.stringify(classifiedIssues, null, 2));

    if (classifiedIssues.llm_queue.length > 0) {
      const issue = classifiedIssues.llm_queue[0];

      const prompt = `Review this code issue found in ${issue.file}:
Rule: ${issue.rule_id}
Severity: ${issue.severity}
Description: ${issue.description}
Code: ${issue.line}`;

      const review = await getLLMReview(prompt);

      const commentBody = `## 🤖 AI Code Review

${review}

---
*Powered by AI Code Review Agent*`;

      await postComment(metadata.repo, metadata.pr_number, commentBody);
      console.log('\n✅ Comment posted to PR!');
    }

    return res.status(200).json({ status: 'received', metadata, parsedDiff });
  }

  res.status(200).json({ status: 'ignored', event });
});

module.exports = router;