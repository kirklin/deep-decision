# Deep Decision

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

A sophisticated AI-powered decision analysis tool that helps users make complex decisions by generating and analyzing multi-level decision trees.

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- PNPM package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/kirklin/deep-decision.git
cd deep-decision

# Install dependencies
pnpm install

# Create .env.local file from the example
cp .env.example .env.local
```

### Configuration

Edit the `.env.local` file to configure your AI provider:

```
# Provider type: OPENAI, OLLAMA, or AI_SDK
PROVIDER_TYPE=OPENAI

# OpenAI settings (if using OPENAI provider)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=o3-mini

# Ollama settings (if using OLLAMA provider)
OLLAMA_HOST=http://localhost:11434/api
OLLAMA_MODEL=qwq

# Decision parameters
DECISION_DEFAULT_DEPTH=3
DECISION_DEFAULT_BREADTH=4
DECISION_DEFAULT_QUESTIONS=3

# API settings
API_DEFAULT_PORT=3000
```

## Usage

### Command Line Interface

```bash
# Start the CLI
pnpm start
```

Follow the prompts to:
1. Enter your decision problem
2. Set analysis depth and breadth
3. Answer follow-up questions to provide more context
4. Wait for the decision analysis to complete

The analysis will generate:
- A decision tree (saved as JSON)
- A comprehensive decision report (saved as Markdown)

### REST API

```bash
# Start the API server
pnpm api
```

#### API Endpoints

- `POST /api/feedback-questions`: Generate follow-up questions for a decision problem
- `POST /api/analyze-decision`: Analyze a decision with customizable parameters
- `GET /api/decision-report`: Get the saved decision report
- `GET /api/decision-tree`: Get the saved decision tree
- `GET /api/model-info`: Get information about the configured AI model

## Examples

### Example Decision Problem

"Should our company move to a new office location downtown, stay at our current suburban location, or transition to a fully remote work model?"

### Example Output

The system will generate a decision tree, key insights, and a report that helps evaluate different options, their consequences, and recommendations.

## Author

[Kirk Lin](https://github.com/kirklin)
