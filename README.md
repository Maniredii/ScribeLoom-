# ScribeLoom 🚀

**ScribeLoom** is a zero-budget, AI-ready browser extension that automatically records meaningful user interactions (clicks, navigations, forms), captures screenshots, organizes them into step-by-step tutorials or bug reports, and exports professional documentation.

It works entirely locally, prioritizing your privacy without relying on paid APIs.

## 🎯 The Problem it Solves
Creating tutorials, Standard Operating Procedures (SOPs), bug reports, and technical documentation is tedious. Users manually have to take screenshots, organize them into documents, and write descriptive text. **ScribeLoom automates this entire workflow.**

## ✨ Features
* **Auto-Capture Interactions**: Automatically detects and logs clicks, form submissions, and page navigations.
* **Visual Highlight**: Visually highlights the exact element clicked with a red bounding box directly in the screenshot.
* **Screenshot Engine**: Captures high-quality screenshots of the visible tab precisely when actions occur.
* **Local Processing**: Completely private, storing data locally on your machine.
* **JSON Export**: Export your recorded flows for easy formatting, with upcoming PDF/Markdown support.
* **Zero-Budget Tool**: Built using native browser APIs, requiring no paid services.

## 🛠️ Installation & Setup
Since ScribeLoom is currently in development (MVP), you can install it manually:

1. Clone or download this repository.
2. Open your Chromium-based browser (Google Chrome, Edge, Brave).
3. Navigate to `chrome://extensions/`.
4. Enable **Developer Mode** (usually a toggle in the top right corner).
5. Click **Load unpacked** and select the folder containing the ScribeLoom files.
6. Pin the extension to your toolbar and you're ready to weave some docs!

## 🚀 How to Use
1. Click the ScribeLoom icon in your browser toolbar.
2. Click **Start Recording**.
3. Perform your workflow (clicking buttons, filling forms, navigating to new pages). ScribeLoom will automatically highlight your clicks and snap screenshots!
4. Open the extension popup to view your recorded steps.
5. Click **Stop Recording** when finished.
6. Click **Export JSON** to save your workflow data.

## 🗺️ Roadmap
### Phase 1 — MVP (Current)
- [x] Start/Stop recording functionality
- [x] Detect clicks and draw highlights
- [x] Detect page navigations
- [x] Detect form submissions
- [x] Capture precise screenshots
- [x] Organize and list steps
- [x] Export to JSON
- [x] Manual step editing in popup
- [x] Workflow preview mode
- [x] Export to PDF/Markdown

### Phase 2 — AI Features (Upcoming)
- [ ] Auto-generated step descriptions using local AI
- [ ] Step summarization
- [ ] Action naming and intelligent grouping
- [ ] Automatic tutorial title generation

## 👨‍💻 Tech Stack
- HTML, CSS, JavaScript (Vanilla)
- Manifest V3 Browser Extension APIs (`chrome.tabs`, `chrome.storage`, `chrome.webNavigation`)

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
