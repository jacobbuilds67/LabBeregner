import {
  UNITS,
  calculateMinimumWeight,
  calculateRequiredTolerance,
  calculateScaleRecommendation,
  convertValue,
  decimalPlacesForDivision,
  divisionFromGramDecimals,
  formatDanish,
  parseDanishNumber
} from "./calculations.js?v=3";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const settingsKey = "lab-beregner-settings-v1";

function valueOf(selector) {
  return parseDanishNumber($(selector).value);
}

function setError(selector, message = "") {
  const error = $(selector);
  error.textContent = message;
  const inputId = error.id.replace(/-error$/, "");
  const input = document.getElementById(inputId);
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

function clearErrors(selectors) {
  selectors.forEach((selector) => setError(selector));
}

function validatePositive(value, errorSelector, label, minimum = Number.MIN_VALUE) {
  if (!Number.isFinite(value)) {
    setError(errorSelector, `Indtast ${label.toLowerCase()}.`);
    return false;
  }
  if (value < minimum) {
    setError(errorSelector, minimum === 1 ? `${label} skal være mindst 1.` : `${label} skal være større end 0.`);
    return false;
  }
  return true;
}

function updateConverter() {
  clearErrors(["#converter-error", "#density-error"]);
  const value = valueOf("#converter-value");
  const density = valueOf("#density");
  const from = $("#converter-from").value;
  const to = $("#converter-to").value;
  const crossesType = UNITS[from].type !== UNITS[to].type;
  $("#density-panel").hidden = !crossesType;
  $("#converter-to-label").textContent = to;

  let valid = validatePositive(value, "#converter-error", "Værdien", 0);
  if (value < 0) {
    setError("#converter-error", "Værdien må ikke være negativ.");
    valid = false;
  }
  if (crossesType) valid = validatePositive(density, "#density-error", "Massefylden") && valid;

  if (!valid) {
    $("#converter-result").textContent = "—";
    return;
  }

  const result = convertValue(value, from, to, density);
  $("#converter-result").textContent = formatDanish(result, { maximumFractionDigits: 15 });
  $("#water-density").classList.toggle("is-selected", Math.abs(density - 1) < 1e-12);
  saveSettings();
}

function updateScaleFinder() {
  clearErrors(["#scale-net-weight-error", "#scale-tolerance-error", "#scale-safety-error"]);
  const weight = valueOf("#scale-net-weight");
  const tolerance = valueOf("#scale-tolerance");
  const safety = valueOf("#scale-safety");
  const unit = $("#scale-unit").value;
  const divisionSeries = Number($("input[name='scale-division-series']:checked").value);
  const valid = [
    validatePositive(weight, "#scale-net-weight-error", "Nettovægten"),
    validatePositive(tolerance, "#scale-tolerance-error", "Procestolerancen"),
    validatePositive(safety, "#scale-safety-error", "Sikkerhedsfaktoren", 1)
  ].every(Boolean);

  if (!valid) {
    $("#scale-decimals").textContent = "—";
    $("#scale-division").textContent = "Ret felterne ovenfor";
    $("#scale-maximum").textContent = "—";
    return;
  }

  try {
    const recommendation = calculateScaleRecommendation(weight, unit, tolerance, safety, divisionSeries);
    const { decimals } = recommendation;
    const equivalent = unit === "g"
      ? ""
      : ` (${formatDanish(recommendation.recommendedInUnit, { maximumFractionDigits: 15 })} ${unit})`;
    $("#scale-decimals").textContent = `${decimals} ${decimals === 1 ? "decimal" : "decimaler"}`;
    $("#scale-division").textContent = `Anbefalet ${divisionSeries}-deling: ${formatDanish(recommendation.recommendedGrams, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} g${equivalent}`;
    $("#scale-maximum").textContent = `${formatDanish(recommendation.maximumGrams, { maximumFractionDigits: 15 })} g`;
    saveSettings();
  } catch (error) {
    $("#scale-decimals").textContent = "Uden for område";
    $("#scale-division").textContent = error.message;
  }
}

function updateMinimumWeight() {
  setError("#minimum-error");
  const division = valueOf("#minimum-division");
  const tolerance = valueOf("#minimum-tolerance");
  const safety = valueOf("#minimum-safety");
  const unit = $("#minimum-unit").value;
  try {
    const result = calculateMinimumWeight(division, tolerance, safety);
    $("#minimum-result").textContent = `${formatDanish(result.withSafetyFactor, { maximumFractionDigits: 15 })} ${unit}`;
    $("#minimum-base").textContent = `Minimumsvægt uden sikkerhedsfaktor: ${formatDanish(result.withoutSafetyFactor, { maximumFractionDigits: 15 })} ${unit}`;
  } catch (error) {
    setError("#minimum-error", error.message);
    $("#minimum-result").textContent = "—";
    $("#minimum-base").textContent = "Ret felterne ovenfor";
  }
}

function selectedToleranceDivision() {
  const mode = $("input[name='resolution-mode']:checked").value;
  if (mode === "decimals") {
    return divisionFromGramDecimals(Number($("#tolerance-decimals").value), $("#tolerance-unit").value);
  }
  return valueOf("#tolerance-division");
}

function updateTolerance() {
  clearErrors(["#tolerance-net-weight-error", "#tolerance-division-error", "#tolerance-safety-error", "#desired-tolerance-error"]);
  const weight = valueOf("#tolerance-net-weight");
  const division = selectedToleranceDivision();
  const safety = valueOf("#tolerance-safety");
  const desiredRaw = $("#desired-tolerance").value.trim();
  const desired = parseDanishNumber(desiredRaw);
  const unit = $("#tolerance-unit").value;
  $("#tolerance-division-unit").textContent = unit;

  const valid = [
    validatePositive(weight, "#tolerance-net-weight-error", "Nettovægten"),
    validatePositive(division, "#tolerance-division-error", "Delingen"),
    validatePositive(safety, "#tolerance-safety-error", "Sikkerhedsfaktoren", 1)
  ].every(Boolean);

  let desiredValid = true;
  if (desiredRaw && (!Number.isFinite(desired) || desired <= 0)) {
    setError("#desired-tolerance-error", "Procestolerancen skal være større end 0.");
    desiredValid = false;
  }

  if (!valid || !desiredValid) {
    $("#tolerance-result").textContent = "—";
    $("#absolute-result").textContent = "Ret felterne ovenfor";
    $("#tolerance-comparison").hidden = true;
    return;
  }

  const result = calculateRequiredTolerance(weight, division, safety);
  const decimals = decimalPlacesForDivision(division);
  $("#tolerance-result").textContent = `${formatDanish(result.percent, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} %`;
  $("#absolute-result").textContent = `Absolut tolerance: ${formatDanish(result.absolute, { minimumFractionDigits: decimals, maximumFractionDigits: Math.max(decimals, 12) })} ${unit}`;
  $("#tolerance-formula").textContent = `T = (0,82 × ${formatDanish(division, { maximumFractionDigits: 15 })} × ${formatDanish(safety)}) / ${formatDanish(weight, { maximumFractionDigits: 15 })} = ${formatDanish(result.fraction, { maximumFractionDigits: 15 })}`;

  const comparison = $("#tolerance-comparison");
  if (desiredRaw) {
    const passes = desired + 1e-12 >= result.percent;
    comparison.hidden = false;
    comparison.className = `comparison ${passes ? "success" : "warning"}`;
    comparison.textContent = passes
      ? `Opfyldt: Den ønskede tolerance på ${formatDanish(desired)} % er tilstrækkelig.`
      : `Ikke opfyldt: Du skal acceptere mindst ${formatDanish(result.percent, { maximumFractionDigits: 8 })} %.`;
  } else {
    comparison.hidden = true;
  }
  saveSettings();
}

function switchTab(tab) {
  $$(".tab").forEach((candidate) => {
    const active = candidate === tab;
    candidate.classList.toggle("is-active", active);
    candidate.setAttribute("aria-selected", String(active));
    candidate.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(candidate.dataset.panel);
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  localStorage.setItem("lab-beregner-active-tab", tab.id);
}

function updateResolutionMode() {
  const mode = $("input[name='resolution-mode']:checked").value;
  $("#division-field").hidden = mode !== "division";
  $("#decimals-field").hidden = mode !== "decimals";
  updateTolerance();
}

function saveSettings() {
  const settings = {
    converterFrom: $("#converter-from").value,
    converterTo: $("#converter-to").value,
    density: $("#density").value,
    scaleUnit: $("#scale-unit").value,
    scaleSafety: $("#scale-safety").value,
    toleranceUnit: $("#tolerance-unit").value,
    toleranceSafety: $("#tolerance-safety").value
  };
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function restoreSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey));
    if (!settings) return;
    const mapping = {
      converterFrom: "#converter-from", converterTo: "#converter-to", density: "#density",
      scaleUnit: "#scale-unit", scaleSafety: "#scale-safety",
      toleranceUnit: "#tolerance-unit", toleranceSafety: "#tolerance-safety"
    };
    Object.entries(mapping).forEach(([key, selector]) => {
      if (settings[key] !== undefined) $(selector).value = settings[key];
    });
  } catch {
    localStorage.removeItem(settingsKey);
  }
}

function initialise() {
  restoreSettings();

  $$(".tab").forEach((tab) => tab.addEventListener("click", () => switchTab(tab)));
  $$(".tab").forEach((tab, index, tabs) => tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    switchTab(next);
    next.focus();
  }));

  ["#converter-value", "#density"].forEach((selector) => $(selector).addEventListener("input", updateConverter));
  ["#converter-from", "#converter-to"].forEach((selector) => $(selector).addEventListener("change", updateConverter));
  $("#swap-units").addEventListener("click", () => {
    const from = $("#converter-from").value;
    $("#converter-from").value = $("#converter-to").value;
    $("#converter-to").value = from;
    updateConverter();
  });
  $("#water-density").addEventListener("click", () => { $("#density").value = "1,000"; updateConverter(); });

  ["#scale-net-weight", "#scale-tolerance", "#scale-safety"].forEach((selector) => $(selector).addEventListener("input", updateScaleFinder));
  $("#scale-unit").addEventListener("change", updateScaleFinder);
  $$("input[name='scale-division-series']").forEach((input) => input.addEventListener("change", updateScaleFinder));
  ["#minimum-division", "#minimum-tolerance", "#minimum-safety"].forEach((selector) => $(selector).addEventListener("input", updateMinimumWeight));
  $("#minimum-unit").addEventListener("change", updateMinimumWeight);

  ["#tolerance-net-weight", "#tolerance-division", "#tolerance-safety", "#desired-tolerance"].forEach((selector) => $(selector).addEventListener("input", updateTolerance));
  ["#tolerance-unit", "#tolerance-decimals"].forEach((selector) => $(selector).addEventListener("change", updateTolerance));
  $$("input[name='resolution-mode']").forEach((input) => input.addEventListener("change", updateResolutionMode));

  $$(".quick-values button").forEach((button) => button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    input.value = button.dataset.value;
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.toggle("is-selected", item === button));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }));

  const dialog = $("#info-dialog");
  $("#info-button").addEventListener("click", () => dialog.showModal());
  ["#close-dialog", "#dialog-ok"].forEach((selector) => $(selector).addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

  const savedTab = document.getElementById(localStorage.getItem("lab-beregner-active-tab"));
  if (savedTab?.classList.contains("tab")) switchTab(savedTab);

  updateConverter();
  updateScaleFinder();
  updateMinimumWeight();
  updateTolerance();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
  }
}

initialise();
