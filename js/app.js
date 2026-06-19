/**
 * Main application coordinator for EcoLoop.
 * Orchestrates SPA routing, state updates, event bindings, and Web Audio plucks.
 */

import { storage } from "./storage.js";
import { promptLayers } from "./prompts.js";
import { simulation } from "./simulation.js";
import { tree } from "./tree.js";

// Audio plucks for positive reinforcement
function playChime(success = true) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Tone 1: Root
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(success ? 440 : 220, ctx.currentTime); // A4 or A3
    if (success) {
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
    }
    gain1.gain.setValueAtTime(success ? 0.15 : 0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Tone 2: Overpluck
    if (success) {
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 80);
    }
  } catch (e) {
    console.warn("Web Audio chime failed", e);
  }
}

// Onboarding Quiz Configuration
const QUIZ_QUESTIONS = [
  {
    key: "commute",
    title: "1. The Commute",
    question: "How do you get around daily?",
    placeholder: "e.g., I drive an SUV to work 30 mins each way, or I walk and use the subway...",
    tip: "Be descriptive! Our AI reads transit modes and relative distances.",
    options: [
      { label: "🚗 Drive Car", text: "I drive a personal car to get around daily." },
      { label: "🚲 Bike / Cycle", text: "I cycle or ride a bike for my daily transit." },
      { label: "🚌 Public Transit", text: "I use public transit like trains and buses for commuting." },
      { label: "🚶 Walk on Foot", text: "I walk on foot to get where I need to go." },
      { label: "✍️ Write my own...", text: "" }
    ]
  },
  {
    key: "diet",
    title: "2. The Diet",
    question: "What does your typical weekly diet look like?",
    placeholder: "e.g., I eat beef or poultry most days, or I'm mostly vegetarian with dairy...",
    tip: "Dietary agriculture accounts for nearly 20% of global emissions.",
    options: [
      { label: "🥩 Meat Eater", text: "I eat meat like chicken or beef in most of my meals." },
      { label: "🥗 Vegetarian", text: "I follow a vegetarian diet, eating no meat but some dairy." },
      { label: "🌱 Vegan", text: "I eat a strict plant-based vegan diet with no animal products." },
      { label: "🐟 Pescatarian", text: "I eat fish and seafood but avoid red meat and poultry." },
      { label: "✍️ Write my own...", text: "" }
    ]
  },
  {
    key: "flights",
    title: "3. The Travel",
    question: "How many flights do you take in an average year?",
    placeholder: "e.g., None, or about 2-3 holiday flights, or monthly business travel...",
    tip: "A single long-haul flight can match a whole year's transit carbon.",
    options: [
      { label: "✈️ Few Flights (1-3)", text: "I fly a few times a year, mostly for holidays (1 to 3 flights)." },
      { label: "💼 Frequent Business (6+)", text: "I travel frequently by air for business, taking 6 or more flights annually." },
      { label: "🚂 Rarely Fly (0-1)", text: "I rarely fly, taking zero or at most one flight a year." },
      { label: "✍️ Write my own...", text: "" }
    ]
  },
  {
    key: "energy",
    title: "4. The Household",
    question: "Tell us about your home energy setup.",
    placeholder: "e.g., We use standard grid power with gas heating, or we have rooftop solar and heat pumps...",
    tip: "Residential efficiency depends on insulation, thermal settings, and sources.",
    options: [
      { label: "🔥 Grid Power & Gas", text: "My home uses standard grid electricity and natural gas heating." },
      { label: "☀️ Solar & Heat Pump", text: "We use renewable solar panels and an electric heat pump." },
      { label: "🏢 Apartment Heating", text: "I live in a shared apartment complex with central steam heating." },
      { label: "✍️ Write my own...", text: "" }
    ]
  },
  {
    key: "city",
    title: "5. The Anchor",
    question: "Which city do you live in?",
    placeholder: "e.g., London, San Francisco, Sydney, New York...",
    tip: "This links your Time Machine stories to actual municipal climate projections.",
    options: [
      { label: "🗽 New York", text: "New York" },
      { label: "🌁 San Francisco", text: "San Francisco" },
      { label: "🇬🇧 London", text: "London" },
      { label: "🗼 Tokyo", text: "Tokyo" },
      { label: "🐨 Sydney", text: "Sydney" },
      { label: "✍️ Write my own...", text: "" }
    ]
  }
];

class EcoLoopApp {
  constructor() {
    this.state = storage.loadState();
    this.onboardingStep = 0; // 0 to 4
    this.activeTab = "dashboard"; // dashboard, prompts, journal
    this.serverHasKey = false;
    this.localDevKeyActive = false;
    
    try {
      if (import.meta.env.VITE_GROQ_API_KEY) {
        this.localDevKeyActive = true;
      }
    } catch (e) {
      // outside Vite context
    }
    
    this.initDOMElements();
    this.bindEvents();
    this.checkServerApiKey();
    this.render();
  }

  initDOMElements() {
    // Top-level sections
    this.onboardingSection = document.getElementById("onboarding-section");
    this.mainSection = document.getElementById("main-section");

    // Onboarding nodes
    this.quizCard = document.getElementById("quiz-card");
    this.quizTitle = document.getElementById("quiz-title");
    this.quizQuestion = document.getElementById("quiz-question");
    this.quizOptionsContainer = document.getElementById("quiz-options-container");
    this.quizInput = document.getElementById("quiz-input");
    this.quizTip = document.getElementById("quiz-tip");
    this.onboardingProgress = document.getElementById("onboarding-progress");
    this.btnBack = document.getElementById("btn-back");
    this.btnNext = document.getElementById("btn-next");
    this.onboardingLoader = document.getElementById("onboarding-loader");
    this.loaderStatusText = document.getElementById("loader-status-text");

    // Dashboard nodes
    this.tabDashboard = document.getElementById("tab-dashboard");
    this.tabPrompts = document.getElementById("tab-prompts");
    this.tabJournal = document.getElementById("tab-journal");

    this.navDashboard = document.getElementById("nav-dashboard");
    this.navPrompts = document.getElementById("nav-prompts");
    this.navJournal = document.getElementById("nav-journal");

    // State / Gamification stats
    this.statXp = document.getElementById("stat-xp");
    this.statLevel = document.getElementById("stat-level");
    this.statStreak = document.getElementById("stat-streak");
    this.statWeek = document.getElementById("stat-week");
    
    // Carbon profile nodes
    this.profilePersona = document.getElementById("profile-persona");
    this.profileCo2 = document.getElementById("profile-co2");
    this.profileSummary = document.getElementById("profile-summary");

    this.pillTransit = document.getElementById("pill-transit");
    this.pillDiet = document.getElementById("pill-diet");
    this.pillFlights = document.getElementById("pill-flights");
    this.pillEnergy = document.getElementById("pill-energy");

    // Time Machine story cards
    this.storyUnchanged = document.getElementById("story-unchanged");
    this.storyEcoloop = document.getElementById("story-ecoloop");
    this.tmContainer = document.getElementById("time-machine-container");
    this.cardUnchanged = document.querySelector(".card-unchanged");
    this.cardEcoloop = document.querySelector(".card-ecoloop");

    // Interactive tree SVG
    this.treeSvg = document.getElementById("tree-svg");

    // Weekly nudges
    this.nudgesContainer = document.getElementById("nudges-container");
    this.btnEndWeek = document.getElementById("btn-end-week");

    // Prompts lab nodes
    this.promptSelect = document.getElementById("prompt-select");
    this.promptTitle = document.getElementById("prompt-title");
    this.promptModel = document.getElementById("prompt-model");
    this.promptDesc = document.getElementById("prompt-desc");
    this.promptSystemText = document.getElementById("prompt-system-text");
    this.btnSavePrompt = document.getElementById("btn-save-prompt");
    this.btnRestorePrompts = document.getElementById("btn-restore-prompts");
    
    // API key nodes
    this.apiKeyInput = document.getElementById("api-key-input");
    this.btnSaveKey = document.getElementById("btn-save-key");
    this.apiKeyStatus = document.getElementById("api-key-status");

    // Reflections history node
    this.journalHistoryContainer = document.getElementById("journal-history-container");

    // Global reset
    this.btnResetGlobal = document.getElementById("btn-reset-global");

    // Reflection modal / overlay
    this.reflectionModal = document.getElementById("reflection-modal");
    this.reflectionModalText = document.getElementById("reflection-modal-text");
    this.btnModalClose = document.getElementById("btn-modal-close");
    this.reflectionLoading = document.getElementById("reflection-loading");
    this.reflectionLoaded = document.getElementById("reflection-loaded");
  }

  bindEvents() {
    // Tab switching
    this.navDashboard.addEventListener("click", () => this.switchTab("dashboard"));
    this.navPrompts.addEventListener("click", () => this.switchTab("prompts"));
    this.navJournal.addEventListener("click", () => this.switchTab("journal"));

    // Onboarding controls
    this.btnNext.addEventListener("click", () => this.handleOnboardingNext());
    this.btnBack.addEventListener("click", () => this.handleOnboardingBack());
    
    // Support Enter key in input
    this.quizInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleOnboardingNext();
      }
    });

    // Weekly actions end
    this.btnEndWeek.addEventListener("click", () => this.handleEndWeek());

    // Prompt Editor selector & saves
    this.promptSelect.addEventListener("change", (e) => this.loadSelectedPrompt(e.target.value));
    this.btnSavePrompt.addEventListener("click", () => this.savePromptEdit());
    this.btnRestorePrompts.addEventListener("click", () => this.restoreDefaultPrompts());

    // API key save click
    if (this.btnSaveKey) {
      this.btnSaveKey.addEventListener("click", () => this.saveApiKey());
    }

    // Reflection Modal Close
    this.btnModalClose.addEventListener("click", () => {
      this.reflectionModal.classList.add("hidden");
    });

    // Global Reset
    this.btnResetGlobal.addEventListener("click", () => {
      if (confirm("Are you sure you want to reset EcoLoop? This clears all streaks, levels, history, and custom prompt configurations.")) {
        this.state = storage.clearState();
        this.onboardingStep = 0;
        this.switchTab("dashboard");
        this.render();
      }
    });

    // SVG bloom clicks
    this.treeSvg.addEventListener("click", (e) => {
      const bloomGroup = e.target.closest(".action-bloom");
      if (bloomGroup) {
        const index = parseInt(bloomGroup.getAttribute("data-nudge-index"));
        this.toggleNudgeCompletion(index);
      }
    });

    // Time Machine card previews for tree health
    if (this.cardUnchanged) {
      this.cardUnchanged.addEventListener("mouseenter", () => {
        tree.render(this.treeSvg, this.state, "withered");
      });
      this.cardUnchanged.addEventListener("mouseleave", () => {
        tree.render(this.treeSvg, this.state, null);
      });
    }
    if (this.cardEcoloop) {
      this.cardEcoloop.addEventListener("mouseenter", () => {
        tree.render(this.treeSvg, this.state, "flourishing");
      });
      this.cardEcoloop.addEventListener("mouseleave", () => {
        tree.render(this.treeSvg, this.state, null);
      });
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Nav class updates
    this.navDashboard.classList.toggle("active", tabId === "dashboard");
    this.navPrompts.classList.toggle("active", tabId === "prompts");
    this.navJournal.classList.toggle("active", tabId === "journal");

    // Display block/none update
    this.tabDashboard.classList.toggle("hidden", tabId !== "dashboard");
    this.tabPrompts.classList.toggle("hidden", tabId !== "prompts");
    this.tabJournal.classList.toggle("hidden", tabId !== "journal");

    // Trigger SVG resize on tab transition to ensure lines match width
    if (tabId === "dashboard") {
      setTimeout(() => {
        tree.render(this.treeSvg, this.state);
      }, 50);
    }
  }

  // ONBOARDING HANDLERS
  renderOnboardingQuestion() {
    const q = QUIZ_QUESTIONS[this.onboardingStep];
    this.quizTitle.textContent = q.title;
    this.quizQuestion.textContent = q.question;
    
    // Retrieve previous answers if they exist (back button behavior)
    const prevAnswer = this.state.answers[q.key] || "";
    this.quizInput.value = prevAnswer;
    this.quizInput.placeholder = q.placeholder;
    this.quizTip.textContent = q.tip;

    // Render quick-select options
    this.quizOptionsContainer.innerHTML = "";
    if (q.options) {
      q.options.forEach(opt => {
        const pill = document.createElement("button");
        pill.className = "quiz-option-pill";
        pill.textContent = opt.label;
        
        // Active highlight if current input exactly matches the predefined text
        if (prevAnswer === opt.text && opt.text !== "") {
          pill.classList.add("active");
        }
        
        pill.addEventListener("click", () => {
          // Remove active classes
          this.quizOptionsContainer.querySelectorAll(".quiz-option-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          
          if (opt.label.includes("Write my own")) {
            this.quizInput.value = "";
            this.quizInput.focus();
          } else {
            this.quizInput.value = opt.text;
            this.quizInput.focus();
          }
        });
        this.quizOptionsContainer.appendChild(pill);
      });
    }

    // Progress bar width
    const pct = ((this.onboardingStep + 1) / QUIZ_QUESTIONS.length) * 100;
    this.onboardingProgress.style.width = `${pct}%`;

    // Show/hide Back button
    if (this.onboardingStep > 0) {
      this.btnBack.classList.remove("invisible");
    } else {
      this.btnBack.classList.add("invisible");
    }

    // Set focus
    this.quizInput.focus();
  }

  handleOnboardingBack() {
    if (this.onboardingStep > 0) {
      // Save current input before moving back
      const currentKey = QUIZ_QUESTIONS[this.onboardingStep].key;
      this.state.answers[currentKey] = this.quizInput.value.trim();

      this.onboardingStep--;
      this.renderOnboardingQuestion();
    }
  }

  async handleOnboardingNext() {
    const currentKey = QUIZ_QUESTIONS[this.onboardingStep].key;
    const val = this.quizInput.value.trim();

    if (!val) {
      // Input validation nudge
      this.quizCard.classList.add("shake-animation");
      setTimeout(() => this.quizCard.classList.remove("shake-animation"), 400);
      return;
    }

    // Save state
    this.state.answers[currentKey] = val;

    if (this.onboardingStep < QUIZ_QUESTIONS.length - 1) {
      this.onboardingStep++;
      this.renderOnboardingQuestion();
    } else {
      // Reached the end! Run AI parse simulation.
      this.runAICalculations();
    }
  }

  async runAICalculations() {
    // Show AI simulation spinner
    this.quizCard.classList.add("hidden");
    this.onboardingLoader.classList.remove("hidden");
    
    // Simulate multi-phase prompt parser triggers
    const stages = [
      "Layer 1: Parsing unstructured answers...",
      "Layer 2: Evaluating city-specific trajectories...",
      "Layer 2: Drafting 2035 future stories...",
      "Layer 3: Synthesizing customized behavioral nudges...",
      "Integrating identity markers and persona..."
    ];

    for (let i = 0; i < stages.length; i++) {
      this.loaderStatusText.textContent = stages[i];
      await new Promise(r => setTimeout(r, 450));
    }

    try {
      const activePrompts = this.getActivePromptsText();
      const results = await simulation.parseOnboarding(this.state.answers, activePrompts, this.state.apiKey);
      
      this.state.profile = results.profile;
      this.state.unchangedStory = results.unchangedStory;
      this.state.ecoloopStory = results.ecoloopStory;
      
      // Initialize week 1 nudges
      this.state.nudges = simulation.generateWeeklyNudges(results.profile);
      this.state.onboarded = true;

      // Save state
      storage.saveState(this.state);

      // Transition to main view
      this.onboardingSection.classList.add("hidden");
      this.mainSection.classList.remove("hidden");
      this.onboardingLoader.classList.add("hidden");

      // Set up UI
      this.render();
      playChime(true);
    } catch (e) {
      console.error(e);
      alert("Something went wrong compiling your profile. Resetting.");
      this.state = storage.clearState();
      this.render();
    }
  }

  // NUDGE TOGGLES
  toggleNudgeCompletion(index) {
    const nudge = this.state.nudges[index];
    if (!nudge) return;

    nudge.completed = !nudge.completed;

    // Allocate reward
    const xpRewards = { "Easy": 25, "Medium": 45, "Hard": 70 };
    const reward = xpRewards[nudge.effort] || 35;

    if (nudge.completed) {
      this.state.xp += reward;
      this.state.completedNudgesCount++;
      // Level check
      const nextLevelThreshold = this.state.level * 100;
      if (this.state.xp >= nextLevelThreshold) {
        this.state.level++;
        // Play level up splash
        this.triggerStatsAnimation("stat-level");
      }
      this.triggerStatsAnimation("stat-xp");
      playChime(true);
    } else {
      this.state.xp = Math.max(0, this.state.xp - reward);
      this.state.completedNudgesCount = Math.max(0, this.state.completedNudgesCount - 1);
      this.triggerStatsAnimation("stat-xp");
      playChime(false);
    }

    storage.saveState(this.state);
    
    // Update interface (Tree growth changes, Nudge check visual, and Time Machine blend changes)
    this.renderNudges();
    this.updateTimeMachineBlend();
    tree.render(this.treeSvg, this.state);
  }

  triggerStatsAnimation(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.add("stats-highlight");
      setTimeout(() => el.classList.remove("stats-highlight"), 600);
    }
  }

  // WEEK TURNS / GENERATING REFLECTION
  async handleEndWeek() {
    const completed = this.state.nudges.filter(n => n.completed);
    const missed = this.state.nudges.filter(n => !n.completed);

    // Show reflection loader modal
    this.reflectionModal.classList.remove("hidden");
    this.reflectionLoading.classList.remove("hidden");
    this.reflectionLoaded.classList.add("hidden");

    try {
      const activePrompts = this.getActivePromptsText();
      const reflectionText = await simulation.generateReflection(
        completed,
        missed,
        this.state.streak,
        completed.length * 30, // Simulated XP this turn
        activePrompts,
        this.state.apiKey
      );

      // Update streaks
      if (completed.length > 0) {
        this.state.streak += 1;
        this.triggerStatsAnimation("stat-streak");
      } else {
        this.state.streak = 0; // Broke streak
      }

      // Save history log
      this.state.history.push({
        week: this.state.currentWeek,
        completedActionsCount: completed.length,
        totalActionsCount: 3,
        reflectionText: reflectionText,
        xpEarned: completed.reduce((acc, curr) => acc + (curr.effort === "Easy" ? 25 : curr.effort === "Medium" ? 45 : 70), 0),
        timestamp: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })
      });

      // Advance week parameters
      this.state.currentWeek++;
      this.triggerStatsAnimation("stat-week");

      // Generate next week's nudges
      this.state.nudges = simulation.generateWeeklyNudges(this.state.profile);

      // Save state
      storage.saveState(this.state);

      // Populate reflection details in modal
      document.getElementById("modal-title").textContent = `End of Week ${this.state.currentWeek - 1} Reflections`;
      this.reflectionModalText.textContent = reflectionText;

      // Swap loader with content
      this.reflectionLoading.classList.add("hidden");
      this.reflectionLoaded.classList.remove("hidden");

      // Refresh Dashboard components
      this.render();
      playChime(true);
    } catch (e) {
      console.error(e);
      alert("Error compiling reflection.");
      this.reflectionModal.classList.add("hidden");
    }
  }

  // PROMPTS LAB LOGIC
  loadSelectedPrompt(key) {
    const layer = promptLayers[key];
    if (!layer) return;

    this.promptTitle.textContent = layer.title;
    this.promptModel.textContent = `Behavioral Principle: ${layer.behavioralModel}`;
    this.promptDesc.textContent = layer.description;

    // Load custom override if present, otherwise load system prompt default
    const currentVal = this.state.customPrompts[key] || layer.systemPrompt;
    this.promptSystemText.value = currentVal;
  }

  savePromptEdit() {
    const key = this.promptSelect.value;
    const textVal = this.promptSystemText.value.trim();

    if (!textVal) {
      alert("Prompt system text cannot be blank.");
      return;
    }

    this.state.customPrompts[key] = textVal;
    storage.saveState(this.state);

    // Dynamic prompt evaluation visual feedback
    const btn = this.btnSavePrompt;
    btn.textContent = "Saved & Re-compiled!";
    btn.style.backgroundColor = "#8FA89B";
    btn.style.color = "#FDFBF7";

    // Play chime
    playChime(true);

    // Proactively re-compile the stories and active nudges based on new prompts!
    // This allows the user to immediately see the stories/nudges modify when they edit prompt parameters.
    this.recalculateProfilesWithUpdatedPrompts();

    setTimeout(() => {
      btn.textContent = "Save Prompt Changes";
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }, 2000);
  }

  restoreDefaultPrompts() {
    if (confirm("Reset all prompt modifications back to factory behavioral science defaults?")) {
      this.state.customPrompts = {};
      storage.saveState(this.state);
      this.loadSelectedPrompt(this.promptSelect.value);
      this.recalculateProfilesWithUpdatedPrompts();
      playChime(true);
    }
  }

  async recalculateProfilesWithUpdatedPrompts() {
    if (!this.state.onboarded) return;
    
    // Run silent recalculations to apply edited prompts to stories
    const results = await simulation.parseOnboarding(this.state.answers, this.state.customPrompts, this.state.apiKey);
    this.state.unchangedStory = results.unchangedStory;
    this.state.ecoloopStory = results.ecoloopStory;
    storage.saveState(this.state);
    
    // Refresh display
    this.renderStories();
    this.updateTimeMachineBlend();
  }

  saveApiKey() {
    if (!this.apiKeyInput) return;
    const key = this.apiKeyInput.value.trim();
    this.state.apiKey = key;
    storage.saveState(this.state);
    
    this.updateApiKeyStatus();
    
    // Quick visual feedback
    const btn = this.btnSaveKey;
    btn.textContent = "Saved!";
    btn.style.backgroundColor = "#8FA89B";
    btn.style.color = "#FDFBF7";
    playChime(true);
    
    // Refresh calculations if key changed
    this.recalculateProfilesWithUpdatedPrompts();
    
    setTimeout(() => {
      btn.textContent = "Save";
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }, 1500);
  }

  async checkServerApiKey() {
    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const data = await response.json();
        if (data && data.hasKey) {
          this.serverHasKey = true;
          this.updateApiKeyStatus();
        }
      }
    } catch (e) {
      // Local dev or proxy not running
    }
  }

  updateApiKeyStatus() {
    if (!this.apiKeyInput || !this.apiKeyStatus) return;
    const key = this.state.apiKey || "";
    this.apiKeyInput.value = key;
    
    const desc = document.querySelector(".api-card-desc");
    
    if (key) {
      this.apiKeyStatus.textContent = "Status: Real Groq AI Active";
      this.apiKeyStatus.className = "api-status-badge active";
      if (desc) {
        desc.textContent = "Real Groq AI is active using your manual browser API key.";
      }
    } else if (this.localDevKeyActive) {
      this.apiKeyStatus.textContent = "Status: Local Env AI Active";
      this.apiKeyStatus.className = "api-status-badge active";
      if (desc) {
        desc.textContent = "Real Groq AI is active using your local .env configuration key.";
      }
    } else if (this.serverHasKey) {
      this.apiKeyStatus.textContent = "Status: Cloud AI Active";
      this.apiKeyStatus.className = "api-status-badge active";
      if (desc) {
        desc.textContent = "Real Groq AI is active using the secure server API key. No key configuration is required from you.";
      }
    } else {
      this.apiKeyStatus.textContent = "Status: Local Simulation Active";
      this.apiKeyStatus.className = "api-status-badge inactive";
      if (desc) {
        desc.textContent = "Enter your Groq Key to run real Llama-3.3 generations. Key is stored locally in your browser.";
      }
    }
  }

  getActivePromptsText() {
    // Merges customized prompt layers with defaults
    const combined = {};
    Object.keys(promptLayers).forEach(key => {
      combined[key] = this.state.customPrompts[key] || promptLayers[key].systemPrompt;
    });
    return combined;
  }

  // MAIN PAGE RENDERERS
  render() {
    this.updateApiKeyStatus();
    if (!this.state.onboarded) {
      // Display onboarding flow
      this.onboardingSection.classList.remove("hidden");
      this.mainSection.classList.add("hidden");
      this.renderOnboardingQuestion();
    } else {
      // Display dashboard view
      this.onboardingSection.classList.add("hidden");
      this.mainSection.classList.remove("hidden");

      // Stats counters
      this.statXp.textContent = this.state.xp;
      this.statLevel.textContent = this.state.level;
      this.statStreak.textContent = this.state.streak;
      this.statWeek.textContent = this.state.currentWeek;

      // Profile details
      this.profilePersona.textContent = this.state.profile.personaName;
      this.profileCo2.textContent = this.state.profile.annualCo2;
      this.profileSummary.textContent = this.state.profile.summaryStatement;

      // Footprint color indicators (High/Med/Low)
      this.renderPill(this.pillTransit, this.state.profile.transitMetric);
      this.renderPill(this.pillDiet, this.state.profile.dietMetric);
      this.renderPill(this.pillFlights, this.state.profile.flightMetric);
      this.renderPill(this.pillEnergy, this.state.profile.energyMetric);

      // Story blocks
      this.renderStories();
      this.updateTimeMachineBlend();

      // Weekly Nudges lists
      this.renderNudges();

      // SVGLiving Tree
      tree.render(this.treeSvg, this.state);

      // Load prompts editor view
      this.loadSelectedPrompt(this.promptSelect.value);

      // Journal logs list
      this.renderJournalHistory();
    }
  }

  renderPill(element, level) {
    if (!element) return;
    element.textContent = level;
    element.className = "impact-pill"; // Clear

    if (level === "High") {
      element.classList.add("high-impact"); // Terracotta border
    } else if (level === "Medium") {
      element.classList.add("medium-impact"); // Soft brownish border
    } else {
      element.classList.add("low-impact"); // Mint green border
    }
  }

  renderStories() {
    this.storyUnchanged.innerHTML = `
      <p class="story-text unchanged">${this.state.unchangedStory}</p>
    `;
    this.storyEcoloop.innerHTML = `
      <p class="story-text ecoloop">${this.state.ecoloopStory}</p>
    `;
  }

  updateTimeMachineBlend() {
    const completedCount = this.state.nudges.filter(n => n.completed).length;
    
    // Visually morph stories based on completions:
    // 0 Done: Unchanged story is 100% bright, Ecoloop story is 15% opacity, greyed out.
    // 1 Done: Unchanged is 65% opacity, Ecoloop is 45% opacity.
    // 2 Done: Unchanged is 35% opacity, Ecoloop is 75% opacity.
    // 3 Done: Unchanged is 12% opacity (faded red tint), Ecoloop is 100% glowing mint.
    if (completedCount === 0) {
      this.storyUnchanged.style.opacity = "1";
      this.storyUnchanged.style.filter = "none";
      this.storyEcoloop.style.opacity = "0.2";
      this.storyEcoloop.style.filter = "grayscale(90%) blur(0.5px)";
      this.tmContainer.className = "time-machine-deck state-unchanged";
    } else if (completedCount === 1) {
      this.storyUnchanged.style.opacity = "0.7";
      this.storyUnchanged.style.filter = "grayscale(30%)";
      this.storyEcoloop.style.opacity = "0.5";
      this.storyEcoloop.style.filter = "grayscale(40%)";
      this.tmContainer.className = "time-machine-deck state-transitioning-1";
    } else if (completedCount === 2) {
      this.storyUnchanged.style.opacity = "0.45";
      this.storyUnchanged.style.filter = "grayscale(70%)";
      this.storyEcoloop.style.opacity = "0.8";
      this.storyEcoloop.style.filter = "none";
      this.tmContainer.className = "time-machine-deck state-transitioning-2";
    } else {
      // 3 Completed: Flourishing!
      this.storyUnchanged.style.opacity = "0.15";
      this.storyUnchanged.style.filter = "grayscale(100%) blur(0.8px)";
      this.storyEcoloop.style.opacity = "1";
      this.storyEcoloop.style.filter = "none";
      this.tmContainer.className = "time-machine-deck state-flourishing";
    }
  }

  renderNudges() {
    this.nudgesContainer.innerHTML = "";

    const activeNudges = this.state.nudges || [];
    
    if (activeNudges.length === 0) {
      this.nudgesContainer.innerHTML = `<div class="empty-nudges">Generating new weekly actions...</div>`;
      return;
    }

    activeNudges.forEach((nudge, index) => {
      const card = document.createElement("div");
      card.className = `nudge-card ${nudge.completed ? "completed" : ""}`;
      
      // Select technique icon or initials
      const techniqueShort = nudge.behavioralTechnique.split(" ").map(w => w[0]).join("");

      card.innerHTML = `
        <div class="nudge-checkbox-wrapper">
          <input type="checkbox" id="nudge-check-${index}" ${nudge.completed ? "checked" : ""} class="nudge-checkbox">
          <label for="nudge-check-${index}" class="nudge-checkbox-label"></label>
        </div>
        <div class="nudge-content">
          <div class="nudge-header-row">
            <h4 class="nudge-title">${nudge.title}</h4>
            <div class="nudge-badges">
              <span class="badge-effort ${nudge.effort.toLowerCase()}">${nudge.effort}</span>
              <span class="badge-impact">+${nudge.impactScore}kg CO₂</span>
            </div>
          </div>
          <p class="nudge-desc">${nudge.actionDescription}</p>
          <div class="nudge-technique">
            <span class="technique-tag" title="Behavioral Science: ${nudge.behavioralTechnique}">
              <span class="tag-icon">${techniqueShort}</span>${nudge.behavioralTechnique}
            </span>
            <p class="technique-explanation">${nudge.scientificExplanation}</p>
          </div>
        </div>
      `;

      // Checkbox event
      const checkbox = card.querySelector(".nudge-checkbox");
      checkbox.addEventListener("change", () => this.toggleNudgeCompletion(index));

      // Make clicking the text toggle as well
      const content = card.querySelector(".nudge-content");
      content.addEventListener("click", (e) => {
        if (!e.target.closest("label") && !e.target.closest("input")) {
          checkbox.checked = !checkbox.checked;
          this.toggleNudgeCompletion(index);
        }
      });

      this.nudgesContainer.appendChild(card);
    });

    // Check if all completed to toggle "End Week" state
    const allCompleted = activeNudges.every(n => n.completed);
    if (allCompleted) {
      this.btnEndWeek.classList.add("ready");
    } else {
      this.btnEndWeek.classList.remove("ready");
    }
  }

  renderJournalHistory() {
    this.journalHistoryContainer.innerHTML = "";
    
    // Sort history reverse chronological
    const logs = [...this.state.history].reverse();

    if (logs.length === 0) {
      this.journalHistoryContainer.innerHTML = `
        <div class="empty-history-editorial">
          <p>The pages of your journal are empty. As you advance through weeks on the dashboard and write reflections, your editorial history logs will appear here.</p>
        </div>
      `;
      return;
    }

    logs.forEach(log => {
      const entry = document.createElement("div");
      entry.className = "journal-entry-card";
      entry.innerHTML = `
        <div class="journal-entry-header">
          <h4 class="journal-entry-title">Week ${log.week} Reflections</h4>
          <span class="journal-entry-date">${log.timestamp}</span>
        </div>
        <p class="journal-entry-text">"${log.reflectionText}"</p>
        <div class="journal-entry-footer">
          <span>Actions completed: ${log.completedActionsCount}/${log.totalActionsCount}</span>
          <span>+${log.xpEarned} XP</span>
        </div>
      `;
      this.journalHistoryContainer.appendChild(entry);
    });
  }
}

// Initialise the application on document load
window.addEventListener("DOMContentLoaded", () => {
  window.app = new EcoLoopApp();
});
