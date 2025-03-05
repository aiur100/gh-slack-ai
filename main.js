import * as awslambda from 'aws-lambda';

/**
 * Lambda handler using streaming response to respond immediately while continuing processing
 */
export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  try {
    console.log("GitHub webhook received");
    
    // Start by sending an immediate response
    responseStream.setContentType('application/json');
    responseStream.write(JSON.stringify({ message: "Webhook received, processing started" }));
    responseStream.end();
    
    // Now continue processing after the response is sent
    const payload = JSON.parse(event.body);
    const eventType = event.headers['x-github-event'];
    
    // Filter events based on criteria
    if (!shouldProcessEvent(eventType, payload)) {
      console.log(`Ignoring event ${eventType} that doesn't meet notification criteria`);
      return; // No need to return a value since we've already responded
    }
    
    // Continue with the time-consuming operations
    console.log(`Processing ${eventType} event asynchronously`);
    
    // Generate prompt for OpenAI based on the GitHub event
    const prompt = generatePrompt(eventType, payload);
    
    // Get AI-generated summary using OpenAI
    const summary = await getAISummary(prompt);
    
    // Construct and send Slack message
    await sendSlackMessage(summary);
    
    console.log('Asynchronous processing completed successfully');
  } catch (error) {
    console.error('Error in webhook processing:', error);
    // We've already responded to the client, so we just log the error
  }
});

/**
 * Determines if an event should be processed based on type and content
 */
function shouldProcessEvent(eventType, payload) {
  switch (eventType) {
    case 'workflow_run':
      // Only process workflow runs that have succeeded or failed
      return ['completed'].includes(payload.action) && 
             ['success', 'failure'].includes(payload.workflow_run.conclusion);
    
    case 'pull_request':
      // Only process when PRs are opened
      return ['opened'].includes(payload.action);
      
    case 'issue_comment':
      // Process comments on PRs (GitHub treats PR comments as issue comments)
      return ['created'].includes(payload.action) && payload.issue.pull_request;
      
    case 'pull_request_review_comment':
      // Process PR review comments
      return ['created'].includes(payload.action);
      
    default:
      // Ignore all other event types
      return false;
  }
}

/**
 * Generates a prompt for OpenAI based on the GitHub event payload
 */
function generatePrompt(eventType, payload) {
  // Pass the raw GitHub event JSON to the LLM with Slack formatting instructions
  const prompt = `You are analyzing a GitHub webhook event and creating a well-formatted Slack message.
  
Event Type: ${eventType}

Here is the raw JSON payload of the event:
${JSON.stringify(payload, null, 2)}

Please write a concise, human-friendly Slack message that summarizes the most important and relevant details from this GitHub event. The message should be professional but conversational in tone.

IMPORTANT - Use Slack's formatting conventions:
1. Use *bold text* for titles and important information
2. Use emojis to make the message visually appealing and to indicate the type of event:
   - 🚀 for deployments and successful workflow runs
   - ❌ for failures
   - 🔄 for updates and ongoing processes
   - 📝 for PRs and comments
   - 🛠️ for workflow runs
   - ✅ for successful operations
3. Use > for quotes or important snippets
4. Use bullet lists with • or - for multiple items
5. Include clickable links when relevant using the format <URL|link text>
6. Format code snippets or technical terms with backticks \`like this\`

Structure the message with:
- A clear, emoji-prefixed title that indicates the event type
- A brief summary of what happened
- Only the most relevant details, neatly formatted
- Links to the relevant GitHub resources if available in the payload

Be concise but informative. Your message should be immediately helpful to team members.`;

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
        model: "gpt-4o",
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
        max_tokens: 2000,
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