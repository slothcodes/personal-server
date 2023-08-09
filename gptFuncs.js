// Description: Functions for interacting with OpenAI's GPT-3.5 API
async function getChatCompletion(prompt,openAiInstance) {

  const response = await openAiInstance.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {role: "system", content: "Assume the role of a professional copywriter. Follow the provided instructions and outline to crate a high-quality and engaging article."},
      { role: 'user', content: prompt }
    ]
  });
  const textResponse = response.data.choices[0].message.content;
  return {text: textResponse}
}

module.exports = getChatCompletion;
