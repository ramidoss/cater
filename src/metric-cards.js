/* NORTH — the metric card system.
 *
 * One component, four patterns. The pattern is a property of the metric, not
 * of the grid it sits in: a metric gets a sparkline when the shape of the
 * trend is the point, context when the change needs explaining, a meter when
 * a real target exists, and nothing extra otherwise.
 *
 * Default hierarchy, in this order and no other: metric · value · change ·
 * context. Everything else appears only when it earns the room.
 */
(function (global) {
  'use strict';
  var V = global.Viz, h = V.h;

  /* --------------------------------------------------------------- change
   * A change is four facts: what, how much, which direction, against what.
   * A card that shows only three of them is the thing this system exists to
   * avoid. Percentage points and percentages are different quantities and
   * are never allowed to wear the same clothes:
   *
   *   a rate     64.0% from 69.6%   →  −5.6pp   (−8.0% relative)
   *   a level    $428K from $399K   →  +7.2%    (+$28.9K)
   */
  function changeParts(m) {
    var c = m.change;
    var isRate = m.unit === 'percent' || m.unit === 'percent-level';
    var primary, secondary;
    if (isRate) {
      primary = (c.abs > 0 ? '+' : c.abs < 0 ? '−' : '') + Math.abs(c.abs).toFixed(1) + 'pp';
      secondary = (c.rel > 0 ? '+' : c.rel < 0 ? '−' : '') + Math.abs(c.rel).toFixed(1) + '% relative';
    } else {
      primary = (c.rel > 0 ? '+' : c.rel < 0 ? '−' : '') + Math.abs(c.rel).toFixed(1) + '%';
      var absFmt = m.formatPrecise || m.format;
      secondary = (c.abs > 0 ? '+' : '−') + absFmt(Math.abs(c.abs)).replace('-', '');
    }
    var good = c.dir === 0 ? null : (c.dir > 0) === (m.higherIsBetter !== false);
    return { primary: primary, secondary: secondary, good: good, dir: c.dir };
  }

  function changeEl(m, opts) {
    opts = opts || {};
    var p = changeParts(m);
    var tone = p.good === null ? 'is-flat' : p.good ? 'is-good' : 'is-bad';
    var arrow = p.dir > 0 ? '↑' : p.dir < 0 ? '↓' : '→';
    var kids = [
      h('span', { class: 'chg-arrow', 'aria-hidden': 'true', text: arrow }),
      h('span', { class: 'chg-primary', text: p.primary })
    ];
    if (opts.secondary !== false) kids.push(h('span', { class: 'chg-secondary', text: p.secondary }));
    return h('div', { class: 'chg ' + tone }, kids);
  }

  function comparisonEl(text) {
    return h('div', { class: 'mcard-vs', text: text || 'vs previous 30 days' });
  }

  /* ---------------------------------------------------------- the patterns */

  var PATTERNS = {
    /* 1 — Simple KPI. The value and its direction are the whole story. */
    simple: function () { return null; },

    /* 2 — KPI + sparkline. Only where the shape of the line adds something
     *     the single number cannot: steady climb, plateau, a turn. */
    sparkline: function (m, ctx) {
      var vals = (m.displaySeries || m.series).slice(-90);
      return h('div', { class: 'mcard-spark' }, [
        V.sparkline({ values: vals, width: 132, height: 30, accentFrom: vals.length - 30 }),
        h('span', { class: 'mcard-spark-lab', text: '90-day trend' })
      ]);
    },

    /* 3 — KPI + context. The change is explained rather than merely shown.
     *     For NORTH this is usually worth more than another sparkline. */
    context: function (m, ctx) {
      if (!ctx || !ctx.context) return null;
      return h('div', { class: 'mcard-context' }, [
        h('span', { class: 'mcard-context-lead', text: ctx.context.lead }),
        h('span', { class: 'mcard-context-body', text: ctx.context.body })
      ]);
    },

    /* 4 — KPI + goal. Only against a target that actually exists. NORTH
     *     never invents one to have something to draw. */
    goal: function (m) {
      if (!m.goal) return null;
      var isRate = m.unit === 'percent' || m.unit === 'percent-level';
      return V.meter({
        value: m.value, goal: m.goal.value,
        formatGoal: m.goal.format || m.format,
        ariaLabel: m.label + ' against ' + m.goal.label,
        gapLabel: function (gap) {
          if (gap <= 0) return 'Target met';
          return isRate
            ? gap.toFixed(1) + 'pp below target'
            : (m.goal.format || m.format)(gap) + ' below target';
        }
      });
    }
  };

  /* ------------------------------------------------------------- the card */

  function card(m, ctx) {
    ctx = ctx || {};
    var pattern = ctx.pattern || m.pattern || 'simple';
    var signal = ctx.signal;

    var head = h('div', { class: 'mcard-head' }, [
      h('span', { class: 'mcard-label', text: m.label }),
      signal ? h('span', { class: 'mcard-flag sev-' + signal.severity, title: signal.headline, 'aria-hidden': 'true' }) : null
    ]);

    var extra = PATTERNS[pattern] ? PATTERNS[pattern](m, ctx) : null;

    var kids = [
      head,
      h('div', { class: 'mcard-value' + (ctx.hero ? ' is-hero' : ''), text: m.format(m.value) }),
      changeEl(m, { secondary: ctx.secondaryChange !== false }),
      comparisonEl(ctx.comparisonLabel),
      extra
    ];

    if (signal && ctx.showSignal !== false) {
      kids.push(h('div', { class: 'mcard-signal' }, [
        h('span', { class: 'north-dot', 'aria-hidden': 'true' }),
        h('span', { class: 'mcard-signal-text', text: signal.short }),
        h('span', { class: 'mcard-signal-go', text: 'Open investigation →' })
      ]));
    }

    // A card with nothing below the change hugs its content instead of
    // stretching to match a taller neighbour and leaving a hole.
    var plain = !extra && !(signal && ctx.showSignal !== false);

    var node = h(ctx.onOpen ? 'button' : 'div', {
      class: 'mcard' + (ctx.onOpen ? ' is-clickable' : '') + (signal ? ' has-signal' : '') +
        (plain ? ' is-plain' : '') + (ctx.className ? ' ' + ctx.className : ''),
      type: ctx.onOpen ? 'button' : null
    }, kids);

    if (ctx.onOpen) {
      node.addEventListener('click', function () { ctx.onOpen(m, signal); });
      node.setAttribute('aria-label', m.label + ' ' + m.format(m.value) + ', ' + changeParts(m).primary +
        ' versus the previous 30 days' + (signal ? '. NORTH detected a change.' : '') + ' Open detail.');
    }
    return node;
  }

  global.MetricCard = { card: card, changeEl: changeEl, changeParts: changeParts, PATTERNS: PATTERNS };
})(typeof window !== 'undefined' ? window : globalThis);
