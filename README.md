# SiteGuard AI — Crowd Risk Prediction System

> **"Crowd accidents don't start with panic. They start with congestion."**

SiteGuard AI is a predictive safety engine powered by Gemini Multimodal AI. It analyzes spatial structures and crowd dynamics to identify risk signals *before* they manifest into dangerous situations.

---

## 🛡️ Core Philosophy: Risk Prevention, Not Just Detection
Most safety systems are reactive—they detect a disaster after it has already occurred. SiteGuard AI shifts the paradigm to **Prevention Intelligence**.

By interpreting physical environments as a **"Safety Canvas,"** the system models how a specific number of people will interact with spatial geometry (bottlenecks, corridors, exits) under custom scenarios.

---

## ✨ Key Features

### 1. Spatial Risk Analysis
Uses Gemini's multimodal capabilities to understand floor plans, corridor widths, and exit locations from simple images or video frames.

### 2. Predictive Simulation Modeling
Users can input:
- **Expected People Count**: Precise numeric input (e.g., 50 vs. 500).
- **Activity Context**: Free-form scenario description (e.g., "Sudden rain forced exit," "Peak lunch hour rush").

The AI models the **Physical Capacity** of the space against these inputs, regardless of how empty the space appears in the current photo.

### 3. Dashboard-First Scannability
- **Safety Scores**: Real-time 0-100 scores for Flow, Space, and Evacuation.
- **Visual Hotspots**: Icon-based indicators of specific physical bottleneck points.
- **Zone-Specific Status**: Granular risk levels (Safe, Warning, Danger) for different areas within the frame.

### 4. Smart Video Keyframe Extraction
Analyzes video streams by intelligently extracting key spatial frames, allowing for a comprehensive audit of a moving environment.

---

## 🧠 Why Gemini?
Unlike traditional computer vision that simply counts heads, Gemini understands **Context**:
- **Spatial Reasoning**: "This 2-meter corridor cannot accommodate 300 people exiting at once."
- **Behavioral Inference**: "Rain will cause people to move faster toward this specific bottleneck."
- **Natural Language Insights**: Generates actionable safety advice rather than just cold data.

---

## 🚀 Technical Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Vanilla CSS (Glassmorphism UI).
- **AI Brain**: Gemini 2.0 Flash (Multimodal Analysis & Reasoning).
- **Video Processing**: Client-side smart keyframe extraction.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+
- Google AI (Gemini) API Key

### 2. Installation
```bash
git clone <repository-url>
cd google-hackerton
npm install
```

### 3. Environment Setup
Create a `.env.local` file:
```env
GOOGLE_AI_API_KEY=your_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📈 Demo Scenarios
1. **Lunch Station Setup**: "Modeling 70 people queuing in a 10m² service area."
2. **Main Entrance Exit**: "Simulating 400 people leaving simultaneously after a keynote."
3. **Emergency Corridor**: "Auditing evacuation flow for 200 people with luggage."

---
*Built for the Google AI Hackathon — Empowering Safety with Predictive Intelligence.*
