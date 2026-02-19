# Sterling: Visionary Guard

A warm, voice-first assistant for visually impaired users that acts as a digital eye for documents and a shield against financial scams.

<div align="center">
<img width="1200" height="475" alt="Sterling Visionary Guard Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## The Problem

Visually impaired individuals face real challenges managing financial documents — reading bills, spotting scam letters, and tracking payment deadlines. Sterling provides an accessible, voice-driven interface to handle all of this.

## Features

- **Document Scanning** — Point your camera at any bill, statement, or letter and Sterling reads it aloud with clear, natural language
- **Scam Detection** — AI-powered analysis flags suspicious documents with risk levels and specific indicators
- **Bill Tracking** — Automatically extracts amounts, due dates, and providers from scanned documents
- **Payment Reminders** — Never miss a due date with spoken reminders
- **Historical Comparison** — Detects unusual amounts by comparing against previous bills from the same provider
- **Emergency Contacts** — Quick access to a trusted contact if a scam is detected
- **Haptic Feedback** — Vibration patterns for key interactions on mobile devices
- **Fully Accessible** — Large touch targets, high contrast, voice-first design throughout

## Tech Stack

- **React 19** + **TypeScript** — Component-based UI with full type safety
- **Google Gemini API** — Powers document analysis, scam detection, and natural language responses
- **Vite** — Fast development and optimised production builds
- **Web Speech API** — Text-to-speech for voice output
- **MediaDevices API** — Camera access for document scanning

## Project Structure

```
Sterling-Visionary-Guard/
├── App.tsx                  # Main application component
├── index.tsx                # Entry point
├── types.ts                 # TypeScript interfaces
├── components/
│   ├── CameraModule.tsx     # Camera capture and document scanning
│   ├── EmergencyContactSetup.tsx
│   ├── ErrorBoundary.tsx    # Graceful error handling
│   ├── ShowcaseOverlay.tsx  # Feature showcase/onboarding
│   ├── ThinkingIndicator.tsx
│   └── VoiceFeedback.tsx    # Audio feedback component
├── hooks/
│   ├── useDocumentHistory.ts  # Document storage and retrieval
│   ├── useLocalStorage.ts     # Persistent settings
│   ├── useReminders.ts        # Payment reminder logic
│   └── useStatistics.ts       # Usage tracking
├── services/
│   └── geminiService.ts     # Gemini API integration and prompts
└── utils/
    ├── audioContext.ts       # Audio playback utilities
    ├── haptics.ts            # Vibration feedback
    └── imageQuality.ts       # Image preprocessing
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/billkhiz-bit/Sterling-Visionary-Guard.git
cd Sterling-Visionary-Guard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server
npm run dev
```

## Document Categories Supported

| Category | Examples |
|----------|----------|
| Utilities | Gas, electric, water bills |
| Council Tax | Council tax statements and reminders |
| Insurance | Home, car, health insurance documents |
| Bank | Bank statements, account notices |
| Pension | Pension statements and forecasts |
| Benefits | DWP letters, benefit statements |
| Subscriptions | Recurring service charges |

## Scam Detection

Sterling analyses documents for common scam indicators including:
- Urgency pressure ("act now", "immediate action required")
- Unusual payment methods (gift cards, cryptocurrency)
- Mismatched sender details
- Suspicious amounts or account numbers
- Known scam patterns

Each document receives a risk rating: **None**, **Low**, **Medium**, or **High** with specific reasoning.

## License

MIT License — see [LICENSE](LICENSE)

## Author

Bill Khizar — [NK & Co Accountancy](https://nkandco.co.uk)
