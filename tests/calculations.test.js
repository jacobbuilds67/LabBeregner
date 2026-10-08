import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMaximumDivision,
  calculateMinimumWeight,
  calculateRequiredTolerance,
  calculateScaleRecommendation,
  convertValue,
  decimalPlacesForDivision,
  divisionFromGramDecimals,
  formatDanish,
  parseDanishNumber,
  recommendDivision
} from "../calculations.js";

const closeTo = (actual, expected, tolerance = 1e-12) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} er ikke tæt på ${expected}`);
};

test("omregner masseenheder", () => {
  assert.equal(convertValue(1, "kg", "g"), 1000);
  assert.equal(convertValue(1, "g", "mg"), 1000);
});

test("omregner volumenenheder", () => {
  assert.equal(convertValue(1, "L", "mL"), 1000);
  assert.equal(convertValue(1, "mL", "µL"), 1000);
  closeTo(convertValue(1, "µL", "nL"), 1000);
});

test("omregner mellem masse og volumen med massefylde", () => {
  assert.equal(convertValue(1, "g", "mL", 1), 1);
  assert.equal(convertValue(8, "g", "mL", 0.8), 10);
  assert.equal(convertValue(10, "mL", "g", 0.8), 8);
});

test("beregner teoretisk minimumsvægt", () => {
  const result = calculateMinimumWeight(0.1, 1, 2);
  closeTo(result.withoutSafetyFactor, 8.2);
  closeTo(result.withSafetyFactor, 16.4);
});

test("beregner maksimal deling og anbefaler en gyldig standarddeling", () => {
  const maximum = calculateMaximumDivision(16.4, 1, 2);
  closeTo(maximum, 0.1);
  closeTo(recommendDivision(maximum), 0.1);
  closeTo(recommendDivision(0.07), 0.01);
  closeTo(recommendDivision(0.049), 0.01);
});

test("bruger kun 2- og 5-delinger, når de vælges aktivt", () => {
  closeTo(recommendDivision(0.07), 0.01);
  closeTo(recommendDivision(0.07, 2), 0.02);
  closeTo(recommendDivision(0.07, 5), 0.05);
});

test("angiver vægtens decimaler på gramvisningen", () => {
  const result = calculateScaleRecommendation(1, "mg", 1, 2);
  closeTo(result.maximumInUnit, 0.006097560975609756);
  closeTo(result.recommendedInUnit, 0.001);
  closeTo(result.recommendedGrams, 0.000001);
  assert.equal(result.decimals, 6);
  assert.equal(decimalPlacesForDivision(result.recommendedGrams), 6);
});

test("fortolker valgte decimaler som decimaler i gram", () => {
  closeTo(divisionFromGramDecimals(5, "mg"), 0.01);
  closeTo(divisionFromGramDecimals(3, "kg"), 0.000001);
});

test("beregner nødvendig tolerance og absolut tolerance", () => {
  const result = calculateRequiredTolerance(16.4, 0.1, 2);
  closeTo(result.percent, 1);
  closeTo(result.fraction, 0.01);
  closeTo(result.absolute, 0.164);
});

test("beregningen er uafhængig af den valgte masseenhed", () => {
  const inGrams = calculateRequiredTolerance(16.4, 0.1, 2);
  const inMilligrams = calculateRequiredTolerance(16400, 100, 2);
  closeTo(inGrams.percent, inMilligrams.percent);
});

test("accepterer dansk decimalkomma og punktum", () => {
  assert.equal(parseDanishNumber("0,8"), 0.8);
  assert.equal(parseDanishNumber("0.8"), 0.8);
  assert.equal(parseDanishNumber("1.234,5"), 1234.5);
});

test("viser små tal som decimaltal", () => {
  assert.equal(formatDanish(0.000001), "0,000001");
  assert.ok(!formatDanish(0.000001).toLowerCase().includes("e"));
});

test("afviser ugyldige beregningsværdier", () => {
  assert.throws(() => calculateMaximumDivision(0, 1, 2));
  assert.throws(() => calculateRequiredTolerance(10, 0.1, 0.5));
  assert.throws(() => convertValue(1, "g", "mL", 0));
});
