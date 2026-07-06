const { sendReviewEmail } = require('../../notifications/emailNotifier');

async function sendEmailNotification(state) {
  console.log('📧 [Node] sendEmailNotification — notifying reviewers by email');
  try {
    const emailResult = await sendReviewEmail(state);
    if (emailResult.skipped) {
      console.log(`   → skipped: ${emailResult.reason}`);
    } else {
      console.log(`   → email sent to ${emailResult.to} (messageId: ${emailResult.messageId})`);
    }
    return { emailResult };
  } catch (err) {
    // The GitHub comment has already been posted successfully by this point —
    // an email failure should never mark the whole pipeline as failed.
    console.warn('⚠️  sendEmailNotification failed (non-fatal):', err.message);
    return { emailResult: { sent: false, error: err.message } };
  }
}

module.exports = { sendEmailNotification };
