/* NORTH — sample dataset.
 *
 * One source of truth. Every number rendered anywhere in the prototype is
 * derived from this file; no copy hardcodes a value that the data does not
 * produce. Series are generated from a seeded PRNG so the prototype is
 * deterministic, then calibrated so the headline windows land on round,
 * memorable numbers without distorting the shape of the curve.
 */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------- helpers

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var DAYS = 180;
  var END = Date.UTC(2026, 7, 29);           // 2026-08-29, "today"
  var DAY = 86400000;

  var dates = [];
  for (var i = 0; i < DAYS; i++) dates.push(new Date(END - (DAYS - 1 - i) * DAY));

  function iso(d) { return d.toISOString().slice(0, 10); }
  var isoDates = dates.map(iso);

  function idxOf(dateStr) { return isoDates.indexOf(dateStr); }

  /* Mean of the trailing `n` values ending at index `end` (inclusive). */
  function windowMean(v, end, n) {
    var s = 0;
    for (var i = end - n + 1; i <= end; i++) s += v[i];
    return s / n;
  }

  /* Affine-calibrate a series so that the mean of the last 30 days equals
   * `curTarget` and the mean of the 30 days before that equals `prevTarget`.
   * Solving for a and b preserves the curve's shape exactly — it only rescales
   * it — so the generated noise and inflection points survive untouched. */
  function calibrateWindows(v, curTarget, prevTarget) {
    var last = v.length - 1;
    var cur = windowMean(v, last, 30);
    var prev = windowMean(v, last - 30, 30);
    var a = (curTarget - prevTarget) / (cur - prev);
    var b = curTarget - a * cur;
    return v.map(function (x) { return a * x + b; });
  }

  /* Same idea for level series read at points rather than as window means:
   * calibrate so the final value and the value 30 days ago hit their targets. */
  function calibratePoints(v, curTarget, prevTarget) {
    var last = v.length - 1;
    var cur = v[last], prev = v[last - 30];
    var a = (curTarget - prevTarget) / (cur - prev);
    var b = curTarget - a * cur;
    return v.map(function (x) { return a * x + b; });
  }

  function series(id, fn, seed) {
    var rnd = mulberry32(seed);
    var out = [];
    for (var i = 0; i < DAYS; i++) out.push(fn(i, rnd, out));
    return out;
  }

  function smoothstep(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  // ------------------------------------------------------------ the story
  // Activation is stable through mid-July, then declines. The decline begins
  // on day 138 (2026-07-19) and settles over roughly three weeks. Customer
  // churn, setup support volume and integrations adoption move in the same
  // window — the prototype presents that as correlated evidence, never cause.

  var DECLINE_START = 138;                    // 2026-07-19
  var DECLINE_SPAN = 22;

  function declineShape(i) {
    return smoothstep((i - DECLINE_START) / DECLINE_SPAN);
  }

  // ------------------------------------------------------------------ MRR

  var mrr = series('mrr', function (i, rnd) {
    var base = 316000 * Math.pow(1.0070, i);           // ~5%/mo compounding
    var pricingLift = i >= 96 ? 6200 * smoothstep((i - 96) / 18) : 0;
    var wobble = Math.sin(i / 11) * 1400 + (rnd() - 0.5) * 1700;
    return base + pricingLift + wobble;
  }, 1101);
  mrr = calibratePoints(mrr, 428200, 399300);

  // -------------------------------------------------------- activation (%)

  var activation = series('activation', function (i, rnd) {
    var level = 70.4 + Math.sin(i / 23) * 0.9;
    var drop = -6.4 * declineShape(i);
    return level + drop + (rnd() - 0.5) * 3.4;
  }, 2202);
  activation = calibrateWindows(activation, 64.0, 69.6);

  // ---------------------------------------------------- customer churn (%)

  var customerChurn = series('customerChurn', function (i, rnd) {
    var level = 2.35 + Math.sin(i / 19) * 0.12;
    var rise = 0.78 * smoothstep((i - (DECLINE_START + 6)) / 20);
    return level + rise + (rnd() - 0.5) * 0.34;
  }, 3303);
  customerChurn = calibrateWindows(customerChurn, 3.1, 2.4);

  // --------------------------------------------------- revenue churn (%)

  var revenueChurn = series('revenueChurn', function (i, rnd) {
    var level = 1.42 + Math.sin(i / 17) * 0.08;
    var rise = 0.42 * smoothstep((i - (DECLINE_START + 8)) / 24);
    return level + rise + (rnd() - 0.5) * 0.22;
  }, 4404);
  revenueChurn = calibrateWindows(revenueChurn, 1.85, 1.44);

  // ------------------------------------------------------ 30-day retention

  var retention30 = series('retention30', function (i, rnd) {
    var level = 78.2 + Math.sin(i / 29) * 0.7;
    var drop = -4.4 * smoothstep((i - (DECLINE_START + 4)) / 26);
    return level + drop + (rnd() - 0.5) * 2.2;
  }, 5505);
  retention30 = calibrateWindows(retention30, 74.1, 78.2);

  // ------------------------------------------------------- active customers

  var activeCustomers = series('activeCustomers', function (i, rnd) {
    var base = 1908 + i * 1.86;
    return base + Math.sin(i / 13) * 9 + (rnd() - 0.5) * 12;
  }, 6606);
  activeCustomers = calibratePoints(activeCustomers, 2240, 2180).map(Math.round);

  // ------------------------------------------------------------ NRR (T12M)

  var nrr = series('nrr', function (i, rnd) {
    var level = 112.4 - 0.016 * i;
    var slip = -1.6 * smoothstep((i - (DECLINE_START + 10)) / 26);
    return level + slip + (rnd() - 0.5) * 0.7;
  }, 7707);
  nrr = calibratePoints(nrr, 108.2, 110.1);

  // ----------------------------------------------------------------- CSAT

  var csat = series('csat', function (i, rnd) {
    var level = 4.62 + Math.sin(i / 31) * 0.03;
    var drop = -0.2 * smoothstep((i - (DECLINE_START + 2)) / 24);
    return level + drop + (rnd() - 0.5) * 0.14;
  }, 8808);
  csat = calibrateWindows(csat, 4.41, 4.62);

  // ------------------------------------------------- support: setup tickets

  var setupTickets = series('setupTickets', function (i, rnd) {
    var level = 3.0 + Math.sin(i / 15) * 0.35;
    var rise = 0.85 * smoothstep((i - (DECLINE_START + 1)) / 20);
    return Math.max(0, level + rise + (rnd() - 0.5) * 1.5);
  }, 9909);
  // Calibrated so the trailing-30 and prior-30 totals match the support-topic
  // table exactly (112 setup conversations this period, 93 in the previous one).
  setupTickets = calibrateWindows(setupTickets, 112 / 30, 93 / 30)
    .map(function (x) { return Math.max(0, x); });

  global.NORTH_SERIES = {
    dates: isoDates,
    mrr: mrr,
    activation: activation,
    customerChurn: customerChurn,
    revenueChurn: revenueChurn,
    retention30: retention30,
    activeCustomers: activeCustomers,
    nrr: nrr,
    csat: csat,
    setupTickets: setupTickets,
    declineStartIndex: DECLINE_START,
    idxOf: idxOf,
    windowMean: windowMean
  };
})(typeof window !== 'undefined' ? window : globalThis);
