/* NORTH — the metric system, worked out in the open.
 *
 * Every specimen on this page is the live component rendered against the same
 * sample data the prototype uses, so the comparison is between real designs
 * rather than pictures of them.
 */
(function (global) {
  'use strict';

  var N = global.NORTH, V = global.Viz, MC = global.MetricCard;
  var h = V.h, fmt = N.fmt, S = N.series;

  function card(id, ctx) {
    var m = N.metrics[id];
    return MC.card(m, Object.assign({
      context: N.contextFor(id),
      comparisonLabel: 'vs previous 30 days',
      signal: null
    }, ctx || {}));
  }

  function sec(num, title, lede, body) {
    return h('section', { class: 'sec', id: 's' + num }, [
      h('div', { class: 'sec-num', text: 'Section ' + num }),
      h('h2', { text: title }),
      lede ? h('p', { class: 'sec-lede', text: lede }) : null,
      h('div', { class: 'sec-body' }, [body])
    ]);
  }

  function dl(items) {
    return h('div', { class: 'spec-when' }, items.map(function (i) {
      return h('div', { class: i.no ? 'no' : '' }, [
        h('dt', { text: i.term }),
        h('dd', { text: i.def })
      ]);
    }));
  }

  // ------------------------------------------------------- 1 · the patterns

  function patterns() {
    var specs = [
      {
        tag: 'Pattern 1', name: 'Simple KPI',
        card: card('activeCustomers', { pattern: 'simple' }),
        text: 'The value and its direction are the whole story. Nothing is added, because nothing else would be read.',
        when: [
          { term: 'Use for', def: 'Active customers, ARR, headcount — levels a founder already has a mental model for.' },
          { term: 'Do not use when', def: 'The number is only meaningful against something else — a target, a segment, a shape.', no: true }
        ]
      },
      {
        tag: 'Pattern 2', name: 'KPI + sparkline',
        card: card('mrr', { pattern: 'sparkline' }),
        text: 'A 90-day line where the shape carries information the single number cannot: a steady climb, a plateau, ' +
          'a turn. The context window is in the de-emphasis grey and the reported period is in the accent, so the eye ' +
          'lands on the part being reported.',
        when: [
          { term: 'Use for', def: 'MRR, retention — metrics where "how it got here" changes what you do about it.' },
          { term: 'Do not use when', def: 'The line is flat or the shape is noise. A sparkline on every card is decoration and trains people to stop looking.', no: true }
        ]
      },
      {
        tag: 'Pattern 3', name: 'KPI + context',
        card: card('activation', { pattern: 'context', signal: N.signalByMetric.activation }),
        text: 'The change is explained rather than merely displayed. For NORTH this is usually worth more than a ' +
          'sparkline: a founder who reads “small teams, 89% of the decline” already knows where to look, and a ' +
          'sparkline of the same number tells them only that it went down.',
        when: [
          { term: 'Use for', def: 'Any metric where NORTH can attribute the change to something specific.' },
          { term: 'Do not use when', def: 'The attribution is a guess. An invented reason is worse than no reason.', no: true }
        ]
      },
      {
        tag: 'Pattern 4', name: 'KPI + goal',
        card: card('nrr', { pattern: 'goal' }),
        text: 'Progress against a target that genuinely exists — here, a company goal set in NORTH. The gap is stated ' +
          'in the metric’s own units, so the reader never has to convert a bar into a number.',
        when: [
          { term: 'Use for', def: 'ARR against plan, NRR and activation against company goals.' },
          { term: 'Do not use when', def: 'There is no target. Inventing one to have a bar to draw is the fastest way to make a dashboard lie.', no: true }
        ]
      }
    ];

    return h('div', {}, specs.map(function (s) {
      return h('div', { class: 'spec' }, [
        h('div', {}, [s.card]),
        h('div', {}, [
          h('span', { class: 'spec-tag', text: s.tag }),
          h('div', { class: 'spec-name', text: s.name }),
          h('p', { class: 'spec-text', text: s.text }),
          dl(s.when)
        ])
      ]);
    }));
  }

  // ---------------------------------------------------------- 2 · change

  function changeDesign() {
    var act = N.metrics.activation;
    var pp = act.change.abs, rel = act.change.rel;

    return h('div', {}, [
      h('div', { class: 'demo' }, [
        h('div', { class: 'demo-card is-wrong' }, [
          h('div', { class: 'demo-tag', text: 'Not enough' }),
          h('div', { class: 'mcard', style: 'box-shadow:none' }, [
            h('div', { class: 'mcard-head' }, [h('span', { class: 'mcard-label', text: 'Activation' })]),
            h('div', { class: 'mcard-value', text: act.format(act.value) }),
            h('div', { class: 'chg is-bad' }, [
              h('span', { class: 'chg-arrow', text: '↓' }),
              h('span', { class: 'chg-primary', text: Math.abs(rel).toFixed(1) + '%' })
            ])
          ]),
          h('p', { class: 'demo-note', text:
            'Down ' + Math.abs(rel).toFixed(1) + '% against what? Yesterday, last month, last year, plan? ' +
            'And ' + Math.abs(rel).toFixed(1) + '% of what — is activation now ' + Math.abs(rel).toFixed(1) +
            ' points lower, or ' + Math.abs(rel).toFixed(1) + '% lower than it was? ' +
            'Two readers get two different numbers out of this card.' })
        ]),
        h('div', { class: 'demo-card is-right' }, [
          h('div', { class: 'demo-tag', text: 'What NORTH shows' }),
          card('activation', { pattern: 'simple' }),
          h('p', { class: 'demo-note', text:
            'Four facts, always: what changed, by how much, in which direction, and against what. ' +
            'The primary figure is the percentage-point move because activation is a rate; the relative move rides ' +
            'alongside it, labelled, so neither can be mistaken for the other.' })
        ])
      ]),

      h('h3', { style: 'font-size:16px;margin:34px 0 8px', text: 'Points and percentages are different quantities' }),
      h('p', { class: 'sec-lede', text:
        'This is the single most common way a metric card misleads, and it costs nothing to get right. A rate that ' +
        'moves from ' + act.format(act.prev) + ' to ' + act.format(act.value) + ' has moved ' +
        Math.abs(pp).toFixed(1) + ' points and ' + Math.abs(rel).toFixed(1) + ' percent. Both are true. ' +
        'They are not the same number and they do not answer the same question.' }),
      h('div', { class: 'demo', style: 'margin-top:18px' }, [
        h('div', { class: 'demo-card' }, [
          h('div', { class: 'demo-tag', text: 'A rate — points lead' }),
          h('div', { class: 'demo-math' }, [
            h('div', {}, [document.createTextNode('Activation  '), h('b', { text: '69.6% → 64.0%' })]),
            h('div', {}, [document.createTextNode('Percentage-point change  '), h('b', { text: fmt.pp(pp) })]),
            h('div', {}, [document.createTextNode('Relative change  '), h('b', { text: fmt.rel(rel) })])
          ]),
          h('p', { class: 'demo-note', text:
            'Points lead, because "5.6 points of every hundred signups" is the thing that happened. The relative ' +
            'figure is a restatement of it and is always the larger, more alarming-looking number.' })
        ]),
        h('div', { class: 'demo-card' }, [
          h('div', { class: 'demo-tag', text: 'A level — percent leads' }),
          h('div', { class: 'demo-math' }, [
            h('div', {}, [document.createTextNode('MRR  '), h('b', { text: fmt.currencyPrecise(N.metrics.mrr.prev) + ' → ' + fmt.currencyPrecise(N.metrics.mrr.value) })]),
            h('div', {}, [document.createTextNode('Relative change  '), h('b', { text: fmt.rel(N.metrics.mrr.change.rel) })]),
            h('div', {}, [document.createTextNode('Absolute change  '), h('b', { text: '+' + fmt.currencyPrecise(N.metrics.mrr.change.abs) })])
          ]),
          h('p', { class: 'demo-note', text:
            'A level has no points to move, so the relative change leads and the absolute change sits beside it. ' +
            'The card component decides which of the two forms to use from the metric’s unit — a card cannot get ' +
            'this wrong by accident.' })
        ])
      ]),

      h('div', { class: 'demo', style: 'margin-top:18px' }, [
        h('div', { class: 'demo-card is-wrong' }, [
          h('div', { class: 'demo-tag', text: 'The trap' }),
          h('div', { class: 'demo-math' }, [
            h('div', {}, [document.createTextNode('Trial conversion  '), h('b', { text: '8% → 10%' })]),
            h('div', {}, [document.createTextNode('Reported as  '), h('b', { text: '+25%' })]),
            h('div', {}, [document.createTextNode('Actually  '), h('b', { text: '+2pp' })])
          ]),
          h('p', { class: 'demo-note', text:
            'The same movement can be written as +25% or +2pp. Both are honest in isolation; picking whichever is ' +
            'bigger, per metric, per week, is how a dashboard stops being trusted.' })
        ]),
        h('div', { class: 'demo-card is-right' }, [
          h('div', { class: 'demo-tag', text: 'The rule' }),
          h('p', { class: 'demo-note', style: 'margin-top:0', text:
            'Rates are reported in points, levels in percent, always, whichever direction the number went. The ' +
            'secondary figure is always present and always labelled, so a reader who wants the other framing has it ' +
            'without having to compute it — and nobody gets to choose the flattering one.' })
        ])
      ])
    ]);
  }

  // ------------------------------------------------------- 3 · directions

    /* Four metrics that between them want four different patterns — which is
   * the whole argument for D and the reason the same four are used for every
   * option, so the rows differ only in treatment. */
  var OPTION_METRICS = ['mrr', 'activation', 'nrr', 'activeCustomers'];

  function optionRow(kind) {
    return h('div', { class: 'grid grid-4 opt-row' }, OPTION_METRICS.map(function (id) {
      var m = N.metrics[id];
      if (kind === 'A') return card(id, { pattern: 'simple' });
      if (kind === 'B') return card(id, { pattern: 'sparkline' });
      if (kind === 'C') return card(id, { pattern: 'context', signal: N.signalByMetric[id] });
      return card(id, { pattern: m.pattern, signal: N.signalByMetric[id] });   // D
    }));
  }

  function directions() {
    var opts = [
      {
        letter: 'A', name: 'Minimal KPI cards',
        text: 'Value, change, comparison period. Nothing else on any card.',
        good: 'Fastest possible scan, and it never lies by omission — every card carries the four facts a change needs. ' +
          'At four cards you can read the row in about a second.',
        bad: 'It can tell you activation fell and nothing more, so every question it raises costs a click. ' +
          'On a week when something is wrong, that is the whole job still ahead of you.'
      },
      {
        letter: 'B', name: 'KPI + micro trends',
        text: 'Every card gets a sparkline.',
        good: 'Shape is genuinely useful on MRR and retention: a plateau and a climb to the same value are different businesses.',
        bad: 'Applied uniformly it is decoration. Four sparklines make four grey squiggles of equal weight, the eye ' +
          'stops distinguishing them, and the one that matters — activation stepping down — reads the same as customer ' +
          'count wobbling. Noise rises and the signal does not.'
      },
      {
        letter: 'C', name: 'KPI + contextual NORTH finding',
        text: 'Every card gets an explanation of its change.',
        good: 'The most information per card by a wide margin, and it is the information a founder actually wants: ' +
          'not that activation fell but that small teams are 89% of the fall.',
        bad: 'Cards become paragraphs. Four of them is a wall of prose that has to be read rather than scanned, ' +
          'which is the opposite of what an overview is for — and it pressures NORTH into producing an explanation ' +
          'for every metric, including the ones where it has nothing to say.'
      },
      {
        letter: 'D', name: 'Hybrid — the pattern follows the metric', pick: true,
        text: 'Each metric declares the pattern that suits it, so all four patterns appear in one row. MRR takes a ' +
          'sparkline because its shape matters. Activation takes context because NORTH can attribute the change. ' +
          'Net revenue retention takes a meter because a real target exists. Active customers takes nothing, because ' +
          'the number is the story. A card only carries what it has earned.',
        good: 'Scan speed close to A, because a card only gets heavier when it has something to be heavy about. ' +
          'Density where it pays and whitespace where it does not. The variation itself becomes a signal: the one card ' +
          'carrying prose is the one with a problem, and that is legible before a word of it has been read.',
        bad: 'It is a system rather than a template, so it needs a rule per metric and a discipline about applying it. ' +
          'Left unpoliced it degrades into C.'
      }
    ];

    return h('div', {}, opts.map(function (o) {
      return h('div', { class: 'opt' + (o.pick ? ' is-pick' : '') }, [
        h('div', { class: 'opt-head' }, [
          h('span', { class: 'opt-letter', text: 'Option ' + o.letter }),
          h('span', { class: 'opt-name', text: o.name }),
          o.pick ? h('span', { class: 'opt-pick', text: 'What NORTH ships' }) : null
        ]),
        h('p', { class: 'opt-text', text: o.text }),
        optionRow(o.letter),
        h('div', { class: 'opt-verdict' }, [
          h('div', {}, [h('dt', { text: 'What it gets right' }), h('dd', { text: o.good })]),
          h('div', { class: 'no' }, [h('dt', { text: 'What it costs' }), h('dd', { text: o.bad })])
        ])
      ]);
    }));
  }

  // ------------------------------------------------------- 4 · evaluation

  function dots(n, pick) {
    return h('span', { class: 'dots' + (pick ? ' is-pick' : '') }, [1, 2, 3].map(function (i) {
      return h('i', { class: i <= n ? 'on' : '' });
    }));
  }

  function rating(n, label, pick) {
    return h('div', { class: 'rating' }, [dots(n, pick), h('span', { text: label })]);
  }

  function evaluation() {
    var criteria = [
      { name: 'Scan speed', note: 'How long to read the row',
        a: [3, 'Immediate'], b: [2, 'Slowed by four competing squiggles'], c: [1, 'Has to be read, not scanned'], d: [3, 'Plain cards stay plain'] },
      { name: 'Clarity', note: 'Can the number be misread',
        a: [3, 'Nothing to misread'], b: [2, 'Sparkline scale is implicit'], c: [3, 'Explicit'], d: [3, 'Explicit'] },
      { name: 'Information density', note: 'Useful facts per card',
        a: [1, 'Value and change only'], b: [2, 'Adds shape'], c: [3, 'Adds attribution'], d: [3, 'Adds what each metric has'] },
      { name: 'Founder usefulness', note: 'Does it shorten the next step',
        a: [1, 'Every question costs a click'], b: [2, 'Shape helps on two metrics'], c: [3, 'Names the next place to look'], d: [3, 'Names it where it exists'] },
      { name: 'Visual noise', note: 'Ink that is not carrying meaning',
        a: [3, 'None'], b: [1, 'Four decorative charts'], c: [1, 'Four paragraphs'], d: [3, 'Two extras across four cards'] },
      { name: 'Detecting change', note: 'Does something wrong stand out',
        a: [2, 'Only via the delta colour'], b: [2, 'All four cards look equally busy'], c: [2, 'Signal buried in prose'], d: [3, 'The odd card out is the signal'] }
    ];

    var cols = [['a', 'A · Minimal'], ['b', 'B · Micro trends'], ['c', 'C · Context'], ['d', 'D · Hybrid']];

    return h('div', {}, [
      h('div', { style: 'overflow-x:auto' }, [
        h('table', { class: 'score' }, [
          h('thead', {}, [h('tr', {}, [h('th', { scope: 'col', text: 'Criterion' })].concat(
            cols.map(function (c) { return h('th', { scope: 'col', text: c[1] }); })))]),
          h('tbody', {}, criteria.map(function (cr) {
            return h('tr', {}, [
              h('th', { scope: 'row' }, [document.createTextNode(cr.name), h('small', { text: cr.note })])
            ].concat(cols.map(function (c) {
              var v = cr[c[0]];
              return h('td', {}, [rating(v[0], v[1], c[0] === 'd')]);
            })));
          }))
        ])
      ]),
      h('p', { class: 'sec-lede', style: 'margin-top:18px', text:
        'These are judgements, not measurements — three dots means "strong for this criterion", one means "weak". ' +
        'They are here to make the trade-off arguable rather than to dress it up as arithmetic; the ratings are not ' +
        'summed, because a design that is adequate at everything and good at nothing would win a total.' }),
      h('div', { class: 'finding', style: 'margin-top:22px' }, [
        h('div', { class: 'finding-top' }, [
          h('span', { class: 'north-dot' }),
          h('span', { class: 'finding-label', text: 'Decision' })
        ]),
        h('p', { class: 'finding-text', text:
          'Option D. Not because it is the most sophisticated — B and C are both busier — but because it is the only ' +
          'one that keeps A’s scan speed while carrying C’s information on the cards that have any. ' +
          'The two things a founder does with an overview are read it in seconds and notice what is different, and ' +
          'uniformity actively hurts the second: when every card looks the same, the one with a problem looks the same too.' }),
        h('p', { class: 'finding-text', style: 'margin-top:10px', text:
          'The cost is real and worth naming. D is a system rather than a template, so every metric needs a decision ' +
          'about which pattern it earns, and the temptation will always be to give everything a sparkline because the ' +
          'data is there. That temptation is the thing the system exists to resist.' })
      ])
    ]);
  }

  // -------------------------------------------------- 5 · chart catalogue

  function catalogue() {
    var days = 90;
    var dates = S.dates.slice(-days);
    var act = N.metrics.activation;

    var items = [
      {
        q: 'Are we growing?', form: 'Line', why: 'One series over time, area wash, event annotations. Two or three lines at most; never a second y-axis.',
        viz: function () {
          return V.lineChart({
            dates: S.dates.slice(-120),
            series: [{ id: 'mrr', label: 'MRR', values: N.metrics.mrr.series.slice(-120), color: 'var(--series-1)', fill: true }],
            format: fmt.currency, xFormat: function (d) { return fmt.date(d); }, height: 110, tickCount: 2,
            annotations: N.events.filter(function (e) { return S.dates.slice(-120).indexOf(e.date) >= 0; }).slice(-1)
          });
        }
      },
      {
        q: 'Is it a step or a drift?', form: 'Line + anomaly mark', why: 'The same form, with the point NORTH detected marked on it. The mark is a control: it opens the investigation.',
        viz: function () {
          return V.lineChart({
            dates: dates,
            series: [{ id: 'a', label: 'Activation', values: act.displaySeries.slice(-days), color: 'var(--series-1)', fill: true }],
            format: act.format, xFormat: function (d) { return fmt.date(d); }, height: 110, tickCount: 2,
            anomaly: { date: S.dates[S.declineStartIndex], label: 'detected' }
          });
        }
      },
      {
        q: 'What actually changed our MRR?', form: 'Bridge', why: 'New, expansion, contraction and churn as their own quantities. A second revenue line answers nothing this does not.',
        viz: function () {
          return V.bridge({
            start: N.mrrMovement.start, end: N.mrrMovement.end,
            startLabel: 'Start', endLabel: 'End', items: N.mrrMovement.items,
            format: fmt.currencyPrecise, height: 130
          });
        }
      },
      {
        q: 'At which step do signups stop?', form: 'Funnel', why: 'One hue — length already carries the order — with the abnormal transition, and only that one, marked.',
        viz: function () { return V.funnel({ rows: N.funnel.rows, worstId: N.funnel.worstStep.id, caption: null }); }
      },
      {
        q: 'Where is the change concentrated?', form: 'Segment bars + contribution', why: 'Rates as bars, previous period as a tick, and each segment’s share of the blended move beside it — a segment can move a long way and still barely matter.',
        viz: function () {
          return V.segments({
            segments: N.breakdowns.activation['Company size'].segments,
            dimension: 'Company size',
            totalLabel: fmt.pp(N.breakdowns.activation['Company size'].totalChange) + ' blended'
          });
        }
      },
      {
        q: 'Which features are being adopted?', form: 'Ranked bars', why: 'Five independent rates, so five bars — not five slices of a pie, which they are not parts of.',
        viz: function () { return V.rankedBars({ items: N.featureAdoption.items, dimension: 'Feature' }); }
      },
      {
        q: 'How is the base distributed?', form: 'Segmented bar', why: 'Three bands of one whole, read left to right, with the share change written out. The one case where part-to-whole is honest — and still not a donut.',
        viz: function () { return V.distribution({ bands: N.customerHealth.bands }); }
      },
      {
        q: 'What are customers struggling with?', form: 'Diverging deltas', why: 'The total volume is not the news; which problem is growing is. Bars run from a no-change axis, tone by direction.',
        viz: function () { return V.topicDeltas({ items: N.supportTopics.items, residualId: 'other', higherIsBetter: false }); }
      },
      {
        q: 'Are cohorts retaining better or worse?', form: 'Cohort grid', why: 'A genuine magnitude grid, so a single-hue sequential ramp with a scale legend. Detail only — never on the overview.',
        viz: function () { return V.cohortGrid({ periods: N.cohorts.periods, rows: N.cohorts.rows }); }
      },
      {
        q: 'Which customers?', form: 'Table', why: 'When the answer is a list of names, the answer is a table. A chart of six accounts is a chart for the sake of having one.',
        viz: function () {
          return h('div', { class: 'note', style: 'font-size:13px' }, [
            h('div', { style: 'font-weight:600;color:var(--ink)', text: N.accountsAtRisk.length + ' accounts moved to watch or at risk' }),
            h('div', { style: 'margin-top:6px' }, [document.createTextNode(N.accountsAtRisk.slice(0, 3).map(function (a) { return a.name; }).join(' · ') + ' …')])
          ]);
        }
      }
    ];

    return h('div', { class: 'cat' }, items.map(function (i) {
      return h('div', { class: 'cat-item' }, [
        h('div', { class: 'cat-q', text: i.q }),
        h('div', { class: 'cat-form', text: i.form }),
        h('p', { class: 'cat-why', text: i.why }),
        h('div', { class: 'cat-viz' }, [i.viz()])
      ]);
    }));
  }

  // ------------------------------------------------------------- 6 · rules

  function rules() {
    var items = [
      { h: 'No dual axes, ever', p: 'Two measures on two y-scales invent a correlation the data does not contain. Four metrics that moved together are shown as four panels sharing one x range.' },
      { h: 'No pie for things that are not one whole', p: 'Feature adoption is five independent rates. Customer health is one base in three bands, and gets a segmented bar rather than a donut.' },
      { h: 'No chart because a dashboard should have one', p: 'Every figure states the question it answers. If the question is a list of names, the answer is a table.' },
      { h: 'No goal without a goal', p: 'Three metrics carry a target because a target was set. The rest carry none, and no progress bar is drawn against an invented number.' },
      { h: 'No number on every point', p: 'Direct labels ride the endpoint, the extreme, or the one series the story is about. The axis, the tooltip and the table view carry the rest.' },
      { h: 'No value reachable only by hovering', p: 'Every figure has a table view behind a toggle, and keyboard focus shows what hover shows.' },
      { h: 'No colour doing a label’s job', p: 'Text wears text tokens. Identity comes from a coloured mark beside the text, never from tinting the text itself.' },
      { h: 'No cause claimed from co-movement', p: 'Five things moved in nine days. NORTH ranks candidates by fit and says so; it never promotes the best-fitting one to a cause.' }
    ];
    return h('div', { class: 'rules' }, items.map(function (i) {
      return h('div', { class: 'rule-item is-kept' }, [h('h4', { text: i.h }), h('p', { text: i.p })]);
    }));
  }

  // ------------------------------------------------------------- assembly

  function build(root) {
    root.appendChild(h('div', { class: 'tools' }, [
      h('button', {
        class: 'ctl', type: 'button', text: 'Theme', onclick: function () {
          var cur = document.documentElement.getAttribute('data-theme');
          var next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
          document.documentElement.setAttribute('data-theme', next);
          location.reload();
        }
      })
    ]));

    var doc = h('div', { class: 'doc' });
    doc.appendChild(h('header', { class: 'doc-head' }, [
      h('div', { class: 'doc-eyebrow' }, [h('span', { class: 'brand-mark', style: 'width:14px;height:14px' }), h('span', { text: 'NORTH · Design study' })]),
      h('h1', { text: 'A metric system, not a KPI card' }),
      h('p', { class: 'doc-lede', text:
        'A traditional analytics product asks how to visualise the data it has. This one starts from a different ' +
        'question — what does the leader need to understand — and lets that choose the metric, the form and the ' +
        'explanation. This page is the working-out: four card patterns, four whole-dashboard directions compared ' +
        'against each other, the change grammar underneath them, and the chart forms each business question earns.' }),
      h('p', { class: 'doc-lede', text:
        'Everything below is the live component rendered against the prototype’s sample data — six months of it, ' +
        'with a deliberate change in July so there is something real to detect. The test throughout is one question: ' +
        'can a founder understand what is happening in seconds?' }),
      h('nav', { class: 'doc-toc' }, [
        ['s1', 'The four patterns'], ['s2', 'Designing change'], ['s3', 'Four directions'],
        ['s4', 'The evaluation'], ['s5', 'Question → form'], ['s6', 'Rules held to']
      ].map(function (t) { return h('a', { href: '#' + t[0], text: t[1] }); }))
    ]));

    doc.appendChild(h('hr', { class: 'rule' }));
    doc.appendChild(sec(1, 'The four patterns',
      'One component, four patterns. The pattern belongs to the metric, not to the grid it sits in — so a row can ' +
      'mix them, and the mixture is itself informative. The default hierarchy inside every card is fixed: metric, ' +
      'value, change, context. Everything else appears only when it earns the room.', patterns()));

    doc.appendChild(sec(2, 'Designing change',
      'Most of a founder’s attention goes to the change, not the value — so the change is where a card earns or ' +
      'loses its credibility. A change is four facts and a card that shows three of them is guessing on the reader’s behalf.',
      changeDesign()));

    doc.appendChild(sec(3, 'Four directions',
      'The same four metrics, the same real data, four ways of presenting them. Read each row the way you would ' +
      'read a dashboard on a Monday morning: how long does it take, and does anything pull your eye?', directions()));

    doc.appendChild(sec(4, 'The evaluation',
      'Six criteria, applied to all four. The point is not to crown the most capable design — it is to find the one ' +
      'a founder reads fastest without losing what they need.', evaluation()));

    doc.appendChild(sec(5, 'Question → form',
      'Before rendering anything, NORTH answers one question: what question does this chart answer? The forms below ' +
      'are the whole vocabulary, and each exists because a specific business question needed it. The visual grammar ' +
      'stays constant while the form changes with the question.', catalogue()));

    doc.appendChild(sec(6, 'Rules held to',
      'The discipline is mostly negative — the things that were not done, each of which is a real failure mode in a ' +
      'shipping dashboard.', rules()));

    doc.appendChild(h('footer', { class: 'doc-foot' }, [
      h('p', { text:
        'Sample data: 180 days, generated from a seeded function so the prototype is deterministic, then calibrated ' +
        'so the headline windows land on round numbers without distorting the shape of any curve. The funnel, the ' +
        'segment breakdown and the headline activation rate all reconcile to the same 64.0%, and the MRR bridge ' +
        'reconciles to the same +7.2% the MRR card reports. Colour was validated with a contrast and colour-vision ' +
        'checker against these exact surfaces rather than judged by eye.' })
    ]));

    root.appendChild(doc);
  }

  global.NorthExploration = { build: build };
})(typeof window !== 'undefined' ? window : globalThis);
