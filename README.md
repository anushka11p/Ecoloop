# EcoLoop — AI Behavioral Carbon Platform

> **The anti-calculator carbon platform.** EcoLoop focuses on behavioral changes, not retrospective metric-tracking.

EcoLoop is designed to challenge standard carbon footprint calculators that fail to drive real habit changes. By combining **Affective Forecasting**, the **BJ Fogg Behavioral Design Framework**, **Multi-Agent Generative AI debates**, and a dynamic, **procedurally grown organic SVG Living Tree**, EcoLoop makes carbon consciousness highly engaging, interactive, and actionable.

---

## 🌟 Key Features

### 1. The Living Tree (Dynamic SVG Canvas)
* Instead of standard dashboard bar charts, the user's progress is visualized through a living, organic tree canvas.
* **Canopy Leaves:** Grow dynamically as the user increases their experience points (**XP**).
* **Vibrant Twig Fruits:** Bloom and grow on the branches in response to weekly habit **streaks**.
* **Gold Blossoms:** Sprout dynamically when the user completes **perfect weeks** of micro-nudges.
* **Interactive buds:** Users can toggle weekly action items directly by clicking interactive flower buds on the tree.

### 2. BJ Fogg Behavior Model Drawer ($B = MAP$)
* Every weekly micro-nudge includes a behavioral science analytics drawer.
* Explores the BJ Fogg formula ($B = MAP$) using custom progress bars displaying calculated scores for:
  - **Motivation (M):** Reflects alignment with user values.
  - **Ability (A):** Friction level reduction.
  - **Prompt (P):** Triggers integrated with the Living Tree.
* Highlights the behavioral technique applied (e.g., Identity Priming, Implementation Intention, Loss Framing).

### 3. Agentic Multi-Agent Timeline Projections
* Located in the **Prompt Lab**, this triggers a collaborative generative AI debate between three specialized personas debating the user's carbon footprint and city:
  1. 🟢 **Eco-Optimist:** Focuses on citizen-led green solutions, community grids, and hopeful actions.
  2. 🔴 **Climate Realist:** Focuses on geographic temperature increases, storm surges, grid stress, and raw infrastructure challenges.
  3. 🟡 **Municipal Policy Planner:** Balances municipal budgets, utility ROI, green bonds, and zoning policies.
* Chat messages stream in with a custom sequential typewriter typewriter effect.

### 4. 2035 Time Machine Storyteller
* Implements **Affective Forecasting** to contrast two futures in July 2035 side-by-side:
  - **The Unchanged Path:** A sensory, localized description of municipal decay if current footprint habits persist.
  - **The EcoLoop Path:** A clean, resilient projection shaped by the user's micro-nudge habit shifts.

### 5. Judge Time-Travel Sandbox (Hackathon Demo Tool)
* Built directly into the bottom of the dashboard to enable seamless pitches and judging reviews:
  - **⚡ Add +150 XP:** Instantly grows canopy leaves.
  - **🔥 Add +1 Streak:** Instantly sprouts berries on the twigs.
  - **🌸 Complete Week:** Triggers roll-overs, levels up, sprouts golden blossoms, and opens the reflection journal.
  - **🔄 Reset Stats:** Restores variables back to default for fresh demonstrations.

---

## 🛠️ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3 Editorial Design System (using Google Fonts *Inter* & *Lora* and vector *Material Symbols*), ES6 Modules, and dynamic inline SVG canvases.
* **Serverless Backend (Vercel Proxy):** Secure serverless routes located in `/generation/` to proxy calls to Groq API using `llama-3.3-70b-versatile`.
* **Build System:** Vite.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/anushka11p/Ecoloop.git
cd Ecoloop
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 5. Build for production
```bash
npm run build
```
The optimized bundle will be generated under the `dist/` directory.

---

## 📝 License
EcoLoop Behavioral Framework © 2026. Inspired by the BJ Fogg Behavior Design and Affective Forecasting models.
