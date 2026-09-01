# AI Module

This directory contains the AI engine structure for future Gemini API integration.

## Planned Structure

```
ai/
├── prompts/        # AI prompt templates (will be created in Phase 6)
├── parsers/        # Response parsers for AI output (will be created in Phase 6)
└── gemini-client.js # Gemini SDK wrapper (will be created in Phase 6)
```

## Current Status

**Phase 1**: Only the directory structure is set up. No AI integration yet.

## What Will Be Added Later

- **Phase 6**: Gemini API integration for:
  - Risk analysis of projects
  - Q&A chat assistant
  - Project report generation

## Important

- Do not add the Gemini SDK until Phase 6
- Do not hardcode any API keys
- All API calls must go through the backend (never directly from frontend)
