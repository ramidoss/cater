/* NORTH — the model.
 *
 * Metric definitions, breakdowns and the signals NORTH has detected. Anything
 * a card, chart or sentence needs is computed here so the interface never
 * carries a number of its own.
 */
(function (global) {
  'use strict';

  var S = global.NORTH_SERIES;
  var LAST = S.dates.length - 1;
  var PERIOD = 30;

  // ------------------------------------------------------------- formatting

  var fmt = {
    currency: function (v) {
      var a = Math.abs(v);
      if (a >= 1e6) return '$' + (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
      if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
      return '$' + Math.round(v);
    },
    currencyPrecise: function (v) {
      var sign = v < 0 ? '-' : '';
      var a = Math.abs(v);
      if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(1) + 'K';
      return sign + '$' + Math.round(a);
    },
    percent: function (v, d) { return v.toFixed(d === undefined ? 1 : d) + '%'; },
    percent0: function (v) { return Math.round(v) + '%'; },
    count: function (v) { return Math.round(v).toLocaleString('en-US'); },
    score: function (v) { return v.toFixed(2); },
    pp: function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + 'pp'; },
    rel: function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%'; },
    date: function (isoStr) {
      var d = new Date(isoStr + 'T00:00:00Z');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    },
    dateLong: function (isoStr) {
      var d = new Date(isoStr + 'T00:00:00Z');
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    }
  };

  /* Change is two different quantities and NORTH never lets them blur.
   *   - For a rate (a metric already denominated in %), the honest primary
   *     figure is the percentage-POINT move; the relative move is secondary.
   *   - For a level (dollars, counts, scores), only the relative move exists. */
  function change(cur, prev, isRate) {
    var abs = cur - prev;
    var rel = prev === 0 ? 0 : (abs / Math.abs(prev)) * 100;
    return {
      abs: abs,
      rel: rel,
      isRate: !!isRate,
      dir: abs > 0 ? 1 : abs < 0 ? -1 : 0
    };
  }

  // --------------------------------------------------------------- windows

  var window30 = { from: S.dates[LAST - PERIOD + 1], to: S.dates[LAST] };
  var windowPrev30 = { from: S.dates[LAST - 2 * PERIOD + 1], to: S.dates[LAST - PERIOD] };

  /* Trailing mean. Rate metrics are reported as a 30-day average, so their
   * charts plot the same 30-day average: the line's last point is then the
   * number on the card, and the two can never disagree. Daily rates are far
   * too noisy to read a change out of anyway. */
  function rolling(v, n) {
    var out = [], sum = 0;
    for (var i = 0; i < v.length; i++) {
      sum += v[i];
      if (i >= n) sum -= v[i - n];
      out.push(sum / Math.min(i + 1, n));
    }
    return out;
  }

  function meanCur(v) { return S.windowMean(v, LAST, PERIOD); }
  function meanPrev(v) { return S.windowMean(v, LAST - PERIOD, PERIOD); }

  // ------------------------------------------------------- events on charts

  var events = [
    { date: '2026-04-14', kind: 'release', label: 'Onboarding revamp', detail: 'Self-serve onboarding rebuilt around a guided checklist.' },
    { date: '2026-06-07', kind: 'pricing', label: 'Pricing change', detail: 'Growth tier introduced; seat price up 8% on new business.' },
    { date: '2026-07-16', kind: 'release', label: 'v4.2 integrations', detail: 'Integrations framework replaced; connector auth flow changed.' },
    { date: '2026-08-05', kind: 'campaign', label: 'Enterprise campaign', detail: 'Paid campaign targeting 200+ seat accounts.' }
  ];

  // ------------------------------------------------------------ breakdowns

  /* Activation by company size. The weights are each segment's share of
   * signups, held constant across both periods, so the comparison isolates
   * the rate change rather than mixing in a shift in signup mix. */
  var activationSegments = {
    dimension: 'Company size',
    weightLabel: 'share of signups',
    segments: [
      { id: 'ent', label: 'Enterprise', sub: '250+ employees', weight: 0.22, cur: 78.0, prev: 79.0 },
      { id: 'mid', label: 'Mid-market', sub: '50–249 employees', weight: 0.38, cur: 71.0, prev: 72.0 },
      { id: 'small', label: 'Small teams', sub: 'Under 50 employees', weight: 0.40, cur: 49.7, prev: 62.2 }
    ]
  };

  /* Contribution to the blended change: weight x the segment's own pp move.
   * This is the number that actually answers "where did the decline come
   * from" — a segment can move a long way and still barely matter. */
  function withContribution(bd) {
    var total = bd.segments.reduce(function (s, x) { return s + x.weight * (x.cur - x.prev); }, 0);
    return {
      dimension: bd.dimension,
      weightLabel: bd.weightLabel,
      totalChange: total,
      segments: bd.segments.map(function (x) {
        var delta = x.cur - x.prev;
        var contrib = x.weight * delta;
        return Object.assign({}, x, {
          delta: delta,
          rel: (delta / x.prev) * 100,
          contribution: contrib,
          shareOfChange: total === 0 ? 0 : (contrib / total) * 100
        });
      })
    };
  }

  var activationByCompanySize = withContribution(activationSegments);

  var activationByPlan = withContribution({
    dimension: 'Plan',
    weightLabel: 'share of signups',
    segments: [
      { id: 'growth', label: 'Growth', sub: 'Paid self-serve', weight: 0.34, cur: 70.4, prev: 73.1 },
      { id: 'free', label: 'Free trial', sub: '14-day trial', weight: 0.51, cur: 57.6, prev: 66.4 },
      { id: 'ent', label: 'Enterprise', sub: 'Sales-assisted', weight: 0.15, cur: 78.9, prev: 79.6 }
    ]
  });

  var activationByRegion = withContribution({
    dimension: 'Region',
    weightLabel: 'share of signups',
    segments: [
      { id: 'na', label: 'North America', sub: '', weight: 0.46, cur: 65.1, prev: 70.6 },
      { id: 'emea', label: 'EMEA', sub: '', weight: 0.34, cur: 63.8, prev: 69.3 },
      { id: 'apac', label: 'APAC', sub: '', weight: 0.20, cur: 61.9, prev: 67.5 }
    ]
  });

  // ---------------------------------------------------------------- funnel

  /* Signup -> activated, both periods. Identical until the final step, which
   * is what makes the anomaly legible rather than merely present. */
  var funnel = {
    steps: [
      { id: 'signup',    label: 'Signed up',            cur: 1284, prev: 1206 },
      { id: 'workspace', label: 'Created workspace',    cur: 1101, prev: 1037 },
      { id: 'connect',   label: 'Connected data',       cur: 953,  prev: 902 },
      { id: 'core',      label: 'Completed core action', cur: 822, prev: 839 }
    ]
  };

  funnel.rows = funnel.steps.map(function (s, i) {
    var prevStep = i === 0 ? null : funnel.steps[i - 1];
    var curStep = prevStep ? (s.cur / prevStep.cur) * 100 : 100;
    var prevStepRate = prevStep ? (s.prev / prevStep.prev) * 100 : 100;
    return Object.assign({}, s, {
      curCumulative: (s.cur / funnel.steps[0].cur) * 100,
      prevCumulative: (s.prev / funnel.steps[0].prev) * 100,
      curStepRate: curStep,
      prevStepRate: prevStepRate,
      stepDelta: curStep - prevStepRate,
      fromLabel: prevStep ? prevStep.label : null
    });
  });

  funnel.worstStep = funnel.rows.reduce(function (worst, r) {
    return (worst === null || r.stepDelta < worst.stepDelta) ? r : worst;
  }, null);

  // --------------------------------------------------------------- cohorts

  var cohorts = {
    label: 'Logo retention by signup month',
    periods: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'],
    rows: [
      { cohort: 'Mar 2026', size: 214, values: [100, 91, 87, 84, 82, 81] },
      { cohort: 'Apr 2026', size: 236, values: [100, 90, 86, 83, 81] },
      { cohort: 'May 2026', size: 258, values: [100, 91, 87, 84] },
      { cohort: 'Jun 2026', size: 271, values: [100, 89, 84] },
      { cohort: 'Jul 2026', size: 289, values: [100, 86] },
      { cohort: 'Aug 2026', size: 301, values: [100] }
    ]
  };

  // ---------------------------------------------------------- MRR movement

  var mrrMovement = {
    startLabel: 'MRR on ' + fmt.date(windowPrev30.to),
    endLabel: 'MRR on ' + fmt.date(window30.to),
    start: S.mrr[LAST - PERIOD],
    items: [
      { id: 'new', label: 'New', value: 26400, detail: '84 new accounts', sign: 1 },
      { id: 'expansion', label: 'Expansion', value: 15800, detail: 'Seat growth and upgrades', sign: 1 },
      { id: 'contraction', label: 'Contraction', value: -5900, detail: 'Downgrades and seat reductions', sign: -1 },
      { id: 'churn', label: 'Churn', value: -7400, detail: '61 accounts lost', sign: -1 }
    ]
  };
  mrrMovement.end = mrrMovement.start + mrrMovement.items.reduce(function (s, i) { return s + i.value; }, 0);
  mrrMovement.net = mrrMovement.end - mrrMovement.start;

  // ------------------------------------------------------- feature adoption

  var featureAdoption = {
    unitLabel: '% of active customers using the feature at least once in the period',
    items: [
      { id: 'analytics', label: 'Analytics', cur: 72, prev: 70 },
      { id: 'automation', label: 'Automation', cur: 61, prev: 57 },
      { id: 'integrations', label: 'Integrations', cur: 48, prev: 54 },
      { id: 'reports', label: 'Reports', cur: 42, prev: 41 },
      { id: 'assistant', label: 'AI Assistant', cur: 31, prev: 22 }
    ].map(function (x) { return Object.assign({}, x, { delta: x.cur - x.prev }); })
  };

  // ------------------------------------------------------- customer health

  var customerHealth = {
    total: 2240,
    prevTotal: 2180,
    bands: [
      { id: 'healthy', label: 'Healthy', tone: 'good', cur: 1523, prev: 1570, definition: 'Weekly active, no open escalation' },
      { id: 'watch', label: 'Watch', tone: 'warning', cur: 470, prev: 414, definition: 'Usage down 20%+ or support volume rising' },
      { id: 'risk', label: 'At risk', tone: 'critical', cur: 247, prev: 196, definition: 'Usage down 50%+, or renewal flagged' }
    ]
  };
  customerHealth.bands.forEach(function (b) {
    b.curShare = (b.cur / customerHealth.total) * 100;
    b.prevShare = (b.prev / customerHealth.prevTotal) * 100;
    b.shareDelta = b.curShare - b.prevShare;
  });

  // -------------------------------------------------------- support topics

  var supportTopics = {
    note: 'Conversations opened in the period, grouped by primary topic.',
    items: [
      { id: 'setup', label: 'Setup & onboarding', cur: 112, prev: 93 },
      { id: 'integrations', label: 'Integrations', cur: 76, prev: 64 },
      { id: 'bugs', label: 'Bugs', cur: 66, prev: 71 },
      { id: 'billing', label: 'Billing', cur: 52, prev: 50 },
      { id: 'reporting', label: 'Reporting', cur: 44, prev: 39 },
      { id: 'other', label: 'Other', cur: 34, prev: 24 }
    ].map(function (x) {
      return Object.assign({}, x, { delta: x.cur - x.prev, rel: ((x.cur - x.prev) / x.prev) * 100 });
    })
  };
  supportTopics.total = supportTopics.items.reduce(function (s, x) { return s + x.cur; }, 0);
  supportTopics.prevTotal = supportTopics.items.reduce(function (s, x) { return s + x.prev; }, 0);

  // ------------------------------------------------------- accounts at risk

  var accountsAtRisk = [
    { name: 'Northwind Logistics', seats: 240, mrr: 4800, segment: 'Mid-market', signal: 'Core action never completed after v4.2', health: 'risk', since: '2026-07-24' },
    { name: 'Bloomfield Studio', seats: 18, mrr: 540, segment: 'Small teams', signal: 'Stalled at data connection', health: 'risk', since: '2026-07-27' },
    { name: 'Cedar & Co', seats: 32, mrr: 960, segment: 'Small teams', signal: 'Stalled at data connection', health: 'risk', since: '2026-08-02' },
    { name: 'Halden Analytics', seats: 74, mrr: 2220, segment: 'Mid-market', signal: 'Support volume up 4x', health: 'watch', since: '2026-08-04' },
    { name: 'Pike Street Group', seats: 21, mrr: 630, segment: 'Small teams', signal: 'Stalled at data connection', health: 'risk', since: '2026-08-09' },
    { name: 'Vantage Retail', seats: 156, mrr: 3900, segment: 'Mid-market', signal: 'Usage down 38% since Jul 19', health: 'watch', since: '2026-08-11' }
  ];

  // ------------------------------------------------------------ the metrics

  function rateMetric(cfg) {
    var cur = meanCur(cfg.series), prev = meanPrev(cfg.series);
    return Object.assign({}, cfg, {
      value: cur, prev: prev, change: change(cur, prev, true), kind: 'rate',
      displaySeries: rolling(cfg.series, PERIOD),
      seriesNote: 'Trailing 30-day average — the same window the headline number uses.'
    });
  }

  function levelMetric(cfg) {
    var cur = cfg.series[LAST], prev = cfg.series[LAST - PERIOD];
    return Object.assign({}, cfg, {
      value: cur, prev: prev, change: change(cur, prev, false), kind: 'level',
      displaySeries: cfg.series
    });
  }

  var metrics = {};
  function def(m) { metrics[m.id] = m; return m; }

  def(levelMetric({
    id: 'mrr', label: 'MRR', longLabel: 'Monthly recurring revenue', domain: 'revenue',
    series: S.mrr, format: fmt.currency, formatPrecise: fmt.currencyPrecise,
    higherIsBetter: true, unit: 'currency',
    question: 'Are we growing?',
    pattern: 'sparkline',
    events: events,
    note: 'Contracted recurring revenue, normalised to a monthly value.'
  }));

  def({
    id: 'arr', label: 'ARR', longLabel: 'Annual recurring revenue', domain: 'revenue',
    kind: 'derived', value: S.mrr[LAST] * 12, prev: S.mrr[LAST - PERIOD] * 12,
    change: change(S.mrr[LAST] * 12, S.mrr[LAST - PERIOD] * 12, false),
    series: S.mrr.map(function (v) { return v * 12; }),
    displaySeries: S.mrr.map(function (v) { return v * 12; }),
    format: fmt.currency, higherIsBetter: true, unit: 'currency',
    pattern: 'goal',
    goal: { value: 6000000, label: 'Board plan, end of FY26', format: fmt.currency },
    question: 'Are we on plan?',
    note: 'MRR × 12. Not a forecast — the run rate as of today.'
  });

  def(levelMetric({
    id: 'nrr', label: 'Net revenue retention', longLabel: 'Net revenue retention', domain: 'revenue',
    series: S.nrr, format: function (v) { return v.toFixed(0) + '%'; },
    higherIsBetter: true, unit: 'percent-level',
    pattern: 'goal',
    goal: { value: 115, label: 'Company goal for FY26', format: function (v) { return v.toFixed(0) + '%'; } },
    question: 'Is the base expanding?',
    note: 'Trailing twelve months, expansion net of contraction and churn. A level, not a rate of the period — so its change is shown in points.'
  }));

  def(rateMetric({
    id: 'revenueChurn', label: 'Revenue churn', longLabel: 'Gross revenue churn', domain: 'revenue',
    series: S.revenueChurn, format: function (v) { return v.toFixed(2) + '%'; },
    higherIsBetter: false, unit: 'percent',
    pattern: 'context',
    question: 'Are we losing revenue faster?',
    note: 'Recurring revenue lost to churn and contraction, as a share of starting MRR.'
  }));

  def(rateMetric({
    id: 'activation', label: 'Activation', longLabel: 'Activation rate', domain: 'product',
    series: S.activation, format: fmt.percent, higherIsBetter: true, unit: 'percent',
    pattern: 'context',
    goal: { value: 70, label: 'Company goal for FY26', format: function (v) { return v.toFixed(0) + '%'; } },
    events: events,
    question: 'Is activation improving or deteriorating?',
    note: 'Share of signups that complete the core action within 14 days.'
  }));

  def(rateMetric({
    id: 'retention30', label: '30-day retention', longLabel: '30-day user retention', domain: 'product',
    series: S.retention30, format: fmt.percent, higherIsBetter: true, unit: 'percent',
    pattern: 'sparkline',
    question: 'Are new users sticking?',
    note: 'Share of new users still active 30 days after signup.'
  }));

  def(levelMetric({
    id: 'activeCustomers', label: 'Active customers', longLabel: 'Active customers', domain: 'customers',
    series: S.activeCustomers, format: fmt.count, higherIsBetter: true, unit: 'count',
    pattern: 'simple',
    question: 'How many customers do we have?',
    note: 'Paying accounts with at least one active user in the last 30 days.'
  }));

  def(rateMetric({
    id: 'customerChurn', label: 'Customer churn', longLabel: 'Monthly customer churn', domain: 'customers',
    series: S.customerChurn, format: function (v) { return v.toFixed(1) + '%'; },
    higherIsBetter: false, unit: 'percent',
    pattern: 'context',
    question: 'Are we losing more customers?',
    note: 'Accounts lost in the period as a share of accounts at the start of it.'
  }));

  def(rateMetric({
    id: 'csat', label: 'CSAT', longLabel: 'Customer satisfaction', domain: 'customers',
    series: S.csat, format: fmt.score, higherIsBetter: true, unit: 'score',
    pattern: 'simple',
    question: 'Are customers happier or unhappier?',
    note: 'Mean rating on resolved support conversations, out of 5.'
  }));

  def(rateMetric({
    id: 'setupConversations', label: 'Setup conversations', longLabel: 'Setup & onboarding conversations', domain: 'customers',
    series: S.setupTickets, format: function (v) { return Math.round(v * 30).toLocaleString('en-US'); },
    higherIsBetter: false, unit: 'count-rate',
    pattern: 'simple',
    question: 'What are customers struggling with?',
    note: 'Support conversations opened about setup and onboarding, per 30 days.'
  }));

  // ------------------------------------------------------------ the signals
  // What NORTH has detected. A signal is attached to a metric, so the metric's
  // card can carry the mark and open the investigation behind it.

  var signals = [
    {
      id: 'sig-activation',
      metricId: 'activation',
      severity: 'critical',
      detectedOn: '2026-07-22',
      changedOn: S.dates[S.declineStartIndex],
      headline: 'Activation is down 5.6pp and the decline is concentrated in one funnel step.',
      short: 'NORTH detected a significant change',
      investigationId: 'inv-activation'
    },
    {
      id: 'sig-churn',
      metricId: 'customerChurn',
      severity: 'serious',
      detectedOn: '2026-08-03',
      changedOn: '2026-07-25',
      headline: 'Customer churn rose to 3.1%, above its twelve-month range.',
      short: 'Above its normal range',
      investigationId: 'inv-activation'
    },
    {
      id: 'sig-support',
      metricId: 'setupConversations',
      severity: 'warning',
      detectedOn: '2026-07-28',
      changedOn: '2026-07-20',
      headline: 'Setup conversations up 20% — the sharpest topic move this period.',
      short: 'Rising faster than any other topic',
      investigationId: 'inv-activation'
    }
  ];

  var signalByMetric = {};
  signals.forEach(function (s) { signalByMetric[s.metricId] = s; });

  // ------------------------------------------------------ the investigation
  // Each step is a question, and the question chooses the visualisation. The
  // chart type follows the business question, not the other way round.

  var investigations = {
    'inv-activation': {
      id: 'inv-activation',
      metricId: 'activation',
      title: 'Activation fell 5.6pp over the last 30 days',
      asked: 'Why did activation drop?',
      summary: 'Activation averaged ' + fmt.percent(meanCur(S.activation)) + ' over the last 30 days against ' +
        fmt.percent(meanPrev(S.activation)) + ' in the 30 days before — a fall of ' +
        fmt.pp(meanCur(S.activation) - meanPrev(S.activation)) + ' (' +
        fmt.rel(((meanCur(S.activation) - meanPrev(S.activation)) / meanPrev(S.activation)) * 100) + ' relative). ' +
        'The decline is concentrated in small teams and in one funnel step.',
      steps: [
        {
          id: 'when', question: 'When did it begin?', viz: 'timeseries',
          answer: 'The series holds around 70–71% until ' + fmt.dateLong(S.dates[S.declineStartIndex]) +
            ', then falls over about three weeks and flattens near 64%. It is a step, not a drift — ' +
            'which points at something that changed on a date rather than a slow erosion.'
        },
        {
          id: 'where', question: 'Which segment caused it?', viz: 'segments',
          answer: 'Small teams fell ' + fmt.pp(activationByCompanySize.segments[2].delta) + '. Enterprise and mid-market each moved about a point. ' +
            'Holding the signup mix constant, small teams account for ' +
            Math.round(activationByCompanySize.segments[2].shareOfChange) + '% of the blended decline.'
        },
        {
          id: 'step', question: 'At which step?', viz: 'funnel',
          answer: 'Signup → workspace and workspace → connected data are within half a point of the previous period. ' +
            funnel.worstStep.fromLabel + ' → ' + funnel.worstStep.label.toLowerCase() + ' fell from ' +
            fmt.percent(funnel.worstStep.prevStepRate) + ' to ' + fmt.percent(funnel.worstStep.curStepRate) +
            '. Users are connecting their data and then not finishing.'
        },
        {
          id: 'retention', question: 'Is it affecting retention?', viz: 'cohorts',
          answer: 'The July cohort retained 86% at month one against 89–91% for every cohort before it. ' +
            'One month of data is thin — treat it as early, not established.'
        },
        {
          id: 'who', question: 'Which customers?', viz: 'accounts',
          answer: 'Six accounts worth ' + fmt.currencyPrecise(accountsAtRisk.reduce(function (s, a) { return s + a.mrr; }, 0)) +
            ' of MRR moved to watch or at risk in this window, four of them stalled at the same step.'
        },
        {
          id: 'together', question: 'What changed at the same time?', viz: 'correlates',
          answer: 'Five things move together in this window — one release and four metrics. ' +
            'NORTH can show that they coincide; it cannot show that one caused another.'
        }
      ],
      correlates: [
        { label: 'v4.2 integrations release', detail: 'Connector auth flow replaced', on: '2026-07-16', kind: 'event' },
        { label: 'Activation begins falling', detail: 'Three days after the release', on: S.dates[S.declineStartIndex], kind: 'metric' },
        { label: 'Setup conversations rise', detail: '+20% vs the previous 30 days', on: '2026-07-20', kind: 'metric' },
        { label: 'Integrations adoption falls', detail: '54% → 48% of active customers', on: '2026-07-24', kind: 'metric' },
        { label: 'Customer churn rises', detail: '2.4% → 3.1%', on: '2026-07-25', kind: 'metric' }
      ],
      caution: 'These five moves coincide within nine days. That is evidence of a shared cause, not proof of one — ' +
        'the v4.2 release is the strongest candidate because it changed the exact step where users are now stalling, ' +
        'but nothing here rules out a seasonal or mix effect. Confirming it means looking at the step itself.',
      evidence: [
        { source: 'Amplitude', detail: 'Funnel and segment rates, 1,284 signups', updated: '2 hours ago' },
        { source: 'Intercom', detail: '384 conversations classified by topic', updated: '40 minutes ago' },
        { source: 'Stripe', detail: 'MRR movement and churned accounts', updated: '6 hours ago' },
        { source: 'Linear', detail: 'v4.2 release date and scope', updated: 'Yesterday' }
      ],
      recommended: [
        { label: 'Investigate integration-step abandonment', detail: 'Session replays for the ' + (funnel.worstStep.prev !== undefined ? (funnel.steps[2].cur - funnel.steps[3].cur) : 0) + ' signups that connected data and stopped.' },
        { label: 'Compare v4.2 and v4.1 connector flows', detail: 'Completion rate by connector type, before and after Jul 16.' },
        { label: 'Check whether small teams hit a different flow', detail: 'Whether the new auth step differs by plan.' }
      ],
      relatedSignals: [
        { metricId: 'setupConversations', note: 'Setup support conversations' },
        { metricId: 'customerChurn', note: 'New-customer churn' },
        { metricId: 'retention30', note: '30-day retention' }
      ]
    }
  };

  /* The context line on a pattern-3 card. Derived, never asserted: each one
   * is a fact the data can produce on demand. */
  function contextFor(id) {
    var bd = activationByCompanySize;
    var lead = bd.segments.reduce(function (a, b) { return Math.abs(b.contribution) > Math.abs(a.contribution) ? b : a; });
    switch (id) {
      case 'activation':
        return { lead: 'Mostly driven by',
          body: lead.label + ' ' + fmt.pp(lead.delta) + ' — ' + Math.round(lead.shareOfChange) + '% of the decline.' };
      case 'customerChurn':
        return { lead: 'Concentrated in', body: 'Accounts under six months old. Revenue churn moved less, so the accounts lost are small.' };
      case 'revenueChurn':
        return { lead: 'Rising more slowly than logo churn', body: 'The accounts leaving are small: 3.1% of customers, 1.85% of revenue.' };
      case 'csat':
        return { lead: 'Driven by', body: 'Setup and onboarding conversations, the topic growing fastest this period.' };
      case 'mrr':
        return { lead: 'Where it came from', body: 'New and expansion added $42.2K; churn and contraction removed $13.3K.' };
      case 'activeCustomers':
        return { lead: 'Net of', body: '84 accounts won, 61 lost. Growth is slowing as churn rises.' };
      case 'nrr':
        return { lead: 'Expansion is', body: 'still covering churn — $15.8K added against $13.3K lost this period.' };
      case 'retention30':
        return { lead: 'Tracking', body: 'The activation decline — the July cohort is the first to retain below 89%.' };
      default: return null;
    }
  }

  // ---------------------------------------------------------------- domains

  var domains = [
    {
      id: 'revenue', label: 'Revenue',
      question: 'What actually changed our MRR?',
      headline: ['mrr', 'arr', 'nrr', 'revenueChurn']
    },
    {
      id: 'product', label: 'Product',
      question: 'Where are users getting stuck?',
      headline: ['activation', 'retention30']
    },
    {
      id: 'customers', label: 'Customers',
      question: 'Who is at risk, and what are they struggling with?',
      headline: ['activeCustomers', 'customerChurn', 'csat']
    }
  ];

  global.NORTH = {
    series: S,
    LAST: LAST,
    PERIOD: PERIOD,
    fmt: fmt,
    change: change,
    rolling: rolling,
    contextFor: contextFor,
    window30: window30,
    windowPrev30: windowPrev30,
    metrics: metrics,
    domains: domains,
    events: events,
    signals: signals,
    signalByMetric: signalByMetric,
    investigations: investigations,
    breakdowns: {
      activation: {
        'Company size': activationByCompanySize,
        'Plan': activationByPlan,
        'Region': activationByRegion
      }
    },
    funnel: funnel,
    cohorts: cohorts,
    mrrMovement: mrrMovement,
    featureAdoption: featureAdoption,
    customerHealth: customerHealth,
    supportTopics: supportTopics,
    accountsAtRisk: accountsAtRisk
  };
})(typeof window !== 'undefined' ? window : globalThis);
