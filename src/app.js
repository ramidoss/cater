/* NORTH — the application.
 *
 * Three surfaces, deliberately different in density:
 *   Overview      large values, change, one primary graph per domain, signals.
 *   Detail        the full apparatus — trends, funnels, cohorts, breakdowns.
 *   Investigation the visualisation follows the question being asked.
 *
 * The NORTH panel is not a second product bolted to the side of a dashboard.
 * A card that carries a signal, the mark on the chart, and the panel are three
 * views of the same object, and any of them opens the other two.
 */
(function (global) {
  'use strict';

  var N = global.NORTH, V = global.Viz, MC = global.MetricCard;
  var h = V.h, fmt = N.fmt;
  var S = N.series;

  var state = {
    view: 'overview',      // overview | domain | metric | investigation
    domainId: null,
    metricId: null,
    invId: null,
    invStep: 'when',
    compare: false,
    dimension: 'Company size',
    panelOpen: true,
    context: null          // what the panel is currently talking about
  };

  var root, mainEl, panelEl, navEl;

  // ------------------------------------------------------------- navigation

  function go(next) {
    Object.assign(state, next);
    if (next.view) window.scrollTo({ top: 0, behavior: 'instant' });
    render();
  }
  function openMetric(id) { go({ view: 'metric', metricId: id, context: null }); }
  function openInvestigation(id, step) {
    go({ view: 'investigation', invId: id, invStep: step || 'when', panelOpen: true, context: null });
  }

  // --------------------------------------------------------- shared pieces

  var PERIOD_LABEL = 'vs previous 30 days';

  function periodSentence() {
    return fmt.dateLong(N.window30.from) + ' – ' + fmt.dateLong(N.window30.to) +
      ', against ' + fmt.date(N.windowPrev30.from) + ' – ' + fmt.date(N.windowPrev30.to) + '.';
  }

  var contextFor = N.contextFor;

  function metricCard(id, opts) {
    opts = opts || {};
    var m = N.metrics[id];
    return MC.card(m, Object.assign({
      signal: N.signalByMetric[id],
      context: contextFor(id),
      comparisonLabel: PERIOD_LABEL,
      onOpen: function () {
        var sig = N.signalByMetric[id];
        if (sig && opts.signalOpensInvestigation) openInvestigation(sig.investigationId);
        else openMetric(id);
      }
    }, opts));
  }

  function sectionHead(title, question, goLabel, onGo) {
    return h('div', { class: 'section-head' }, [
      h('h2', { text: title }),
      question ? h('span', { class: 'q', text: question }) : null,
      onGo ? h('button', { class: 'go', type: 'button', text: goLabel, onclick: onGo }) : null
    ]);
  }

  function card(kids, cls) { return h('div', { class: 'card' + (cls ? ' ' + cls : '') }, kids); }

  /* A chart card that can tell the panel what it is about, so "Ask NORTH"
   * is contextual to the visualisation the reader is looking at. */
  function chartCard(figureEl, ctx) {
    var c = card([figureEl]);
    if (ctx) {
      c.tabIndex = 0;
      c.addEventListener('click', function () { if (state.context !== ctx.id) { state.context = ctx; renderPanel(); } });
      c.addEventListener('focusin', function () { state.context = ctx; renderPanel(); });
    }
    return c;
  }

  // ----------------------------------------------------------- trend chart

  function trendChart(id, opts) {
    opts = opts || {};
    var m = N.metrics[id];
    var days = opts.days || 120;
    var src = m.displaySeries || m.series;
    var dates = S.dates.slice(-days);
    var vals = src.slice(-days);
    var series = [{ id: 'cur', label: 'This period', values: vals, color: 'var(--series-1)', fill: true }];

    // The previous-period overlay is deliberately secondary: thinner, dashed,
    // in the de-emphasis hue. It is context for the current line, not a rival.
    if (state.compare && opts.comparable !== false) {
      var shifted = [], off = N.PERIOD;
      for (var i = 0; i < vals.length; i++) {
        var srcIndex = src.length - vals.length + i - off;
        shifted.push(src[Math.max(0, srcIndex)]);
      }
      series.push({ id: 'prev', label: 'Shifted back 30 days', values: shifted, color: 'var(--de-emphasis)', dashed: true, muted: true });
    }

    var sig = N.signalByMetric[id];
    return V.lineChart({
      title: opts.title || m.longLabel,
      question: opts.question || m.question,
      caption: opts.caption || m.seriesNote,
      dates: dates,
      series: series,
      format: function (v, isAxis) { return isAxis && m.unit === 'currency' ? fmt.currency(v) : m.format(v); },
      xFormat: function (d) { return fmt.date(d); },
      height: opts.height || 210,
      goal: opts.goal && m.goal ? { value: m.goal.value, label: 'Goal ' + (m.goal.format || m.format)(m.goal.value) } : null,
      annotations: opts.annotations === false ? [] : (m.events || []).filter(function (e) { return dates.indexOf(e.date) >= 0; }),
      anomaly: sig && opts.anomaly !== false ? {
        date: sig.changedOn,
        label: 'NORTH: change detected',
        detail: 'Change begins here. Open investigation.',
        onOpen: function () { openInvestigation(sig.investigationId, 'when'); }
      } : null
    });
  }

  // ------------------------------------------------------------- OVERVIEW
  // Large values, change, one primary graph per domain at most, and NORTH's
  // signals. No cohorts, no funnels, no dense tables — those are detail.

  function viewOverview() {
    var out = h('div', {});
    var topSignal = N.signals[0];

    out.appendChild(h('div', { class: 'section' }, [
      sectionHead('What changed', 'The things NORTH thinks are worth your attention today'),
      h('div', { class: 'grid grid-2-wide' }, [
        signalHero(topSignal),
        h('div', { class: 'grid', style: 'gap:12px' }, N.signals.slice(1).map(signalRow))
      ])
    ]));

    // Revenue — the question is "are we growing?", so a trend, and the
    // movement bridge lives one level down where there is room for it.
    out.appendChild(h('div', { class: 'section' }, [
      sectionHead('Revenue', 'Are we growing?', 'Revenue detail →', function () { go({ view: 'domain', domainId: 'revenue' }); }),
      h('div', { class: 'grid grid-4', style: 'margin-bottom:12px' }, [
        metricCard('mrr'), metricCard('arr'), metricCard('nrr'), metricCard('revenueChurn')
      ]),
      chartCard(trendChart('mrr', { days: 180, height: 190, question: 'Are we growing, and did anything move the line?' }), {
        id: 'mrr-trend', title: 'MRR, last 180 days', metricId: 'mrr',
        questions: [
          { label: 'What actually changed our MRR?', go: function () { go({ view: 'domain', domainId: 'revenue' }); } },
          { label: 'Did the pricing change help?', go: function () { openMetric('mrr'); } },
          { label: 'Is churn eating into growth?', go: function () { openMetric('revenueChurn'); } }
        ]
      })
    ]));

    // Product — activation is where the change is, so it leads and carries
    // both the context line and the signal.
    out.appendChild(h('div', { class: 'section' }, [
      sectionHead('Product', 'Is activation improving or deteriorating?', 'Product detail →', function () { go({ view: 'domain', domainId: 'product' }); }),
      h('div', { class: 'grid grid-4', style: 'margin-bottom:12px' }, [
        metricCard('activation', { className: 'is-wide', signalOpensInvestigation: false }),
        metricCard('retention30'),
        h('div', { class: 'card span-2' }, [miniFunnelSummary()])
      ]),
      chartCard(trendChart('activation', { days: 120, height: 190, goal: true }), {
        id: 'activation-trend', title: 'Activation, last 120 days', metricId: 'activation',
        questions: [
          { label: 'Why did activation drop?', go: function () { openInvestigation('inv-activation', 'where'); } },
          { label: 'Which segment caused the decline?', go: function () { openInvestigation('inv-activation', 'where'); } },
          { label: 'When did the decline start?', go: function () { openInvestigation('inv-activation', 'when'); } },
          { label: 'What changed at the same time?', go: function () { openInvestigation('inv-activation', 'together'); } }
        ]
      })
    ]));

    // Customers — health is a strip, not a graph, so the domain's one graph
    // is the thing that actually changed: which problem is growing.
    out.appendChild(h('div', { class: 'section' }, [
      sectionHead('Customers', 'Who is at risk, and what are they struggling with?', 'Customer detail →', function () { go({ view: 'domain', domainId: 'customers' }); }),
      h('div', { class: 'grid grid-4', style: 'margin-bottom:12px' }, [
        metricCard('activeCustomers'), metricCard('customerChurn'), metricCard('csat'),
        card([healthStrip()])
      ]),
      chartCard(supportTopicFigure(), {
        id: 'support-topics', title: 'Support topics', metricId: 'setupConversations',
        questions: [
          { label: 'Are setup problems related to activation?', go: function () { openInvestigation('inv-activation', 'together'); } },
          { label: 'Which accounts are affected?', go: function () { openInvestigation('inv-activation', 'who'); } }
        ]
      })
    ]));

    return out;
  }

  function supportTopicFigure() {
    return V.topicDeltas({
      title: 'Support conversations by topic',
      question: 'What are customers struggling with that they were not before?',
      items: N.supportTopics.items,
      higherIsBetter: false,
      residualId: 'other',
      caption: N.supportTopics.total.toLocaleString('en-US') + ' conversations this period against ' +
        N.supportTopics.prevTotal.toLocaleString('en-US') + '. The total is not the interesting part: ' +
        'setup is growing fastest, and it is the topic nearest the funnel step that broke. ' +
        'The unclassified remainder (' + (N.supportTopics.items.filter(function (i) { return i.id === 'other'; })[0].cur) +
        ' conversations) is in the table rather than the chart — it is a residue, not a problem.'
    });
  }

  function signalHero(sig) {
    var m = N.metrics[sig.metricId];
    var p = MC.changeParts(m);
    return h('button', {
      class: 'sig', type: 'button', style: 'padding:18px 20px',
      onclick: function () { openInvestigation(sig.investigationId); }
    }, [
      h('div', { class: 'sig-top' }, [
        h('span', { class: 'north-dot' }),
        h('span', { class: 'sig-sev sev-' + sig.severity, text: sig.severity === 'critical' ? 'Needs attention' : 'Worth a look' }),
        h('span', { class: 'sig-when', text: 'Detected ' + fmt.date(sig.detectedOn) })
      ]),
      h('div', { class: 'sig-head', style: 'font-size:16px', text: sig.headline }),
      h('div', { class: 'stat-row', style: 'margin-top:14px' }, [
        h('div', { class: 'stat' }, [
          h('div', { class: 'stat-lab', text: m.label }),
          h('div', { class: 'stat-val', text: m.format(m.value) })
        ]),
        h('div', { class: 'stat' }, [
          h('div', { class: 'stat-lab', text: 'Change' }),
          h('div', { class: 'stat-val', text: p.primary + '  ' }),
        ]),
        h('div', { class: 'stat' }, [
          h('div', { class: 'stat-lab', text: 'Began' }),
          h('div', { class: 'stat-val', text: fmt.date(sig.changedOn) })
        ])
      ]),
      h('div', { class: 'sig-foot', text: 'Open investigation →' })
    ]);
  }

  function signalRow(sig) {
    var m = N.metrics[sig.metricId];
    return h('button', { class: 'sig', type: 'button', onclick: function () { openInvestigation(sig.investigationId); } }, [
      h('div', { class: 'sig-top' }, [
        h('span', { class: 'north-dot' }),
        h('span', { class: 'sig-sev sev-' + sig.severity, text: m.label }),
        h('span', { class: 'sig-when', text: fmt.date(sig.detectedOn) })
      ]),
      h('div', { class: 'sig-head', style: 'font-size:12.5px', text: sig.headline })
    ]);
  }

  /* A compact funnel summary, not a funnel. The overview says which step
   * broke; the shape of the whole funnel is a detail-page job. */
  function miniFunnelSummary() {
    var w = N.funnel.worstStep;
    return h('div', {}, [
      h('div', { class: 'mcard-head' }, [h('span', { class: 'mcard-label', text: 'Where activation is lost' })]),
      h('div', { style: 'font-size:15px;line-height:1.45;margin-top:2px' }, [
        document.createTextNode(w.fromLabel + ' → '),
        h('strong', { text: w.label.toLowerCase() })
      ]),
      h('div', { class: 'chg is-bad', style: 'margin-top:8px' }, [
        h('span', { class: 'chg-arrow', text: '↓' }),
        h('span', { class: 'chg-primary', text: fmt.pp(w.stepDelta) }),
        h('span', { class: 'chg-secondary', text: w.prevStepRate.toFixed(1) + '% → ' + w.curStepRate.toFixed(1) + '%' })
      ]),
      h('div', { class: 'mcard-vs', text: 'Every other step is within 0.5pp of the previous 30 days' }),
      h('button', {
        class: 'ctl', style: 'margin-top:12px', type: 'button', text: 'See the funnel →',
        onclick: function () { openInvestigation('inv-activation', 'step'); }
      })
    ]);
  }

  function healthStrip() {
    var ch = N.customerHealth;
    var risk = ch.bands[2];
    return h('div', {}, [
      h('div', { class: 'mcard-head' }, [h('span', { class: 'mcard-label', text: 'Customer health' })]),
      h('div', { style: 'display:flex;height:8px;gap:2px;margin:10px 0 10px' }, ch.bands.map(function (b) {
        var d = h('div', { title: b.label + ' ' + b.curShare.toFixed(0) + '%' });
        d.style.cssText = 'flex:' + b.cur + ';border-radius:3px;background:var(--' + b.tone + ')';
        return d;
      })),
      h('div', { style: 'display:flex;flex-direction:column;gap:3px' }, ch.bands.map(function (b) {
        return h('div', { style: 'display:flex;align-items:center;gap:7px;font-size:12px' }, [
          h('span', { style: 'width:7px;height:7px;border-radius:50%;flex:none;background:var(--' + b.tone + ')' }),
          h('span', { text: b.label }),
          h('span', { style: 'margin-left:auto;font-variant-numeric:tabular-nums', text: b.curShare.toFixed(0) + '%' }),
          h('span', {
            class: 'sg-delta ' + ((b.tone === 'good') === (b.shareDelta >= 0) ? 'is-good' : 'is-bad'),
            style: 'font-size:11.5px;min-width:44px;text-align:right;color:' +
              ((b.tone === 'good') === (b.shareDelta >= 0) ? 'var(--good-text)' : 'var(--critical-text)'),
            text: (b.shareDelta > 0 ? '+' : '−') + Math.abs(b.shareDelta).toFixed(1) + 'pp'
          })
        ]);
      })),
      h('div', { class: 'mcard-vs', style: 'margin-top:8px', text: risk.cur.toLocaleString('en-US') + ' accounts at risk, up ' + (risk.cur - risk.prev) })
    ]);
  }

  global.NorthApp = { state: state, go: go, openMetric: openMetric, openInvestigation: openInvestigation,
    metricCard: metricCard, sectionHead: sectionHead, card: card, chartCard: chartCard,
    trendChart: trendChart, contextFor: contextFor, viewOverview: viewOverview, supportTopicFigure: supportTopicFigure,
    periodSentence: periodSentence, PERIOD_LABEL: PERIOD_LABEL,
    _setRefs: function (r) { root = r.root; mainEl = r.main; panelEl = r.panel; navEl = r.nav; },
    _render: function (fn) { render = fn; }, healthStrip: healthStrip };

  var render = function () {};
  var renderPanel = function () {};
  global.NorthApp._bind = function (r, p) { render = r; renderPanel = p; };
})(typeof window !== 'undefined' ? window : globalThis);
