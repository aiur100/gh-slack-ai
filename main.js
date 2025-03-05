export const handler = async (event) => {
  try {
    // Parse the GitHub webhook payload
    const payload = JSON.parse(event.body);
    const eventType = event.headers['x-github-event'];
    
    // Generate prompt for OpenAI based on the GitHub event
    const prompt = generatePrompt(eventType, payload);
    
    // Get AI-generated summary using OpenAI
    const summary = await getAISummary(prompt);
    
    // Construct and send Slack message
    await sendSlackMessage(summary);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully processed GitHub event' }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing webhook', error: error.message }),
    };
  }
};

/**
 * Generates a prompt for OpenAI based on the GitHub event payload
 */
function generatePrompt(eventType, payload) {
  // Simply pass the raw GitHub event JSON to the LLM
  const prompt = `You are analyzing a GitHub webhook event. 
  
Event Type: ${eventType}

Here is the raw JSON payload of the event:
${JSON.stringify(payload, null, 2)}

Please write a concise, human-friendly Slack message that summarizes the most important and relevant details from this GitHub event. The message should be professional but conversational in tone. Focus only on what's actually important for team members to know.`;

  return prompt;
}

/**
 * Gets AI-generated summary using OpenAI REST API
 */
async function getAISummary(prompt) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise, informative Slack messages about GitHub events."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw new Error('Failed to generate summary with OpenAI');
  }
}

/**
 * Sends message to Slack webhook using fetch
 */
async function sendSlackMessage(message) {
  try {
    const slackWebhookUrl = process.env.SLACK_WEB_HOOK_URL;
    
    if (!slackWebhookUrl) {
      throw new Error('SLACK_WEB_HOOK_URL environment variable is not set');
    }
    
    const slackPayload = {
      text: message,
    };
    
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw new Error('Failed to send message to Slack');
  }
}