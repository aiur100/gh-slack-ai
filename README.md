# GitHub to Slack Intelligent Webhook Relay

An AWS Lambda function that intelligently relays GitHub webhook events to Slack with AI-enhanced summaries.

## Overview

This system serves as a smart bridge between GitHub and Slack, providing the following functionality:

1. Receives GitHub webhook events via AWS Lambda Function URL
2. Filters events to only process the most important ones
3. Uses OpenAI's language models to interpret events and generate human-friendly summaries
4. Formats messages with proper Slack syntax (including emojis, formatting, and links)
5. Delivers messages to a specified Slack channel via webhook

## Features

- **Smart Event Filtering**: Only processes relevant events (PR opens, comments, workflow successes/failures)
- **AI-Enhanced Summaries**: Converts technical GitHub event data into readable team updates
- **Slack-Optimized Formatting**: Uses Slack's formatting conventions for clear, visual messages
- **Async Processing**: Uses AWS Lambda streaming responses to prevent webhook timeouts
- **Serverless Architecture**: Easy to deploy and manage with minimal infrastructure

## Setup

### Prerequisites

- AWS Account with Lambda access
- GitHub repository with webhook configuration access
- Slack workspace with webhook creation permissions
- OpenAI API key

### Environment Variables

The function requires two environment variables:
- `SLACK_WEB_HOOK_URL`: Your Slack incoming webhook URL
- `OPENAI_API_KEY`: Your OpenAI API key

See `.env.example` for a template.

### AWS Lambda Setup

1. Create a new Lambda function
2. Use Node.js 18.x or later runtime
3. Set the handler to `main.handler`
4. Enable "Function URL" with auth type "NONE" (or configure appropriate auth)
5. Set environment variables
6. Increase timeout to at least 30 seconds (OpenAI API calls can take time)
7. Deploy the function code

### GitHub Webhook Setup

1. Go to your GitHub repository → Settings → Webhooks → Add webhook
2. Set Payload URL to your Lambda Function URL
3. Set Content type to `application/json`
4. Select events to send (recommended: Pull requests, Pull request reviews, Issues, Issue comments, Workflows)
5. Enable the webhook

## Configuration Options

The function can be customized by modifying:

- `shouldProcessEvent()`: Controls which GitHub events trigger notifications
- `generatePrompt()`: Customizes the instructions sent to the OpenAI model
- Model settings (temperature, max_tokens) in the `getAISummary()` function

## How It Works

1. GitHub sends a webhook event to the Lambda Function URL
2. Lambda immediately responds to GitHub using streaming response
3. Lambda then processes the event asynchronously:
   - Filters out irrelevant events
   - Formats a prompt with event data for OpenAI
   - Sends the prompt to OpenAI for summarization
   - Delivers the formatted message to Slack

## Event Filtering

Currently, the function only processes the following events:
- Workflow runs that succeed or fail
- Pull requests when newly opened
- Comments on pull requests
- Review comments on pull requests

## Troubleshooting

Common issues:

- **No messages in Slack**: Check Lambda logs for errors and verify SLACK_WEB_HOOK_URL
- **Invalid formats**: Adjust the prompt instructions in `generatePrompt()`
- **Webhook timeouts**: Verify the streaming response is working correctly
- **OpenAI errors**: Check API key and quota limits

## License

[MIT License](LICENSE)