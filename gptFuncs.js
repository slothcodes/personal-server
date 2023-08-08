const OpenAIApi = require('openai');

const openai = new OpenAIApi({
  api_key: 'YOUR-API-KEY-HERE'
});

async function getChatCompletion(prompt, chatContext) {
  const response = await openai.chatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      ...chatContext,
      { role: 'user', content: prompt }
    ]
  });
  return response.data;
}

module.exports = getChatCompletion;
