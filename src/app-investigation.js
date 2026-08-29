/* NORTH — the investigation.
 *
 * One rule: the question chooses the visualisation. "When did it begin"
 * is a time series; "which segment" is a comparison; "at which step" is a
 * funnel; "is retention affected" is a cohort grid; "which customers" is a
 * table. The grammar stays the same while the form changes.
 */
(function (global) {
  'use strict';

  var N = global.NORTH, V = global.Viz, A = global.NorthApp, W = global.NorthViews;
  var h = V.h, fmt = N.fmt, S = N.series, state = A.state;

  var VIZ = {
    timeseries: function (inv) {
      var m = N.metrics[inv.metricId];
      var days = 120;
      var dates = S.dates.slice(-days), vals = (m.displaySeries || m.series).slice(-days);
      return V.lineChart({
        title: m.longLabel + ', last ' + days + ' days',
        question: 'Is this a step or a drift?',
        dates: dates,
        series: [{ id: 'cur', label: m.label, values: vals, color: 'var(--series-1)', fill: true }],
        format: m.format, xFormat: function (d) { return fmt.date(d); },
        height: 240,
        goal: m.goal ? { value: m.goal.value, label: 'Goal ' + (m.goal.format || m.format)(m.goal.value) } : null,
        annotations: (m.events || []).filter(function (e) { return dates.indexOf(e.date) >= 0; }),
        anomaly: { date: S.dates[S.declineStartIndex], label: 'NORTH: change detected' },
        caption: m.seriesNote + ' The line holds a flat band for four months and then steps down over about three weeks. ' +
          'A drift would have started earlier and moved more slowly; this shape points at a date.'
      });
    },

    segments: function () {
      return h('div', {}, [
        h('div', { class: 'chips', style: 'margin-bottom:14px' }, Object.keys(N.breakdowns.activation).map(function (k) {
          return h('button', {
            class: 'chip' + (state.dimension === k ? ' is-on' : ''), type: 'button', text: k,
            onclick: function () { A.go({ dimension: k }); }
          });
        })),
        W.segmentFigure('activation')
      ]);
    },

    funnel: function () { return W.funnelFigure(); },
    cohorts: function () { return W.cohortFigure(); },

    accounts: function () {
      return h('div', {}, [
        h('h4', { class: 'viz-title', text: 'Accounts that moved to watch or at risk in this window' }),
        h('p', { class: 'viz-question', style: 'margin-bottom:12px', text: 'A table, because the answer is a list of names.' }),
        W.accountsTable()
      ]);
    },

    /* Co-movement, as small multiples. Never two y-scales on one plot: four
     * metrics of four different units get four facets sharing one x range,
     * each with the same rule drawn on the date the change began. */
    correlates: function (inv) {
      var days = 90;
      var dates = S.dates.slice(-days);
      var changeDate = S.dates[S.declineStartIndex];
      var facets = [
        { id: 'activation', label: 'Activation' },
        { id: 'setupConversations', label: 'Setup conversations' },
        { id: 'customerChurn', label: 'Customer churn' },
        { id: 'retention30', label: '30-day retention' }
      ];
      return h('div', {}, [
        h('h4', { class: 'viz-title', text: 'What moved in the same window' }),
        h('p', { class: 'viz-question', style: 'margin-bottom:14px', text:
          'Four metrics on four different scales, so four panels — never two axes on one plot.' }),
        h('div', { class: 'grid grid-2' }, facets.map(function (f) {
          var m = N.metrics[f.id];
          return h('div', { class: 'card' }, [V.lineChart({
            title: f.label,
            dates: dates,
            series: [{ id: f.id, label: f.label, values: (m.displaySeries || m.series).slice(-days), color: 'var(--series-1)', fill: true }],
            format: f.id === 'setupConversations' ? function (v) { return (v).toFixed(1) + '/day'; } : m.format,
            xFormat: function (d) { return fmt.date(d); },
            height: 96, tickCount: 2, endLabel: false,
            annotations: [{ date: changeDate, label: fmt.date(changeDate) }]
          })]);
        })),
        h('div', { class: 'grid grid-2', style: 'margin-top:14px' }, [
        h('div', { class: 'card' }, [
          h('h4', { class: 'viz-title', text: 'Sequence' }),
          h('p', { class: 'viz-question', text: 'Nine days, five moves.' }),
          h('div', { class: 'timeline', style: 'margin-top:10px' }, inv.correlates.map(function (c) {
            return h('div', { class: 'tl-item is-' + c.kind }, [
              h('div', { class: 'tl-rail' }, [h('span', { class: 'tl-dot' })]),
              h('div', { class: 'tl-body' }, [
                h('div', { class: 'tl-label', text: c.label }),
                h('div', { class: 'tl-detail', text: c.detail }),
                h('div', { class: 'tl-when', text: fmt.dateLong(c.on) })
              ])
            ]);
          })),
        ]),
        h('div', { class: 'card' }, [
          h('h4', { class: 'viz-title', text: 'What NORTH will not say' }),
          h('div', { class: 'caution', style: 'margin-top:12px' }, [
            h('b', { text: 'Correlation, not cause. ' }),
            document.createTextNode(inv.caution)
          ]),
          h('p', { class: 'note', style: 'margin-top:14px', text:
            'NORTH ranks candidates by how well they fit the shape of the change — a step on a date, ' +
            'in one segment, at one step of the funnel. It does not promote the best-fitting candidate to a cause. ' +
            'Closing that gap needs the checks below, not more of this data.' })
        ])
        ])
      ]);
    }
  };

  function viewInvestigation(id) {
    var inv = N.investigations[id];
    var out = h('div', {});

    out.appendChild(h('div', { class: 'section' }, [
      h('div', { class: 'finding' }, [
        h('div', { class: 'finding-top' }, [
          h('span', { class: 'north-dot' }),
          h('span', { class: 'finding-label', text: 'NORTH investigation' }),
          h('span', { class: 'sig-when', style: 'margin-left:auto', text: 'Evidence from ' + inv.evidence.length + ' sources' })
        ]),
        h('p', { class: 'finding-text', text: inv.summary })
      ])
    ]));

    out.appendChild(h('div', { class: 'section' }, [
      sectionLabel('Questions', 'Each one changes the visualisation, because each one is a different question.'),
      h('div', { class: 'chips' }, inv.steps.map(function (s) {
        return h('button', {
          class: 'chip' + (state.invStep === s.id ? ' is-on' : ''), type: 'button', text: s.question,
          onclick: function () { A.go({ invStep: s.id }); }
        });
      }))
    ]));

    var step = inv.steps.find(function (s) { return s.id === state.invStep; }) || inv.steps[0];
    out.appendChild(h('div', { class: 'section' }, [
      h('h3', { style: 'font-size:18px;margin-bottom:8px', text: step.question }),
      h('p', { style: 'font-size:14px;line-height:1.6;color:var(--ink-secondary);max-width:76ch;margin-bottom:16px', text: step.answer }),
      step.viz === 'correlates' || step.viz === 'segments'
        ? VIZ[step.viz](inv)
        : h('div', { class: 'card' }, [VIZ[step.viz](inv)])
    ]));

    var i = inv.steps.indexOf(step);
    out.appendChild(h('div', { class: 'section', style: 'display:flex;gap:8px' }, [
      i > 0 ? h('button', { class: 'ctl', type: 'button', text: '← ' + inv.steps[i - 1].question, onclick: function () { A.go({ invStep: inv.steps[i - 1].id }); } }) : null,
      i < inv.steps.length - 1 ? h('button', { class: 'ctl is-on', type: 'button', text: inv.steps[i + 1].question + ' →', onclick: function () { A.go({ invStep: inv.steps[i + 1].id }); } }) : null
    ]));

    out.appendChild(h('div', { class: 'section' }, [
      sectionLabel('Evidence', 'Every number above traces to one of these.'),
      A.card([h('div', { class: 'ev' }, inv.evidence.map(function (e) {
        return h('div', { class: 'ev-item' }, [
          h('span', { class: 'ev-src', text: e.source }),
          h('span', { class: 'ev-detail', text: e.detail }),
          h('span', { class: 'ev-when', text: e.updated })
        ]);
      }))])
    ]));

    out.appendChild(h('div', { class: 'section' }, [
      sectionLabel('Recommended discovery', 'NORTH cannot close this from the data it has. These would.'),
      h('div', { class: 'grid grid-3' }, inv.recommended.map(function (r) {
        return h('div', { class: 'rec' }, [
          h('div', { class: 'rec-label', text: r.label }),
          h('div', { class: 'rec-detail', text: r.detail })
        ]);
      }))
    ]));

    return out;
  }

  function sectionLabel(title, note) {
    return h('div', { class: 'section-head' }, [
      h('h2', { text: title }),
      note ? h('span', { class: 'q', text: note }) : null
    ]);
  }

  global.NorthInvestigation = { viewInvestigation: viewInvestigation, VIZ: VIZ };
})(typeof window !== 'undefined' ? window : globalThis);
