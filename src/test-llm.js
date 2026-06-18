require('dotenv').config();
const { getLLMReview } = require('./llm/reviewEngine');

async function test() {
  const review = await getLLMReview(
    'Review this code issue: eval(user_input) was used in a login function, which can lead to code injection.'
  );
  console.log('LLM Review:\n', review);
}

test();