import { test } from "node:test";
import assert from "node:assert/strict";
import { simulation } from "../js/simulation.js";

test("simulation.parseOnboarding - fallback logic", async () => {
  const mockAnswers = {
    commute: "I drive a personal car to get around daily.",
    diet: "I eat a vegetarian diet with some dairy.",
    flights: "I fly a few times a year, mostly for holidays.",
    energy: "We use renewable solar panels and an electric heat pump.",
    city: "London"
  };

  const result = await simulation.parseOnboarding(mockAnswers, {}, null);

  assert.ok(result.profile, "Should return a profile object");
  assert.ok(result.profile.annualCo2 > 0, "annualCo2 should be a positive number");
  assert.equal(result.profile.city, "London", "City should be preserved");
  assert.ok(result.profile.personaName, "Should assign a persona");
  assert.ok(result.unchangedStory, "Should generate unchanged trajectory story");
  assert.ok(result.ecoloopStory, "Should generate ecoloop path story");
});

test("simulation.generateWeeklyNudges - builds exactly 3 nudges", () => {
  const mockProfile = {
    personaName: "The Eco-Friendly Londoner",
    annualCo2: 4.5,
    city: "London",
    summaryStatement: "Balanced carbon profile.",
    transitMetric: "Medium",
    dietMetric: "Low",
    flightMetric: "Low",
    energyMetric: "Low",
    isVegan: false,
    isVegetarian: true
  };

  const nudges = simulation.generateWeeklyNudges(mockProfile);

  assert.equal(nudges.length, 3, "Should generate exactly 3 nudges");
  nudges.forEach((nudge) => {
    assert.ok(nudge.title, "Nudge must have a title");
    assert.ok(nudge.effort, "Nudge must have effort level");
    assert.ok(nudge.impactScore > 0, "Nudge must have positive impactScore");
    assert.ok(nudge.behavioralTechnique, "Nudge must list a behavioral technique");
    assert.ok(nudge.foggMetrics, "Nudge must have foggMetrics assigned");
    assert.ok(nudge.foggMetrics.motivation >= 60, "Motivation score should be random but high");
  });
});

test("simulation.generateAgentDebate - outputs turns from three agents", async () => {
  const mockProfile = {
    personaName: "The Eco-Friendly Londoner",
    annualCo2: 4.5,
    city: "London",
    summaryStatement: "Balanced carbon profile."
  };

  const debate = await simulation.generateAgentDebate(mockProfile, {}, null);

  assert.ok(debate.turns, "Debate output must have turns");
  assert.equal(debate.turns.length, 3, "Debate must have exactly 3 turns");
  assert.equal(debate.turns[0].agent, "Eco-Optimist", "First speaker should be Eco-Optimist");
  assert.equal(debate.turns[1].agent, "Climate Realist", "Second speaker should be Climate Realist");
  assert.equal(debate.turns[2].agent, "Municipal Planner", "Third speaker should be Municipal Planner");
});

test("simulation.generateSingleStory - supports custom system instructions", async () => {
  const mockProfile = {
    personaName: "The Eco-Friendly Londoner",
    annualCo2: 4.5,
    city: "London",
    summaryStatement: "Balanced carbon profile."
  };

  const dystopianStory = await simulation.generateSingleStory(mockProfile, "Use a dystopian style story", null);
  assert.ok(dystopianStory.includes("ash") || dystopianStory.includes("orange"), "Should return dystopian narrative on matching keyword");

  const scientificStory = await simulation.generateSingleStory(mockProfile, "Use a scientific data report style", null);
  assert.ok(scientificStory.includes("Simulation parameters"), "Should return scientific narrative on matching keyword");
});
