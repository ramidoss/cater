/* NORTH — detail surfaces, the investigation, and the panel. */
(function (global) {
  'use strict';

  var N = global.NORTH, V = global.Viz, MC = global.MetricCard, A = global.NorthApp;
  var h = V.h, fmt = N.fmt, S = N.series, state = A.state;
  var metricCard = A.metricCard, sectionHead = A.sectionHead, card = A.card,
      chartCard = A.chartCard, trendChart = A.trendChart;

  // ------------------------------------------------------------ DOMAIN: revenue

  function viewRevenue() {
    return h('div', {}, [
      h('div', { class: 'section' }, [
        h('div', { class: 'grid grid-4' }, [
          metricCard('mrr'), metricCard('arr'), metricCard('nrr'), metricCard('revenueChurn')
        ])
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Trend', 'Are we growing?'),
        chartCard(trendChart('mrr', { days: 180, height: 230 }), {
          id: 'mrr-trend', title: 'MRR trend', metricId: 'mrr',
          questions: [
            { label: 'What actually changed our MRR?', go: function () { document.getElementById('mrr-bridge').scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
            { label: 'Did the pricing change move the line?', go: function () { A.go({ compare: true }); } }
          ]
        })
      ]),
      h('div', { class: 'section', id: 'mrr-bridge' }, [
        sectionHead('Movement', 'What actually changed our MRR?'),
        h('div', { class: 'grid grid-2-wide' }, [
          chartCard(V.bridge({
            title: 'MRR movement, last 30 days',
            question: 'A second revenue line answers nothing this does not. This one names the parts.',
            start: N.mrrMovement.start, end: N.mrrMovement.end,
            startLabel: N.mrrMovement.startLabel, endLabel: N.mrrMovement.endLabel,
            items: N.mrrMovement.items,
            format: fmt.currencyPrecise,
            height: 200,
            caption: 'Net ' + fmt.currencyPrecise(N.mrrMovement.net) + ' (' + fmt.rel((N.mrrMovement.net / N.mrrMovement.start) * 100) +
              '). New and expansion together add ' + fmt.currencyPrecise(N.mrrMovement.items[0].value + N.mrrMovement.items[1].value) +
              '; churn and contraction remove ' + fmt.currencyPrecise(Math.abs(N.mrrMovement.items[2].value + N.mrrMovement.items[3].value)) +
              '. Only the movements are drawn as bars — they measure differences, so the window sits where the differences are legible. ' +
              'The two totals are written out rather than drawn as truncated bars.'
          }), {
            id: 'mrr-bridge', title: 'MRR movement', metricId: 'mrr',
            questions: [
              { label: 'Which accounts churned?', go: function () { A.go({ view: 'domain', domainId: 'customers' }); } },
              { label: 'Is churn concentrated in a segment?', go: function () { A.openInvestigation('inv-activation', 'where'); } }
            ]
          }),
          card([
            h('h4', { class: 'viz-title', text: 'Read this way' }),
            h('p', { class: 'note', style: 'margin-top:10px' , text:
              'Gross revenue churn is ' + N.metrics.revenueChurn.format(N.metrics.revenueChurn.value) +
              ' against customer churn of ' + N.metrics.customerChurn.format(N.metrics.customerChurn.value) + '. ' +
              'More customers are leaving than before, but they are small ones — the revenue effect is a third of the logo effect.' }),
            h('p', { class: 'note', style: 'margin-top:10px', text:
              'Net revenue retention is ' + N.metrics.nrr.format(N.metrics.nrr.value) + ', ' +
              MC.changeParts(N.metrics.nrr).primary + ' ' + A.PERIOD_LABEL + '. Expansion is still covering churn, ' +
              'which is why MRR grew ' + MC.changeParts(N.metrics.mrr).primary + ' in a period where churn rose.' }),
            h('div', { style: 'margin-top:14px' }, [
              h('button', { class: 'ctl', type: 'button', text: 'Open MRR detail →', onclick: function () { A.openMetric('mrr'); } })
            ])
          ])
        ])
      ])
    ]);
  }

  // ------------------------------------------------------------ DOMAIN: product

  function viewProduct() {
    return h('div', {}, [
      h('div', { class: 'section' }, [
        h('div', { class: 'grid grid-4' }, [
          metricCard('activation'), metricCard('retention30'),
          h('div', { class: 'card span-2' }, [featureAdoptionMini()])
        ])
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Trend', 'Is activation improving or deteriorating?'),
        chartCard(trendChart('activation', { days: 150, height: 230, goal: true }), {
          id: 'activation-trend', title: 'Activation trend', metricId: 'activation',
          questions: activationQuestions()
        })
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Where it is lost', 'At which step do signups stop?'),
        chartCard(funnelFigure(), {
          id: 'funnel', title: 'Activation funnel', metricId: 'activation',
          questions: [
            { label: 'Which segment stalls at this step?', go: function () { A.openInvestigation('inv-activation', 'where'); } },
            { label: 'What changed at the same time?', go: function () { A.openInvestigation('inv-activation', 'together'); } }
          ]
        })
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Retention', 'Are cohorts retaining better or worse?'),
        h('div', { class: 'grid grid-2-wide' }, [
          chartCard(cohortFigure(), {
            id: 'cohorts', title: 'Retention cohorts', metricId: 'retention30',
            questions: [{ label: 'Is the July cohort an outlier?', go: function () { A.openInvestigation('inv-activation', 'retention'); } }]
          }),
          chartCard(V.rankedBars({
            title: 'Feature adoption',
            question: 'Which features are being adopted, and which are slipping?',
            items: N.featureAdoption.items,
            dimension: 'Feature',
            caption: 'Integrations is the only feature down this period — ' +
              fmt.pp(N.featureAdoption.items[2].delta) + ' — and it sits on the step where activation is now failing. ' +
              'Ranked bars rather than a pie: these are five independent rates, not five parts of one whole.'
          }), {
            id: 'adoption', title: 'Feature adoption', metricId: 'activation',
            questions: [{ label: 'Did integrations adoption fall with activation?', go: function () { A.openInvestigation('inv-activation', 'together'); } }]
          })
        ])
      ])
    ]);
  }

  function featureAdoptionMini() {
    var down = N.featureAdoption.items.filter(function (i) { return i.delta < 0; });
    var up = N.featureAdoption.items.slice().sort(function (a, b) { return b.delta - a.delta; })[0];
    return h('div', {}, [
      h('div', { class: 'mcard-head' }, [h('span', { class: 'mcard-label', text: 'Feature adoption' })]),
      h('div', { style: 'display:flex;flex-direction:column;gap:5px;margin-top:6px' },
        N.featureAdoption.items.map(function (i) {
          return h('div', { style: 'display:flex;align-items:center;gap:8px;font-size:12.5px' }, [
            h('span', { style: 'min-width:88px', text: i.label }),
            h('span', { style: 'flex:1;height:6px;border-radius:3px;background:var(--de-emphasis-soft);overflow:hidden' }, [
              (function () { var b = h('span'); b.style.cssText = 'display:block;height:100%;border-radius:3px;background:var(--series-1);width:' + i.cur + '%'; return b; })()
            ]),
            h('span', { style: 'font-variant-numeric:tabular-nums;min-width:30px;text-align:right', text: i.cur + '%' }),
            h('span', {
              style: 'font-variant-numeric:tabular-nums;min-width:38px;text-align:right;font-size:11.5px;color:' +
                (i.delta >= 0 ? 'var(--good-text)' : 'var(--critical-text)'),
              text: (i.delta > 0 ? '+' : i.delta < 0 ? '−' : '') + Math.abs(i.delta) + 'pp'
            })
          ]);
        })),
      h('div', { class: 'mcard-vs', style: 'margin-top:10px', text:
        down.length ? down[0].label + ' is the only one down; ' + up.label + ' is up ' + up.delta + 'pp' : 'All features up this period' })
    ]);
  }

  function funnelFigure() {
    return V.funnel({
      title: 'Signup to activation, last 30 days',
      question: 'At which step do signups stop?',
      rows: N.funnel.rows,
      worstId: N.funnel.worstStep.id
    });
  }

  function cohortFigure() {
    return V.cohortGrid({
      title: N.cohorts.label,
      question: 'Are cohorts retaining better or worse?',
      periods: N.cohorts.periods, rows: N.cohorts.rows,
      caption: 'July retained 86% at month one against 89–91% for every cohort before it. ' +
        'One month of data on one cohort is thin — NORTH reports it as early, not established.'
    });
  }

  // ---------------------------------------------------------- DOMAIN: customers

  function viewCustomers() {
    return h('div', {}, [
      h('div', { class: 'section' }, [
        h('div', { class: 'grid grid-3' }, [
          metricCard('activeCustomers'), metricCard('customerChurn'), metricCard('csat')
        ])
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Health', 'How is the base distributed, and which way is it moving?'),
        chartCard(V.distribution({
          title: 'Customer health',
          question: 'How is the base distributed, and which way is it moving?',
          bands: N.customerHealth.bands,
          caption: 'A segmented bar rather than a donut: three bands of one base, read left to right, ' +
            'with the change in share stated rather than left to be inferred from two rings. ' +
            N.customerHealth.bands[2].cur + ' accounts are at risk, ' +
            (N.customerHealth.bands[2].cur - N.customerHealth.bands[2].prev) + ' more than the previous period.'
        }), {
          id: 'health', title: 'Customer health', metricId: 'customerChurn',
          questions: [{ label: 'Which accounts moved to at risk?', go: function () { A.openInvestigation('inv-activation', 'who'); } }]
        })
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Problems', 'What is changing in what customers ask us?'),
        h('div', { class: 'grid grid-2' }, [
          chartCard(A.supportTopicFigure(), {
            id: 'support-topics', title: 'Support topics', metricId: 'setupConversations',
            questions: [{ label: 'Are setup problems related to activation?', go: function () { A.openInvestigation('inv-activation', 'together'); } }]
          }),
          chartCard(trendChart('customerChurn', { days: 150, height: 200, annotations: false }), {
            id: 'churn-trend', title: 'Customer churn', metricId: 'customerChurn',
            questions: [{ label: 'When did churn start rising?', go: function () { A.openInvestigation('inv-activation', 'when'); } }]
          })
        ])
      ]),
      h('div', { class: 'section' }, [
        sectionHead('Accounts', 'Which customers moved to watch or at risk?'),
        card([accountsTable()])
      ])
    ]);
  }

  function accountsTable() {
    return h('table', { class: 'tbl' }, [
      h('thead', {}, [h('tr', {}, ['Account', 'Segment', 'Seats', 'MRR', 'What NORTH sees', 'Status'].map(function (c, i) {
        return h('th', { scope: 'col', class: (i === 2 || i === 3) ? 'num' : '', text: c });
      }))]),
      h('tbody', {}, N.accountsAtRisk.map(function (a) {
        return h('tr', {}, [
          h('th', { scope: 'row', text: a.name }),
          h('td', { text: a.segment }),
          h('td', { class: 'num', text: String(a.seats) }),
          h('td', { class: 'num', text: fmt.currencyPrecise(a.mrr) }),
          h('td', { text: a.signal }),
          h('td', {}, [h('span', { class: 'pill tone-' + (a.health === 'risk' ? 'critical' : 'warning'), text: a.health === 'risk' ? 'At risk' : 'Watch' })])
        ]);
      }))
    ]);
  }

  // ------------------------------------------------------------ METRIC DETAIL
  // The sequence the brief asks for: value and change, then the trend, then
  // what NORTH found, then the breakdown, the funnel, related signals,
  // evidence, and what to look at next.

  function viewMetric(id) {
    var m = N.metrics[id];
    var sig = N.signalByMetric[id];
    var inv = sig ? N.investigations[sig.investigationId] : null;
    var p = MC.changeParts(m);
    var out = h('div', {});

    out.appendChild(h('div', { class: 'section' }, [
      h('div', { class: 'grid grid-2-wide' }, [
        card([
          h('div', { class: 'mcard-head' }, [h('span', { class: 'mcard-label', text: m.longLabel })]),
          h('div', { class: 'mcard-value is-hero', text: m.format(m.value) }),
          MC.changeEl(m),
          h('div', { class: 'mcard-vs', text: A.PERIOD_LABEL + ' (' + m.format(m.prev) + ')' }),
          h('p', { class: 'note', style: 'margin-top:14px', text: m.note }),
          m.goal ? h('div', { style: 'margin-top:4px' }, [MC.PATTERNS.goal(m)]) : null,
          m.goal ? h('div', { class: 'mcard-vs', style: 'margin-top:6px', text: m.goal.label }) : null
        ]),
        card([
          h('h4', { class: 'viz-title', text: 'How this number is built' }),
          h('p', { class: 'note', style: 'margin-top:8px', text: A.periodSentence() }),
          h('p', { class: 'note', style: 'margin-top:8px', text:
            (m.unit === 'percent' || m.unit === 'percent-level')
              ? 'This metric is a rate, so its change is stated in percentage points (' + p.primary +
                '). The relative move — ' + p.secondary + ' — is the same change expressed as a share of where it started. ' +
                'Both are true and they are not interchangeable.'
              : 'This metric is a level, so its change is stated relatively (' + p.primary + ') with the absolute move alongside (' + p.secondary + ').' }),
          sig ? h('div', { style: 'margin-top:12px' }, [
            h('button', { class: 'ctl is-on', type: 'button', text: 'NORTH detected a change here — open investigation →',
              onclick: function () { A.openInvestigation(sig.investigationId); } })
          ]) : null
        ])
      ])
    ]));

    out.appendChild(h('div', { class: 'section' }, [
      sectionHead('Trend', m.question),
      chartCard(trendChart(id, { days: 150, height: 240, goal: !!m.goal }), {
        id: id + '-trend', title: m.longLabel, metricId: id,
        questions: id === 'activation' ? activationQuestions() : [
          { label: 'When did this start changing?', go: function () { A.go({ compare: true }); } }
        ]
      })
    ]));

    if (inv) {
      out.appendChild(h('div', { class: 'section' }, [
        sectionHead('NORTH finding'),
        h('div', { class: 'finding' }, [
          h('div', { class: 'finding-top' }, [
            h('span', { class: 'north-dot' }),
            h('span', { class: 'finding-label', text: 'What NORTH sees' })
          ]),
          h('p', { class: 'finding-text', text: inv.summary }),
          h('div', { class: 'finding-foot' }, [
            h('button', { class: 'ctl', type: 'button', text: 'Open the full investigation →', onclick: function () { A.openInvestigation(inv.id); } })
          ])
        ])
      ]));
    }

    var breakdowns = N.breakdowns[id];
    if (breakdowns) {
      out.appendChild(h('div', { class: 'section' }, [
        sectionHead('Breakdown', 'Where is the change concentrated?'),
        h('div', { class: 'chips', style: 'margin-bottom:12px' }, Object.keys(breakdowns).map(function (k) {
          return h('button', {
            class: 'chip' + (state.dimension === k ? ' is-on' : ''), type: 'button', text: k,
            onclick: function () { A.go({ dimension: k }); }
          });
        })),
        chartCard(segmentFigure(id), {
          id: 'segments', title: 'Breakdown by ' + state.dimension.toLowerCase(), metricId: id,
          questions: [
            { label: 'Which segment caused the decline?', go: function () { A.openInvestigation('inv-activation', 'where'); } },
            { label: 'At which step do they stop?', go: function () { A.openInvestigation('inv-activation', 'step'); } }
          ]
        })
      ]));
    }

    if (id === 'activation') {
      out.appendChild(h('div', { class: 'section' }, [
        sectionHead('Funnel', 'At which step do signups stop?'),
        chartCard(funnelFigure(), { id: 'funnel', title: 'Activation funnel', metricId: id, questions: activationQuestions() })
      ]));
    }

    if (inv) {
      out.appendChild(h('div', { class: 'section' }, [
        sectionHead('Related signals', 'What else moved in the same window?'),
        h('div', { class: 'grid grid-3' }, inv.relatedSignals.map(function (r) {
          var rm = N.metrics[r.metricId];
          return metricCard(r.metricId, { pattern: 'sparkline', showSignal: false, className: 'is-related' });
        }))
      ]));

      out.appendChild(h('div', { class: 'section' }, [
        sectionHead('Evidence', 'Where these numbers come from'),
        card([h('div', { class: 'ev' }, inv.evidence.map(function (e) {
          return h('div', { class: 'ev-item' }, [
            h('span', { class: 'ev-src', text: e.source }),
            h('span', { class: 'ev-detail', text: e.detail }),
            h('span', { class: 'ev-when', text: e.updated })
          ]);
        }))])
      ]));

      out.appendChild(h('div', { class: 'section' }, [
        sectionHead('Recommended discovery', 'What to look at next'),
        h('div', { class: 'grid grid-3' }, inv.recommended.map(function (r) {
          return h('button', { class: 'rec', type: 'button', onclick: function () { A.openInvestigation(inv.id, 'step'); } }, [
            h('div', { class: 'rec-label', text: r.label + ' →' }),
            h('div', { class: 'rec-detail', text: r.detail })
          ]);
        }))
      ]));
    }
    return out;
  }

  function segmentFigure(metricId) {
    var bd = N.breakdowns[metricId][state.dimension];
    var m = N.metrics[metricId];
    return V.segments({
      title: m.label + ' by ' + bd.dimension.toLowerCase(),
      question: 'Where is the change concentrated — and does it matter?',
      dimension: bd.dimension,
      segments: bd.segments,
      totalLabel: fmt.pp(bd.totalChange) + ' blended',
      caption: 'The bars are each segment’s own rate. The column on the right is what each contributed to the ' +
        'blended ' + fmt.pp(bd.totalChange) + ' — its share of signups multiplied by its own move. ' +
        'The signup mix is held constant across both periods, so this compares rates, not a shift in who signed up.'
    });
  }

  function activationQuestions() {
    return [
      { label: 'Why did activation drop?', go: function () { A.openInvestigation('inv-activation', 'where'); } },
      { label: 'Which segment caused the decline?', go: function () { A.openInvestigation('inv-activation', 'where'); } },
      { label: 'When did the decline start?', go: function () { A.openInvestigation('inv-activation', 'when'); } },
      { label: 'At which step?', go: function () { A.openInvestigation('inv-activation', 'step'); } },
      { label: 'What changed at the same time?', go: function () { A.openInvestigation('inv-activation', 'together'); } }
    ];
  }

  global.NorthViews = {
    viewRevenue: viewRevenue, viewProduct: viewProduct, viewCustomers: viewCustomers,
    viewMetric: viewMetric, segmentFigure: segmentFigure, funnelFigure: funnelFigure,
    cohortFigure: cohortFigure, accountsTable: accountsTable, activationQuestions: activationQuestions
  };
})(typeof window !== 'undefined' ? window : globalThis);
