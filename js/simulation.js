/**
 * Simulation Engine for EcoLoop.
 * Emulates LLM processing client-side, incorporating keyword analysis,
 * city-specific climate trajectories, and responsive adaptations to prompt modifications.
 */

// Trajectories for major cities to ground the Time Machine stories
const CITY_TRAJECTORIES = {
  "new york": {
    name: "New York City",
    unchanged: "The East River regularly breaches the seawalls, flooding lower Manhattan subways under a muggy, soot-laden haze. Summer blackouts are frequent as an outdated grid struggles against the continuous hum of air conditioners.",
    ecoloop: "Lush floating wetlands line the East River, buffering storm surges. Community solar cooperatives power cool-roofed brick buildings, and pedestrianized streets hum with electric micro-shuttles and cycles."
  },
  "san francisco": {
    name: "San Francisco",
    unchanged: "Autumn brings a persistent orange twilight, with wildfire smoke trapping heat between dry coastal hills. Water restrictions are permanent, and the Bay's tidal wetlands are slowly submerged by rising ocean currents.",
    ecoloop: "Solar-powered microgrids protect neighborhoods from wildfire shutoffs. Restored marshlands along the Bay serve as thriving parks, and greywater recycling systems keep local public gardens lush and green."
  },
  "london": {
    name: "London",
    unchanged: "Stifling 40°C heatwaves crack clay foundations of historical homes, while flash storms overwhelm the Victorian sewers, flooding basements. The air feels heavy with traffic-induced pollution.",
    ecoloop: "Lush urban pocket forests cool the brick avenues, and clean-air walking zones replace busy roads. A modernized Thames barrier keeps the city safe, and neighborhood energy loops share heating resources."
  },
  "sydney": {
    name: "Sydney",
    unchanged: "Sweltering summer winds blast off the continent, pushing temperatures to 46°C and triggering bushfire alerts. Sea level rise eats away at the beaches, and coal-powered grids struggle to keep up.",
    ecoloop: "Cooling corridors of native vegetation sweep from the harbor to the western suburbs. Houses are shielded by solar verges, and a circular water recycling system feeds thriving public gardens."
  },
  "tokyo": {
    name: "Tokyo",
    unchanged: "Intense super-typhoons force flood barriers to close monthly, drowning train stations. The heat island effect in Shinjuku makes walking outdoors in August a health hazard under a grey concrete sky.",
    ecoloop: "Vertical green forests drape down skyscrapers, slashing street temperatures. Sponge-city channels divert rainfall to beautiful urban canals, and community gardens grow fresh produce in every ward."
  },
  "default": {
    name: "your city",
    unchanged: "Heavy storm surges and oppressive heat dome conditions lock the city in a cycle of emergencies. Fresh produce prices have soared, and the air carries a dusty, metallic smell of high emissions.",
    ecoloop: "Shaded canopy walkways protect neighborhoods from heat domes. Decentralized renewable grids supply clean power, local agricultural cooperatives thrive, and community parks cool the urban air."
  }
};

// Rich repository of weekly micro-nudges classified by leverage areas
const NUDGE_POOL = {
  transit: [
    {
      title: "The Active Half-Mile",
      actionDescription: "Walk or bike for any commute trip under 1.5 miles this week instead of driving.",
      impactScore: 4.8,
      effort: "Medium",
      behavioralTechnique: "Identity Priming",
      scientificExplanation: "By stepping out of the car cabin, you prime your self-concept as an active, connected citizen rather than a passive traveler."
    },
    {
      title: "Idle-Free Waiting",
      actionDescription: "Turn off your car engine when parked or waiting for more than 15 seconds.",
      impactScore: 1.2,
      effort: "Easy",
      behavioralTechnique: "Loss Framing",
      scientificExplanation: "Reminding yourself that idling wastes fuel isolates the immediate financial loss, prompting a simple click of the key."
    },
    {
      title: "Public Transit Tuesdays",
      actionDescription: "Swap your Tuesday car commute for the train or bus.",
      impactScore: 8.5,
      effort: "Medium",
      behavioralTechnique: "Implementation Intention",
      scientificExplanation: "Setting a concrete date and time ('Tuesday morning') bypasses decision fatigue and makes the habit automatic."
    },
    {
      title: "Low-Drag Driving",
      actionDescription: "Remove roof racks or heavy cargo from the trunk when not in use.",
      impactScore: 2.1,
      effort: "Easy",
      behavioralTechnique: "Social Proof",
      scientificExplanation: "Over 80% of efficient drivers optimize aerodynamics. Adopting this standard matches your behavior to high-performer norms."
    }
  ],
  diet: [
    {
      title: "Meatless Midweek Lunch",
      actionDescription: "Swap Wednesday's beef or pork lunch for a high-protein plant-based option (like a chickpea bowl or lentil wrap).",
      impactScore: 3.5,
      effort: "Easy",
      behavioralTechnique: "Loss Framing",
      scientificExplanation: "Framing beef's high emissions as a direct depletion of forest resources triggers aversion to carbon waste."
    },
    {
      title: "The Oat Milk Shift",
      actionDescription: "Substitute dairy milk with oat or almond milk in all coffees and cereal this week.",
      impactScore: 1.8,
      effort: "Easy",
      behavioralTechnique: "Identity Priming",
      scientificExplanation: "Ordering plant milk acts as an outward symbol of your eco-friendly identity, reinforcing your internal commitment."
    },
    {
      title: "Fridge Audit Night",
      actionDescription: "Designate Thursday dinner to use up expiring ingredients instead of ordering takeout.",
      impactScore: 5.2,
      effort: "Medium",
      behavioralTechnique: "Implementation Intention",
      scientificExplanation: "Creating a specific 'fridge clean-up' routine locks down the exact time and context where food waste is avoided."
    },
    {
      title: "Lover of Local Crops",
      actionDescription: "Buy three vegetables sourced from your regional farms for dinner ingredients.",
      impactScore: 2.4,
      effort: "Easy",
      behavioralTechnique: "Social Proof",
      scientificExplanation: "Joining thousands in your city supporting local farmers builds a sense of collective neighborhood pride."
    }
  ],
  flights: [
    {
      title: "Train Travel Alternative",
      actionDescription: "For your next regional trip under 4 hours, commitment to purchase a train ticket instead of booking a short-haul flight.",
      impactScore: 15.0,
      effort: "Hard",
      behavioralTechnique: "Implementation Intention",
      scientificExplanation: "Deciding early on rail alternatives pre-empts the automatic impulse to search flight aggregators."
    },
    {
      title: "Direct Flight Standard",
      actionDescription: "Commit to booking direct flights for your next trip, avoiding high-emission layover takeoffs.",
      impactScore: 9.0,
      effort: "Medium",
      behavioralTechnique: "Loss Framing",
      scientificExplanation: "Layovers double takeoff emissions; framing multi-leg flights as wasteful fuel-burn prompts direct routing."
    },
    {
      title: "Carbon Offset Match",
      actionDescription: "Vow to match your next air ticket with an accredited cookstove project donation.",
      impactScore: 6.5,
      effort: "Medium",
      behavioralTechnique: "Identity Priming",
      scientificExplanation: "Paying an offset establishes your identity as someone who takes financial responsibility for their atmosphere impact."
    }
  ],
  energy: [
    {
      title: "The Thermostat Offset",
      actionDescription: "Adjust your home thermostat by 2 degrees (higher in summer, lower in winter) during sleep hours.",
      impactScore: 4.0,
      effort: "Easy",
      behavioralTechnique: "Implementation Intention",
      scientificExplanation: "Setting a scheduled nighttime adjustment converts a vague intention into an automatic thermostat routine."
    },
    {
      title: "Eco-Mode Appliances",
      actionDescription: "Switch your laundry washer and dishwasher settings to 'Eco' or 'Cold Water Only' for all loads this week.",
      impactScore: 2.5,
      effort: "Easy",
      behavioralTechnique: "Social Proof",
      scientificExplanation: "Most modern households now use eco-cycles as standard, making cold-washing a common, accepted practice."
    },
    {
      title: "Phantom Load Elimination",
      actionDescription: "Unplug your entertainment center or office desk power strip before going to bed.",
      impactScore: 1.5,
      effort: "Easy",
      behavioralTechnique: "Loss Framing",
      scientificExplanation: "Visualizing silent 'phantom draw' draining your wallet and electricity forces a physical unplugging response."
    },
    {
      title: "Led Bulb Retrofit",
      actionDescription: "Replace the two most frequently used incandescent bulbs in your home with LEDs.",
      impactScore: 3.8,
      effort: "Easy",
      behavioralTechnique: "Identity Priming",
      scientificExplanation: "Investing in energy-saving lighting physically cements your role as the steward of a low-energy household."
    }
  ]
};

// Default prompt edits checks (to make changes to prompt text actually manifest in the outputs)
function evaluatePromptModifiers(customPrompts) {
  let modifiers = {
    tone: "editorial", // editorial, dystopian, sarcastic, brief, scientific
    length: "standard", // standard, short, verbose
  };

  const allPromptTexts = Object.values(customPrompts || {}).join(" ").toLowerCase();
  
  if (allPromptTexts.includes("dystopian") || allPromptTexts.includes("scary") || allPromptTexts.includes("terrifying") || allPromptTexts.includes("grim")) {
    modifiers.tone = "dystopian";
  } else if (allPromptTexts.includes("sarcastic") || allPromptTexts.includes("cynical") || allPromptTexts.includes("snarky")) {
    modifiers.tone = "sarcastic";
  } else if (allPromptTexts.includes("scientific") || allPromptTexts.includes("statistical") || allPromptTexts.includes("numerical")) {
    modifiers.tone = "scientific";
  } else if (allPromptTexts.includes("brief") || allPromptTexts.includes("one sentence") || allPromptTexts.includes("concise") || allPromptTexts.includes("short")) {
    modifiers.tone = "brief";
    modifiers.length = "short";
  } else if (allPromptTexts.includes("poetic") || allPromptTexts.includes("sensory") || allPromptTexts.includes("eloquent")) {
    modifiers.tone = "poetic";
  }

  return modifiers;
}

async function callGroq(systemPrompt, userPrompt, apiKey = null) {
  // Check if a client-side override key is passed in, OR if a local dev key is defined in the Vite environment.
  let activeKey = apiKey ? apiKey.trim() : "";
  
  if (!activeKey) {
    try {
      activeKey = (import.meta.env.VITE_GROQ_API_KEY || "").trim();
    } catch (e) {
      // outside Vite context
    }
  }

  if (activeKey) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${activeKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    return cleanAndParseJson(text);
  }

  // Otherwise, use the secure serverless proxy endpoint
  const response = await fetch("/generation/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ systemPrompt, userPrompt })
  });

  if (!response.ok) {
    throw new Error(`Serverless proxy returned error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return cleanAndParseJson(text);
}

function cleanAndParseJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

export const simulation = {
  /**
   * Parses onboarding responses to calculate emissions metrics and select a persona
   */
  async parseOnboarding(answers, customPrompts, apiKey = null) {
    try {
      const onboardingUserText = `Onboarding Answers:\nCommute: ${answers.commute}\nDiet: ${answers.diet}\nFlights: ${answers.flights}\nEnergy: ${answers.energy}\nCity: ${answers.city}`;
      
      const profile = await callGroq(customPrompts.onboarding, onboardingUserText, apiKey);
      
      const storytellerUserText = `Carbon Profile:\nPersona: ${profile.personaName}\nEstimated CO2: ${profile.annualCo2} tons/year\nCity: ${profile.city}\nLeverage Points: ${profile.summaryStatement}`;
      
      const stories = await callGroq(customPrompts.timeMachine, storytellerUserText, apiKey);
      
      return {
        profile: {
          annualCo2: Number(profile.annualCo2) || 10.0,
          transitMetric: profile.transitMetric || "Medium",
          dietMetric: profile.dietMetric || "Medium",
          flightMetric: profile.flightMetric || "Medium",
          energyMetric: profile.energyMetric || "Medium",
          personaName: profile.personaName || "The Active Commuter",
          city: profile.city || answers.city,
          summaryStatement: profile.summaryStatement || "Your carbon profile represents balanced modern living.",
          isVegan: !!(profile.isVegan || answers.diet.toLowerCase().includes("vegan")),
          isVegetarian: !!(profile.isVegetarian || answers.diet.toLowerCase().includes("vegetarian") || answers.diet.toLowerCase().includes("vegan"))
        },
        unchangedStory: stories.unchangedPath,
        ecoloopStory: stories.ecoloopPath
      };
    } catch (err) {
      console.warn("Groq API call failed or not configured, falling back to local simulation:", err);
    }

    // Simulate AI loading delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const commuteText = answers.commute.toLowerCase();
    const dietText = answers.diet.toLowerCase();
    const flightsText = answers.flights.toLowerCase();
    const energyText = answers.energy.toLowerCase();
    const cityText = answers.city.toLowerCase();

    // 1. Transit analysis
    let transitCo2 = 1.2; // Base
    let transitMetric = "Medium";
    if (commuteText.match(/(drive|car|auto|suv|diesel|gas|petrol|truck|vehicle)/)) {
      transitCo2 = 4.8;
      transitMetric = "High";
      if (commuteText.match(/(long|daily|hours|miles|highway|commute)/)) {
        transitCo2 = 7.2;
      }
    } else if (commuteText.match(/(tesla|ev|electric|hybrid|prius|motorcycle|scooter)/)) {
      transitCo2 = 2.2;
      transitMetric = "Medium";
    } else if (commuteText.match(/(bus|train|metro|subway|transit|public|rail|tube)/)) {
      transitCo2 = 0.9;
      transitMetric = "Low";
    } else if (commuteText.match(/(walk|bike|cycle|foot|skateboard)/)) {
      transitCo2 = 0.2;
      transitMetric = "Low";
    }

    // 2. Diet analysis
    const isVegan = !!(dietText.includes("vegan") || dietText.includes("plant-based") || dietText.includes("no animal"));
    const isVegetarian = isVegan || !!(dietText.includes("vegetarian") || dietText.includes("veggie") || dietText.includes("no meat") || dietText.includes("meatless"));

    let dietCo2 = 2.2;
    let dietMetric = "Medium";
    if (isVegan) {
      dietCo2 = 0.6;
      dietMetric = "Low";
    } else if (isVegetarian) {
      dietCo2 = 1.2;
      dietMetric = "Low";
    } else if (dietText.match(/(beef|red meat|lamb|every day|steak|meat-heavy|carnivore)/)) {
      dietCo2 = 3.6;
      dietMetric = "High";
    } else if (dietText.match(/(meat|chicken|pork|poultry|fish|seafood)/)) {
      dietCo2 = 2.2;
      dietMetric = "Medium";
    }

    // 3. Flights analysis
    let flightCo2 = 1.0;
    let flightMetric = "Medium";
    if (flightsText.match(/(frequent|a lot|monthly|business|international|long-haul|10|20|many)/)) {
      flightCo2 = 6.8;
      flightMetric = "High";
    } else if (flightsText.match(/(few|couple|once|twice|2|3|4|5)/)) {
      flightCo2 = 2.8;
      flightMetric = "Medium";
    } else if (flightsText.match(/(never|none|0|zero|don't fly|rarely)/)) {
      flightCo2 = 0.2;
      flightMetric = "Low";
    }

    // 4. Energy analysis
    let energyCo2 = 1.5;
    let energyMetric = "Medium";
    if (energyText.match(/(coal|gas|oil|furnace|old|thermostat|ac|air conditioning)/)) {
      energyCo2 = 3.2;
      energyMetric = "High";
    } else if (energyText.match(/(solar|wind|renewable|heat pump|geothermal|green energy)/)) {
      energyCo2 = 0.4;
      energyMetric = "Low";
    } else if (energyText.match(/(apartment|electricity|grid|standard)/)) {
      energyCo2 = 1.6;
      energyMetric = "Medium";
    }

    // Summing emissions with an baseline infrastructure load (e.g. public roads, buildings: 1.5 tons)
    let annualCo2 = Number((transitCo2 + dietCo2 + flightCo2 + energyCo2 + 1.5).toFixed(1));

    // Determine Persona
    let personaName = "The Mindful Explorer";
    let summaryStatement = "Your carbon output is balanced, but transport options offer room for growth.";

    const metrics = { Transit: transitCo2, Diet: dietCo2, Flights: flightCo2, Energy: energyCo2 };
    const maxCategory = Object.keys(metrics).reduce((a, b) => metrics[a] > metrics[b] ? a : b);

    if (annualCo2 > 14.0) {
      if (maxCategory === "Flights") {
        personaName = "The High-Flying Jetsetter";
        summaryStatement = "Frequent long-distance flights shape a heavy carbon footprint, offering a high-impact focus area.";
      } else if (maxCategory === "Transit") {
        personaName = "The Solo Highway Cruiser";
        summaryStatement = "Daily combustion vehicle driving drives your footprint upward; commuter swaps will have a massive impact.";
      } else {
        personaName = "The High-Consumption Resident";
        summaryStatement = "Heavy residential fuel draw and rich meals elevate your impact; energy audits are key.";
      }
    } else if (annualCo2 > 7.5) {
      if (maxCategory === "Diet") {
        personaName = "The Gourmet Carnivore";
        summaryStatement = "A traditional meat-centered menu is your biggest lever; plant-forward meals offer quick wins.";
      } else if (maxCategory === "Transit") {
        personaName = "The Suburban Car Commuter";
        summaryStatement = "Your drive time accumulates steady carbon; blending public transit or EV charging yields high saves.";
      } else if (maxCategory === "Energy") {
        personaName = "The Cozy Heater";
        summaryStatement = "Thermal settings and older heating source inflate baseline emissions; smart settings offset this.";
      } else {
        personaName = "The Connected Consumer";
        summaryStatement = "Balanced modern consumption with moderate flights and travel. Focused nudges will tilt you to eco-efficiency.";
      }
    } else {
      if (dietMetric === "Low" && transitMetric === "Low") {
        personaName = "The Earth-First Advocate";
        summaryStatement = "Excellent baseline choices in food and transit; optimizing residential plug loads marks your next path.";
      } else {
        personaName = "The Low-Impact Minimalist";
        summaryStatement = "Your light-travel and conscious eating style positions you well; let's refine minor home energy inputs.";
      }
    }

    // Resolve City Trajectory
    let matchedCityKey = "default";
    for (const key of Object.keys(CITY_TRAJECTORIES)) {
      if (cityText.includes(key)) {
        matchedCityKey = key;
        break;
      }
    }
    const cityData = CITY_TRAJECTORIES[matchedCityKey];

    // Build the Stories based on trajectory & profile
    const stories = this.generateStories(personaName, annualCo2, cityData, customPrompts);

    return {
      profile: {
        annualCo2,
        transitMetric,
        dietMetric,
        flightMetric,
        energyMetric,
        personaName,
        city: cityData.name === "your city" ? answers.city : cityData.name,
        summaryStatement,
        isVegan,
        isVegetarian
      },
      unchangedStory: stories.unchangedPath,
      ecoloopStory: stories.ecoloopPath
    };
  },

  /**
   * Generates the two contrasting 2035 stories based on city trajectory and persona.
   * Adjusts style/tone if the user has modified the prompt template.
   */
  generateStories(personaName, co2, cityData, customPrompts) {
    const mods = evaluatePromptModifiers(customPrompts);
    const cityName = cityData.name;

    let unchangedPath = "";
    let ecoloopPath = "";

    // 1. UNCHANGED PATH STYLES
    if (mods.tone === "dystopian") {
      unchangedPath = `July 2035 in ${cityName}. The nightmare has materialized. You step onto the concrete under a scorched, toxic purple sky. ${cityData.unchanged} You are trapped in the chokehold of the old habits of '${personaName}', feeling the stifling weight of heat domes and soaring power rates. The atmosphere is thick, dusty, and suffocating. You realize too late that the time to change was ten years ago. Now, you merely survive the wreckage.`;
    } else if (mods.tone === "sarcastic") {
      unchangedPath = `Ah, July 2035 in ${cityName}. Beautiful, if you love wearing filtered masks. ${cityData.unchanged} As a certified '${personaName}', you're still waiting in traffic, air conditioner screaming, paying premium utility bills. But hey, at least you got those fast-delivery meals, right? The city is practically boiling, but sure, keep telling yourself you'll start your carbon diet next week.`;
    } else if (mods.tone === "scientific") {
      unchangedPath = `Climate trajectory projection for ${cityName} (July 2035). CO2 saturation has exceeded critical thresholds. ${cityData.unchanged} Continuing the profile parameters of '${personaName}' (emissions rating: ${co2} tons CO2e/year) has contributed to regional temperature hikes of +2.1°C. System infrastructure degradation limits public services, causing increased grid reliance and domestic carbon tax levies.`;
    } else if (mods.tone === "brief") {
      unchangedPath = `By 2035 in ${cityName}, your unchanged habits as ${personaName} leave you facing extreme heatwaves, rising sea surges, and high emission expenses.`;
    } else {
      // Standard Literary/Editorial
      unchangedPath = `July 2035 in ${cityName}. You pull the blinds, but the heat is relentless. Outside, ${cityData.unchanged} Your lifestyle as '${personaName}' remains locked in the patterns of 2025. You feel a familiar, low-grade anxiety as you listen to the hum of the AC unit. You're still relying on fossil commutes and carbon-heavy meals, watching the climate shifts happen from your window, feeling more like a spectator in a deteriorating world.`;
    }

    // 2. ECOLOOP PATH STYLES
    if (mods.tone === "dystopian") {
      // Even in a good future, a dystopian prompt is slightly intense
      ecoloopPath = `July 2035 in ${cityName}. Despite the global ecological decay, your sanctuary holds. ${cityData.ecoloop} Having abandoned the heavy footprint of your past self, your micro-actions have carved out a resilient, clean shelter. You breath purified air, eating homegrown crops, surviving the century by adapting and taking control.`;
    } else if (mods.tone === "sarcastic") {
      ecoloopPath = `Welcome to July 2035 in ${cityName}, where you are insufferably healthy. ${cityData.ecoloop} Your transition from '${personaName}' means you walk, eat grains, and actually know your neighbors. Yes, you saved the future, and yes, you're going to remind everyone about it at dinner.`;
    } else if (mods.tone === "scientific") {
      ecoloopPath = `Optimized ecological model for ${cityName} (July 2035). Carbon reduction initiatives have successfully sequestered local emissions. ${cityData.ecoloop} Adapting low-impact micro-habits has lowered personal carbon outputs by 65%, driving down structural energy demand and strengthening community infrastructure grid health.`;
    } else if (mods.tone === "brief") {
      ecoloopPath = `By 2035 in ${cityName}, your active carbon reduction practices have secured you a clean-air, green-powered, and climate-resilient neighborhood.`;
    } else {
      // Standard Literary/Editorial
      ecoloopPath = `July 2035 in ${cityName}. You wake up to a fresh, cool breeze flowing through the window. ${cityData.ecoloop} The shift from your old persona is complete. You walk along tree-lined avenues to get groceries, feeling a deep sense of lightness. Your daily choices align perfectly with the biosphere. You are physically connected to your community, and the air you breathe feels clean, clear, and full of promise.`;
    }

    return { unchangedPath, ecoloopPath };
  },

  /**
   * Generates 3 custom weekly nudges based on user carbon profile.
   */
  generateWeeklyNudges(profile) {
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const VEGAN_MEALS = [
      "roasted sweet potato & black bean bowl", 
      "lentil shepherd's pie", 
      "spicy chickpea curry", 
      "tofu pad thai", 
      "grilled mushroom risotto", 
      "mediterranean falafel plate"
    ];
    const NON_VEGAN_MEALS = ["beef burger", "pork ribs", "chicken nuggets", "meatball sub", "bacon double cheeseburger"];
    const LOCAL_CROPS = ["organic spinach and leeks", "local heritage apples", "fresh seasonal asparagus", "farm-stand tomatoes", "locally grown summer squash", "regional farm honey and berries"];
    const DRAG_ITEMS = ["roof cargo carrier", "empty bike rack", "heavy sports equipment in the trunk", "unused roof crossbars"];
    const PHANTOM_DEVICES = ["desktop computer power strip", "living room entertainment console", "kitchen microwave and espresso maker", "tablet and phone chargers"];
    const DISTANCES = ["1.5 miles", "2 miles", "3 miles"];
    
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    // Choose 3 distinct categories from Transit, Diet, Flights, Energy
    const categories = ["transit", "diet", "energy"];
    if (profile.flightMetric === "High") {
      categories[2] = "flights";
    }

    const nudges = [];

    categories.forEach(cat => {
      const day = getRandom(DAYS);
      
      if (cat === "transit") {
        const type = Math.random();
        if (type < 0.3) {
          const dist = getRandom(DISTANCES);
          nudges.push({
            title: `The Active Commute`,
            actionDescription: `Walk, cycle, or ride a scooter for any trip under ${dist} on ${day} instead of driving.`,
            impactScore: 4.8,
            effort: "Medium",
            behavioralTechnique: "Identity Priming",
            scientificExplanation: `Getting out of the car cabin on ${day} primes your self-identity as an active, eco-conscious commuter.`
          });
        } else if (type < 0.6) {
          const item = getRandom(DRAG_ITEMS);
          nudges.push({
            title: `Low-Drag Aerodynamics`,
            actionDescription: `Remove the ${item} from your car's exterior or trunk before your commute this week.`,
            impactScore: 2.1,
            effort: "Easy",
            behavioralTechnique: "Social Proof",
            scientificExplanation: `Aerodynamic drag wastes up to 10% fuel. Joining other efficient drivers in your area makes this standard practice.`
          });
        } else {
          nudges.push({
            title: `Public Transit ${day}s`,
            actionDescription: `Swap your ${day} commute or shopping run from driving to using the train, bus, or metro.`,
            impactScore: 8.5,
            effort: "Medium",
            behavioralTechnique: "Implementation Intention",
            scientificExplanation: `Scheduling this swap for ${day} bypasses decision fatigue, converting clean transit into a fixed routine.`
          });
        }
      }
      
      else if (cat === "diet") {
        if (profile.isVegan || profile.isVegetarian) {
          const type = Math.random();
          if (type < 0.4) {
            const crop = getRandom(LOCAL_CROPS);
            nudges.push({
              title: `Seasonal Sourcing`,
              actionDescription: `Avoid imported carbon mileage: buy locally grown ${crop} for dinner this week.`,
              impactScore: 2.8,
              effort: "Easy",
              behavioralTechnique: "Identity Priming",
              scientificExplanation: `Supporting local farmers cements your role as a direct steward of your regional food grid.`
            });
          } else if (type < 0.7) {
            const meal = getRandom(VEGAN_MEALS);
            nudges.push({
              title: `Crisper Audit Night`,
              actionDescription: `Audit your fridge on ${day} evening and cook a custom ${meal} using expiring vegetables to prevent organic waste.`,
              impactScore: 4.2,
              effort: "Medium",
              behavioralTechnique: "Implementation Intention",
              scientificExplanation: `Establishing a dedicated ${day} crisper audit pre-commits you to reducing high-impact landfill methane.`
            });
          } else {
            nudges.push({
              title: `Ditch Single-Use Plastics`,
              actionDescription: `Swap all plastic wraps and single-use bags for glass containers or beeswax wraps on ${day}.`,
              impactScore: 1.5,
              effort: "Easy",
              behavioralTechnique: "Loss Framing",
              scientificExplanation: `Framing single-use packaging as a direct loss of petroleum resources helps trigger active conservation.`
            });
          }
        } else {
          const type = Math.random();
          if (type < 0.4) {
            const meatMeal = getRandom(NON_VEGAN_MEALS);
            const veganMeal = getRandom(VEGAN_MEALS);
            nudges.push({
              title: `Plant-Forward ${day}`,
              actionDescription: `Swap a traditional ${meatMeal} on ${day} for a high-protein, plant-based ${veganMeal}.`,
              impactScore: 3.5,
              effort: "Easy",
              behavioralTechnique: "Loss Framing",
              scientificExplanation: `Framing meat's heavy emissions as a direct drain on forest and freshwater resources helps motivate dietary shifts.`
            });
          } else if (type < 0.7) {
            nudges.push({
              title: `The Oat Milk Shift`,
              actionDescription: `Substitute cow's milk with organic oat or almond milk in all coffee and cereal on ${day}.`,
              impactScore: 1.8,
              effort: "Easy",
              behavioralTechnique: "Identity Priming",
              scientificExplanation: `Choosing plant milk on ${day} acts as an outward symbol of your environmental alignment.`
            });
          } else {
            nudges.push({
              title: `Fridge Sweep Dinner`,
              actionDescription: `Sweep your fridge on ${day} night and build a customized meal using expiring ingredients to prevent food waste.`,
              impactScore: 5.2,
              effort: "Medium",
              behavioralTechnique: "Implementation Intention",
              scientificExplanation: `Scheduling a recurring ${day} audit overrides default takeout impulses and saves grocery costs.`
            });
          }
        }
      }
      
      else if (cat === "energy") {
        const type = Math.random();
        if (type < 0.33) {
          const device = getRandom(PHANTOM_DEVICES);
          nudges.push({
            title: `Phantom Load Strike`,
            actionDescription: `Unplug the ${device} before going to sleep on ${day} night.`,
            impactScore: 1.5,
            effort: "Easy",
            behavioralTechnique: "Loss Framing",
            scientificExplanation: `Visualizing silent 'vampire draws' draining electricity and money motivates a quick physical unplugging habit.`
          });
        } else if (type < 0.66) {
          nudges.push({
            title: `Cold-Wash Laundry`,
            actionDescription: `Run all clothes washing loads on ${day} using 'Cold Water' and the washing machine's Eco cycle.`,
            impactScore: 2.5,
            effort: "Easy",
            behavioralTechnique: "Social Proof",
            scientificExplanation: `Over 70% of modern households use cold cycles. Adopting this standard aligns you with normal, efficient behaviors.`
          });
        } else {
          const change = Math.random() > 0.5 ? "2 degrees cooler" : "2 degrees warmer";
          nudges.push({
            title: `Smart Thermostat Sleep`,
            actionDescription: `Adjust your thermostat by ${change} during sleep hours on ${day} night.`,
            impactScore: 4.0,
            effort: "Easy",
            behavioralTechnique: "Implementation Intention",
            scientificExplanation: `Creating a concrete trigger (setting it right before brush-time on ${day}) turns a vague idea into a habit.`
          });
        }
      }
      
      else if (cat === "flights") {
        const type = Math.random();
        if (type < 0.33) {
          nudges.push({
            title: `Direct Flight Standard`,
            actionDescription: `Commit to searching direct flight routes for your next travel booking, avoiding layover emissions.`,
            impactScore: 8.0,
            effort: "Medium",
            behavioralTechnique: "Loss Framing",
            scientificExplanation: `Layovers double landing/takeoff carbon; framing multi-leg trips as fuel waste prompts direct routing.`
          });
        } else if (type < 0.66) {
          nudges.push({
            title: `Rail Travel Priority`,
            actionDescription: `Commit to booking a train or rail ticket for your next inter-city trip under 4 hours instead of flying.`,
            impactScore: 15.0,
            effort: "Hard",
            behavioralTechnique: "Identity Priming",
            scientificExplanation: `Choosing rail transit establishes your identity as someone who values scenic, low-impact pacing.`
          });
        } else {
          nudges.push({
            title: `Carbon Match Offsets`,
            actionDescription: `Commit to purchasing an accredited Gold Standard carbon offset for your next necessary flight.`,
            impactScore: 6.5,
            effort: "Medium",
            behavioralTechnique: "Social Proof",
            scientificExplanation: `Leading corporations and mindful flyers now offset standard flights to offset unavoidable carbon loads.`
          });
        }
      }
    });

    // Ensure they are marked completed = false and have category
    nudges.forEach((n, idx) => {
      n.completed = false;
      n.category = categories[idx];
      n.foggMetrics = {
        motivation: 60 + Math.floor(Math.random() * 25),
        ability: n.effort === "Easy" ? 90 : n.effort === "Medium" ? 70 : 45,
        prompt: 95
      };
    });

    return nudges;
  },

  /**
   * Generates the weekly reflection journal text based on completed and missed nudges.
   */
  async generateReflection(completedNudges, missedNudges, streak, xpEarned, customPrompts, apiKey = null) {
    try {
      const userText = `Weekly Actions:\nCompleted: ${completedNudges.map(n => n.title).join(", ") || "None"}\nMissed: ${missedNudges.map(n => n.title).join(", ") || "None"}\nActive Streak: ${streak} weeks\nXP Earned: ${xpEarned} XP`;
      const reflection = await callGroq(customPrompts.reflection, userText, apiKey);
      return reflection.reflectionText;
    } catch (err) {
      console.warn("Groq API reflection call failed, falling back to local simulation:", err);
    }

    // Simulate AI loading delay
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const mods = evaluatePromptModifiers(customPrompts);

    if (completedNudges.length === 0) {
      if (mods.tone === "sarcastic") {
        return "Zero actions completed. Absolutely inspiring effort this week. Your 2035 future self is currently coughing in a heatwave and sending you sarcastic telepathic thanks. Maybe next week we can manage to unplug a charger?";
      } else if (mods.tone === "dystopian") {
        return "A week of absolute complacency. By choosing inaction, you strengthen the grip of the climate disaster. The smoke thickens in your 2035 horizon, while the green path decays. Every deferred choice is a brick laid in a burning city.";
      } else if (mods.tone === "scientific") {
        return "Analysis: Weekly carbon savings target unmet (0% compliance). Carbon metrics remain stagnant at base projection. Habit persistence aligns with the Unchanged 2035 baseline scenario. Intervention recommended.";
      } else if (mods.tone === "brief") {
        return "No tasks completed. Your 2035 trajectory remains unchanged. Let's aim to complete one nudge next week.";
      } else {
        // Standard Editorial
        return "This week passed without a shift in habits. It's easy to fall back into default rhythms when the daily rush takes over. Remember, the Time Machine isn't waiting—it is built from today's choices. Let this be a quiet reminder to slow down, notice your routines, and try just one small change tomorrow.";
      }
    }

    const completedNames = completedNudges.map(n => n.title.toLowerCase()).join(", ");
    
    if (completedNudges.length === 3) {
      if (mods.tone === "sarcastic") {
        return `Look at you, the perfect climate saint. Completing '${completedNames}' is surely worthy of a digital gold star. Your future self in 2035 is sipping a clean-air cocktail, bragging about how you saved the day. Don't let it get to your head, you still have next week to mess up.`;
      } else if (mods.tone === "dystopian") {
        return `A temporary victory against the encroaching ash. By conquering '${completedNames}', you have clawed back three yards of fresh soil from the 2035 inferno. Do not rest. The heat domes are patient, and the carbon grid never sleeps.`;
      } else if (mods.tone === "scientific") {
        return `Analysis: 100% completion verified. Carbon load decreased. Temporal trajectory reflects a clear shift toward the resilient 2035 model. Local energy load and food waste metrics show highly positive trends.`;
      } else if (mods.tone === "brief") {
        return `Fantastic! You completed all 3 actions: ${completedNames}. Your 2035 timeline is visibly greener and healthier.`;
      } else {
        // Standard Editorial
        return `A sweeping alignment of intentions and actions. By integrating '${completedNames}' into your week, you did more than check boxes—you changed the micro-climate of your day. The air in your 2035 future feels cooler, the tree has deep roots, and you are proving that change is a series of quiet, deliberate choices. Keep walking this path.`;
      }
    }

    // Partial completion
    if (mods.tone === "sarcastic") {
      return `A mixed bag. You did '${completedNames}', which is nice, but you ignored the rest. That's like recycling a plastic cup while driving an SUV. Still, you got some XP. Let's see if you can handle a full set next week without getting distracted.`;
    } else if (mods.tone === "dystopian") {
      return `A partial defense. You saved a few leaves with '${completedNames}', but the remaining branches are still withering under the heat of 2035. Every skipped action feeds the dust storms. The battle is far from won.`;
    } else if (mods.tone === "scientific") {
      return `Analysis: Partial compliance (approx. ${Math.round((completedNudges.length / 3) * 100)}%). Habit adjustments registered in '${completedNames}'. Energy outputs adjusted downwards, but diet/flights vectors remain static.`;
    } else if (mods.tone === "brief") {
      return `You completed some actions (${completedNames}) but missed others. Your future self is moving in the right direction. Try to go all the way next week!`;
    } else {
      // Standard Editorial
      return `Progress is rarely a straight line. By completing '${completedNames}', you made real adjustments to your footprint. Even though a few things slipped, you are learning to navigate new friction. Every small action feeds the soil. Be proud of the steps you took, and let the missed tasks guide where you focus next.`;
    }
  },

  /**
   * Generates a 3-agent climate debate set in the user's city in 2035.
   */
  async generateAgentDebate(profile, customPrompts, apiKey = null) {
    try {
      const systemPrompt = `You are a Multi-Agent Climate Debate Simulator.
Based on the user's Carbon Profile, simulate a collaborative, insightful, and highly realistic climate debate set in July 2035 in their city. The debate has exactly 3 turns, one from each of these distinct agents:
1. Eco-Optimist: Enthusiastic about citizen-led changes and local green tech. Focuses on hope and micro-habits.
2. Climate Realist: Focuses on hard geographic realities, severe weather predictions, and large-scale systemic challenges.
3. Municipal Planner: Focuses on city budget, public utility infrastructure, ROI, and practical policy.

Each agent's statement should be 70-100 words. Speak in their voice.
Return the output as a valid JSON object in this format:
{
  "turns": [
    { "agent": "Eco-Optimist", "text": "..." },
    { "agent": "Climate Realist", "text": "..." },
    { "agent": "Municipal Planner", "text": "..." }
  ]
}
Do not use markdown code block formatting.`;

      const userPrompt = `Carbon Profile:
Persona: ${profile.personaName}
Annual CO2 emissions: ${profile.annualCo2} tons/year
City: ${profile.city}
Summary: ${profile.summaryStatement}`;

      return await callGroq(systemPrompt, userPrompt, apiKey);
    } catch (err) {
      console.warn("Groq API agent debate failed, falling back to local simulation:", err);
    }

    // Fallback simulation
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const city = profile.city || "your city";
    const persona = profile.personaName || "The Conscious Citizen";
    const co2 = profile.annualCo2 || 12.0;

    return {
      turns: [
        {
          agent: "Eco-Optimist",
          text: `Looking at ${city} in 2035, the progress is inspiring! Residents like our ${persona} have adopted micro-habits—cycling more, choosing plant-based meals, and turning off vampire appliances. This collective shift has reduced municipal carbon loads by 25%. Small, local actions are forming the foundation of a highly resilient, clean-energy community. The future is active and decentralized!`
        },
        {
          agent: "Climate Realist",
          text: `While the active transit shift is commendable, we must face the hard geography of ${city}. Even in 2035, average temperatures have risen by 1.8°C, and storm surges are testing our sea walls. With ${persona}'s carbon footprint at ${co2} tons, we are still pushing the limits of the electrical grid. Micro-habits are a start, but without deep geothermal heating upgrades and structural seawall reinforcement, individual efforts will be overwhelmed.`
        },
        {
          agent: "Municipal Planner",
          text: `From the city's perspective, both views are valid. Allocating $2B for transit lanes and matching grid subsidies is a major budget challenge. However, reducing ${persona}'s emissions by even 5 tons saves the city $12,000 annually in public health costs and energy relief. The ROI on green zoning is positive over a 10-year horizon. We should pass the community micro-grid bond this November.`
        }
      ]
    };
  },

  /**
   * Generates a single 2035 story based on a custom system prompt to test prompt malleability.
   */
  async generateSingleStory(profile, systemPrompt, apiKey = null) {
    try {
      const userPrompt = `Carbon Profile:\nPersona: ${profile.personaName}\nEstimated CO2: ${profile.annualCo2} tons/year\nCity: ${profile.city}\nLeverage Points: ${profile.summaryStatement}`;
      const response = await callGroq(systemPrompt, userPrompt, apiKey);
      return response.unchangedPath || response.ecoloopPath || response.storyText || JSON.stringify(response);
    } catch (err) {
      console.warn("Groq API single story failed, falling back to local simulation:", err);
    }

    // Fallback simulation based on prompt keywords
    await new Promise((resolve) => setTimeout(resolve, 800));
    const text = systemPrompt.toLowerCase();
    if (text.includes("sarcastic") || text.includes("funny")) {
      return `Welcome to 2035 in ${profile.city}! You're still breathing carbon-flavored air and sweating through synthetic shirts because you drove your gas guzzler to work in 2025. Your level of commitment is outstandingly lazy, but at least your tree is growing some virtual berries. Happy now?`;
    } else if (text.includes("dystopian") || text.includes("dark")) {
      return `July 2035. The skies over ${profile.city} are a permanently bruised orange. Ash floats quietly onto your windows. Your energy usage in 2025 has contributed to the grid breakdown. Every breath tastes of iron, a grim reminder of the choices made a decade ago.`;
    } else if (text.includes("scientific") || text.includes("data")) {
      return `Simulation parameters: Year 2035. Location: ${profile.city}. Environmental anomaly index: +2.1. Persona footprint registered at ${profile.annualCo2} tons/year. Data indicates rising humidity and increased thermal loading. Transit metrics remain in sub-optimal state.`;
    } else {
      return `In 2035, the sun shines over ${profile.city}, but there is a quiet shift in the air. The small steps you took back in 2025 have started to mature, weaving a cooler, cleaner fabric for your daily life. You travel through shaded streets, and your footprint is light.`;
    }
  }
};
