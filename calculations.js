export const UNITS = Object.freeze({
  kg: { label: "kg", type: "mass", toBase: 1000 },
  g: { label: "g", type: "mass", toBase: 1 },
  mg: { label: "mg", type: "mass", toBase: 0.001 },
  L: { label: "L", type: "volume", toBase: 1000 },
  mL: { label: "mL", type: "volume", toBase: 1 },
  "µL": { label: "µL", type: "volume", toBase: 0.001 },
  nL: { label: "nL", type: "volume", toBase: 0.000001 }
});

const EPSILON = 1e-12;

export function parseDanishNumber(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : Number.NaN;
  const value = String(raw ?? "").trim().replace(/\s/g, "");
  if (!value) return Number.NaN;

  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  let normalized = value;

  if (comma >= 0 && dot >= 0) {
    const decimalIndex = Math.max(comma, dot);
    normalized = value
      .split("")
      .filter((character, index) => (character !== "," && character !== ".") || index === decimalIndex)
      .join("")
      .replace(",", ".");
  } else if (comma >= 0) {
    normalized = value.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatDanish(value, options = {}) {
  if (!Number.isFinite(value)) return "—";
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = Math.max(minimumFractionDigits, 12)
  } = options;

  const safeMinimum = Math.min(20, Math.max(0, minimumFractionDigits));
  const safeMaximum = Math.min(20, Math.max(safeMinimum, maximumFractionDigits));

  return new Intl.NumberFormat("da-DK", {
    useGrouping: false,
    minimumFractionDigits: safeMinimum,
    maximumFractionDigits: safeMaximum
  }).format(value);
}

export function decimalPlacesForDivision(division) {
  if (!Number.isFinite(division) || division <= 0 || division >= 1) return 0;
  const text = division.toFixed(15).replace(/0+$/, "");
  return text.includes(".") ? text.split(".")[1].length : 0;
}

export function convertValue(value, fromUnit, toUnit, density = 1) {
  const from = UNITS[fromUnit];
  const to = UNITS[toUnit];
  if (!from || !to) throw new Error("Ukendt enhed");
  if (!Number.isFinite(value)) throw new Error("Ugyldig værdi");
  if (!Number.isFinite(density) || density <= 0) throw new Error("Massefylden skal være større end 0");

  if (from.type === to.type) {
    return (value * from.toBase) / to.toBase;
  }

  if (from.type === "mass") {
    const grams = value * from.toBase;
    const millilitres = grams / density;
    return millilitres / to.toBase;
  }

  const millilitres = value * from.toBase;
  const grams = millilitres * density;
  return grams / to.toBase;
}

export function calculateMinimumWeight(division, tolerancePercent, safetyFactor = 2) {
  validatePositive(division, "Delingen");
  validatePositive(tolerancePercent, "Procestolerancen");
  validateSafetyFactor(safetyFactor);
  const tolerance = tolerancePercent / 100;
  const withoutSafetyFactor = (0.82 * division) / tolerance;
  return {
    withoutSafetyFactor,
    withSafetyFactor: withoutSafetyFactor * safetyFactor
  };
}

export function calculateMaximumDivision(netWeight, tolerancePercent, safetyFactor = 2) {
  validatePositive(netWeight, "Nettovægten");
  validatePositive(tolerancePercent, "Procestolerancen");
  validateSafetyFactor(safetyFactor);
  return (netWeight * (tolerancePercent / 100)) / (0.82 * safetyFactor);
}

export function calculateRequiredTolerance(netWeight, division, safetyFactor = 2) {
  validatePositive(netWeight, "Nettovægten");
  validatePositive(division, "Delingen");
  validateSafetyFactor(safetyFactor);
  const fraction = (0.82 * division * safetyFactor) / netWeight;
  return {
    fraction,
    percent: fraction * 100,
    absolute: netWeight * fraction
  };
}

export function calculateScaleRecommendation(netWeight, unit, tolerancePercent, safetyFactor = 2, divisionSeries = 1) {
  if (!UNITS[unit] || UNITS[unit].type !== "mass") throw new Error("Vælg en gyldig masseenhed");
  const maximumInUnit = calculateMaximumDivision(netWeight, tolerancePercent, safetyFactor);
  const maximumGrams = convertValue(maximumInUnit, unit, "g");
  const recommendedGrams = recommendDivision(maximumGrams, divisionSeries);
  return {
    maximumInUnit,
    maximumGrams,
    recommendedInUnit: convertValue(recommendedGrams, "g", unit),
    recommendedGrams,
    decimals: decimalPlacesForDivision(recommendedGrams)
  };
}

export function divisionFromGramDecimals(decimals, targetUnit = "g") {
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("Antal decimaler skal være et heltal på 0 eller mere");
  if (!UNITS[targetUnit] || UNITS[targetUnit].type !== "mass") throw new Error("Vælg en gyldig masseenhed");
  return convertValue(10 ** -decimals, "g", targetUnit);
}

export function recommendDivision(maximumDivision, divisionSeries = 1) {
  validatePositive(maximumDivision, "Den maksimale deling");
  if (![1, 2, 5].includes(divisionSeries)) throw new Error("Delingstypen skal være 1, 2 eller 5");
  const highestPower = Math.ceil(Math.log10(maximumDivision)) + 1;
  const candidates = [];

  for (let power = highestPower; power >= -15; power -= 1) {
    candidates.push(divisionSeries * 10 ** power);
  }

  const sorted = [...new Set(candidates)].sort((a, b) => b - a);
  const recommended = sorted.find((candidate) => candidate <= maximumDivision * (1 + EPSILON));
  if (!recommended) throw new Error("Resultatet kræver en finere deling end appen understøtter");
  return recommended;
}

function validatePositive(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} skal være større end 0`);
}

function validateSafetyFactor(value) {
  if (!Number.isFinite(value) || value < 1) throw new Error("Sikkerhedsfaktoren skal være mindst 1");
}
