# Intelligent Lambda Webhook Relay

This AWS Lambda function serves as an intelligent webhook relay between GitHub and Slack. It performs the following steps:

1. Receives GitHub webhook events via AWS Lambda Function URL.
2. Processes the incoming GitHub event JSON payload.
3. Utilizes OpenAI's language model to interpret the event and generate a human-friendly summary.
4. Constructs a Slack message with the AI-generated summary.
5. Sends the formatted message to a specified Slack webhook URL.

Key features:
- Simplifies complex GitHub events for end-users.
- Leverages AI for intelligent event interpretation and summarization.
- Seamlessly integrates GitHub, AWS Lambda, OpenAI, and Slack.

This setup enhances team communication by providing clear, concise, and relevant updates from GitHub directly to Slack.

## Architecture
- AWS Lambda with Function URL turned on. 
- Github repo has this Function URL set to webhooks to send events to. 
- slack webhook URL that will be sent to. 
- open ai LLM that will write a proper Slack POST.

## Environment variables
- `SLACK_WEB_HOOK_URL`
- `OPENAI_API_KEY`


