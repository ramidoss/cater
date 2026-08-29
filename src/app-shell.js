/* NORTH — shell: navigation, the filter row, the panel, and mounting. */
(function (global) {
  'use strict';

  var N = global.NORTH, V = global.Viz, MC = global.MetricCard;
  var A = global.NorthApp, W = global.NorthViews, I = global.NorthInvestigation;
  var h = V.h, fmt = N.fmt, state = A.state;

  var app, mainEl, panelEl, panelInner, navEl;

  // ------------------------------------------------------------------ chrome

  function sidebar() {
    navEl = h('div', { class: 'nav' });
    var items = [{ id: 'overview', label: 'Overview' }].concat(
      N.domains.map(function (d) { return { id: d.id, label: d.label }; }));

    items.forEach(function (it) {
      var hasSignal = it.id === 'overview'
        ? N.signals.length > 0
        : N.signals.some(function (s) { return N.metrics[s.metricId].domain === it.id; });
      navEl.appendChild(h('button', {
        class: 'nav-item', type: 'button', 'data-nav': it.id,
        onclick: function () {
          if (it.id === 'overview') A.go({ view: 'overview', context: null });
          else A.go({ view: 'domain', domainId: it.id, context: null });
        }
      }, [h('span', { text: it.label }), hasSignal ? h('span', { class: 'nav-flag' }) : null]));
    });

    return h('aside', { class: 'side' }, [
      h('div', { class: 'brand' }, [h('span', { class: 'brand-mark' }), h('span', { class: 'brand-name', text: 'NORTH' })]),
      h('div', {}, [h('div', { class: 'nav-label', text: 'Business' }), navEl]),
      h('div', { class: 'side-foot' }, [
        h('button', {
          class: 'ctl', type: 'button', text: 'Theme',
          onclick: function () {
            var cur = document.documentElement.getAttribute('data-theme');
            var next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
            document.documentElement.setAttribute('data-theme', next);
            render();
          }
        }),
        h('p', { class: 'side-note', text: 'Prototype. Sample data with a deliberate change in it, so there is something real to detect.' })
      ])
    ]);
  }

  function topbar() {
    var title, crumb, question;
    if (state.view === 'overview') { crumb = 'Business'; title = 'Overview'; question = 'What changed, and does it matter?'; }
    else if (state.view === 'domain') {
      var d = N.domains.find(function (x) { return x.id === state.domainId; });
      crumb = 'Business'; title = d.label; question = d.question;
    } else if (state.view === 'metric') {
      var m = N.metrics[state.metricId];
      crumb = N.domains.find(function (x) { return x.id === m.domain; }).label; title = m.longLabel; question = m.question;
    } else {
      var inv = N.investigations[state.invId];
      crumb = 'Investigation'; title = inv.title; question = inv.asked;
    }

    var back = null;
    if (state.view === 'metric' || state.view === 'investigation') {
      back = h('button', {
        class: 'back', type: 'button', text: '← Back',
        onclick: function () { history.length > 1 ? A.go({ view: 'overview', context: null }) : A.go({ view: 'overview' }); }
      });
    }

    return h('div', { class: 'topbar' }, [
      h('div', { class: 'topbar-text' }, [
        back,
        h('div', { class: 'crumb', text: crumb }),
        h('h1', { text: title }),
        h('p', { class: 'topbar-q', text: question })
      ]),
      // The filter row: one row, above everything it scopes.
      h('div', { class: 'topbar-tools' }, [
        h('span', { class: 'ctl', text: 'Last 30 days' }),
        h('button', {
          class: 'ctl' + (state.compare ? ' is-on' : ''), type: 'button',
          text: (state.compare ? '✓ ' : '') + 'Compare to previous period',
          onclick: function () { A.go({ compare: !state.compare }); }
        }),
        h('button', {
          class: 'ctl', type: 'button', text: state.panelOpen ? 'Hide NORTH' : 'Show NORTH',
          onclick: function () { A.go({ panelOpen: !state.panelOpen }); }
        })
      ])
    ]);
  }

  // ------------------------------------------------------------------- panel

  function renderPanel() {
    panelInner.textContent = '';
    panelInner.appendChild(h('div', { class: 'panel-head' }, [
      h('span', { class: 'north-dot' }),
      h('span', { class: 'panel-title', text: 'NORTH' }),
      h('button', { class: 'panel-close', type: 'button', text: '×', 'aria-label': 'Hide the NORTH panel', onclick: function () { A.go({ panelOpen: false }); } })
    ]));

    var body = h('div', { class: 'panel-body' });
    panelInner.appendChild(body);

    if (state.view === 'investigation') {
      var inv = N.investigations[state.invId];
      var step = inv.steps.find(function (s) { return s.id === state.invStep; }) || inv.steps[0];
      body.appendChild(h('div', { class: 'panel-block' }, [
        h('div', { class: 'panel-label', text: 'Investigation' }),
        h('p', { class: 'panel-text', text: inv.summary })
      ]));
      body.appendChild(h('div', { class: 'panel-block' }, [
        h('div', { class: 'panel-label', text: step.question }),
        h('p', { class: 'panel-text', text: step.answer })
      ]));
      body.appendChild(h('div', { class: 'panel-block' }, [
        h('div', { class: 'panel-label', text: 'Follow the question' }),
        h('div', { class: 'qlist' }, inv.steps.map(function (s) {
          return h('button', {
            class: 'qbtn' + (s.id === state.invStep ? ' is-active' : ''), type: 'button', text: s.question,
            onclick: function () { A.go({ invStep: s.id }); }
          });
        }))
      ]));
      body.appendChild(h('div', { class: 'panel-block' }, [
        h('div', { class: 'panel-label', text: 'On causation' }),
        h('div', { class: 'caution' }, [h('b', { text: 'Correlation, not cause. ' }), document.createTextNode(inv.caution)])
      ]));
      body.appendChild(h('div', { class: 'panel-block' }, [
        h('div', { class: 'panel-label', text: 'Evidence' }),
        h('div', { class: 'ev' }, inv.evidence.map(function (e) {
          return h('div', { class: 'ev-item' }, [
            h('span', { class: 'ev-src', text: e.source }),
            h('span', { class: 'ev-detail', text: e.detail })
          ]);
        }))
      ]));
      return;
    }

    // Signals, most severe first — the same objects the cards carry.
    body.appendChild(h('div', { class: 'panel-block' }, [
      h('div', { class: 'panel-label', text: 'Signals · last 30 days' }),
      h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, N.signals.map(function (sig) {
        var m = N.metrics[sig.metricId];
        return h('button', { class: 'sig', type: 'button', onclick: function () { A.openInvestigation(sig.investigationId); } }, [
          h('div', { class: 'sig-top' }, [
            h('span', { class: 'north-dot' }),
            h('span', { class: 'sig-sev sev-' + sig.severity, text: m.label }),
            h('span', { class: 'sig-when', text: fmt.date(sig.detectedOn) })
          ]),
          h('div', { class: 'sig-head', style: 'font-size:12.5px', text: sig.headline }),
          h('div', { class: 'sig-foot', text: 'Open investigation →' })
        ]);
      }))
    ]));

    // Ask NORTH — contextual to whatever visualisation the reader last touched.
    var ctx = state.context;
    body.appendChild(h('div', { class: 'panel-block' }, [
      h('div', { class: 'panel-label', text: ctx ? 'Ask NORTH about ' + ctx.title : 'Ask NORTH' }),
      ctx ? null : h('p', { class: 'panel-text', style: 'font-size:12.5px', text: 'Select a chart and these become questions about it.' }),
      h('div', { class: 'qlist' }, (ctx ? ctx.questions : defaultQuestions()).map(function (q) {
        return h('button', { class: 'qbtn', type: 'button', text: q.label, onclick: q.go });
      }))
    ]));

    body.appendChild(h('div', { class: 'panel-block' }, [
      h('div', { class: 'panel-label', text: 'Period' }),
      h('p', { class: 'panel-text', style: 'font-size:12.5px', text: A.periodSentence() })
    ]));
  }

  function defaultQuestions() {
    return [
      { label: 'What changed most this period?', go: function () { A.openInvestigation('inv-activation', 'when'); } },
      { label: 'Why did activation drop?', go: function () { A.openInvestigation('inv-activation', 'where'); } },
      { label: 'What actually changed our MRR?', go: function () { A.go({ view: 'domain', domainId: 'revenue' }); } },
      { label: 'Which customers are at risk?', go: function () { A.openInvestigation('inv-activation', 'who'); } }
    ];
  }

  // ------------------------------------------------------------------ render

  function render() {
    app.className = 'app' + (state.panelOpen ? ' is-panel-open' : ' is-panel-collapsed');
    mainEl.textContent = '';
    mainEl.appendChild(topbar());

    var body;
    if (state.view === 'overview') body = A.viewOverview();
    else if (state.view === 'domain') {
      body = state.domainId === 'revenue' ? W.viewRevenue()
        : state.domainId === 'product' ? W.viewProduct() : W.viewCustomers();
    } else if (state.view === 'metric') body = W.viewMetric(state.metricId);
    else body = I.viewInvestigation(state.invId);
    mainEl.appendChild(body);

    var active = state.view === 'domain' ? state.domainId
      : state.view === 'overview' ? 'overview'
      : state.view === 'metric' ? N.metrics[state.metricId].domain : null;
    Array.prototype.forEach.call(navEl.children, function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-nav') === active);
    });

    renderPanel();
  }

  function mount(el) {
    app = el;
    var side = sidebar();
    mainEl = h('main', { class: 'main' });
    panelEl = h('aside', { class: 'panel', 'aria-label': 'NORTH' });
    panelInner = h('div', { class: 'panel-scroll' });
    panelEl.appendChild(panelInner);
    app.appendChild(side); app.appendChild(mainEl); app.appendChild(panelEl);
    A._bind(render, renderPanel);
    render();
  }

  global.NorthShell = { mount: mount, render: render, renderPanel: renderPanel };
})(typeof window !== 'undefined' ? window : globalThis);
