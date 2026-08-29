/* NORTH — time-series marks: sparkline and the line chart.
 * The line chart carries the pieces the brief asks a NORTH trend to carry:
 * a previous-period overlay that stays visually secondary, event annotations,
 * a goal rule, and the marker where NORTH detected a change.
 */
(function (global) {
  'use strict';
  var V = global.Viz, el = V.el, h = V.h;

  /* --------------------------------------------------------- sparkline
   * Trend shape only. The context window is de-emphasised and the current
   * period carries the accent, so the eye lands on the part being reported. */
  function sparkline(opts) {
    var values = opts.values, w = opts.width || 108, ht = opts.height || 28;
    var accentFrom = opts.accentFrom === undefined ? values.length - 30 : opts.accentFrom;
    var e = V.extent([values]), pad = (e[1] - e[0]) * 0.18 || 1;
    var x = V.scale(0, values.length - 1, 1.5, w - 6);
    var y = V.scale(e[0] - pad, e[1] + pad, ht - 2.5, 2.5);
    var pts = values.map(function (v, i) { return [x(i), y(v)]; });

    var svg = el('svg', { width: w, height: ht, class: 'spark', 'aria-hidden': 'true', focusable: 'false' });
    el('path', { d: V.linePath(pts.slice(0, accentFrom + 1)), fill: 'none', stroke: 'var(--de-emphasis)', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    el('path', { d: V.linePath(pts.slice(accentFrom)), fill: 'none', stroke: opts.color || 'var(--series-1)', 'stroke-width': 1.75, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    var last = pts[pts.length - 1];
    el('circle', { cx: last[0], cy: last[1], r: 3.4, fill: 'var(--surface)', stroke: 'none' }, svg);
    el('circle', { cx: last[0], cy: last[1], r: 2.4, fill: opts.color || 'var(--series-1)' }, svg);
    return svg;
  }

  /* --------------------------------------------------------- line chart */
  function lineChart(spec) {
    var dates = spec.dates;
    var series = spec.series;                       // [{id,label,values,color,dashed,muted}]
    var format = spec.format || function (v) { return String(Math.round(v)); };
    var plotH = spec.height || 200;

    function render(width) {
      var m = { top: spec.annotations && spec.annotations.length ? 38 : 14, right: spec.endLabel === false ? 16 : 54, bottom: 26, left: 46 };
      var totalH = plotH + m.top + m.bottom;
      var iw = Math.max(60, width - m.left - m.right);
      var svg = el('svg', { width: width, height: totalH, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || spec.title || 'Chart' });
      var g = el('g', { transform: 'translate(' + m.left + ',' + m.top + ')' }, svg);

      var all = series.map(function (s) { return s.values; });
      if (spec.goal) all.push([spec.goal.value]);
      var e = V.extent(all);
      var pad = (e[1] - e[0]) * 0.16 || Math.abs(e[1] * 0.05) || 1;
      var lo = spec.zeroBased ? 0 : e[0] - pad, hi = e[1] + pad;
      var ticks = V.niceTicks(lo, hi, spec.tickCount || 4);
      if (ticks.length) { lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]); }

      var x = V.scale(0, dates.length - 1, 0, iw);
      var y = V.scale(lo, hi, plotH, 0);

      // grid — solid hairlines, one step off the surface, never dashed
      ticks.forEach(function (t) {
        el('line', { x1: 0, x2: iw, y1: y(t), y2: y(t), stroke: 'var(--grid)', 'stroke-width': 1 }, g);
        el('text', { x: -10, y: y(t) + 4, 'text-anchor': 'end', class: 'ax' }, g).textContent = format(t, true);
      });

      // goal rule — a real target only, never an invented one
      if (spec.goal) {
        el('line', { x1: 0, x2: iw, y1: y(spec.goal.value), y2: y(spec.goal.value), stroke: 'var(--ink-muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
        el('text', { x: iw - 2, y: y(spec.goal.value) - 6, 'text-anchor': 'end', class: 'ax ax-goal' }, g).textContent = spec.goal.label;
      }

      // x labels — first, the period boundary if any, and last
      var xl = [0, dates.length - 1];
      if (spec.markIndex) xl.splice(1, 0, spec.markIndex);
      xl.forEach(function (i, n) {
        var t = el('text', { x: x(i), y: plotH + 17, class: 'ax', 'text-anchor': n === 0 ? 'start' : n === xl.length - 1 ? 'end' : 'middle' }, g);
        t.textContent = spec.xFormat ? spec.xFormat(dates[i]) : dates[i];
      });
      el('line', { x1: 0, x2: iw, y1: plotH, y2: plotH, stroke: 'var(--axis)', 'stroke-width': 1 }, g);

      // series — secondary ones first so the primary sits on top
      var ordered = series.slice().sort(function (a, b) { return (a.muted ? 0 : 1) - (b.muted ? 0 : 1); });
      var ptsById = {};
      ordered.forEach(function (s) {
        var pts = s.values.map(function (v, i) { return [x(i), y(v)]; });
        ptsById[s.id] = pts;
        if (s.fill && !s.muted) {
          el('path', {
            d: V.linePath(pts) + ' L' + pts[pts.length - 1][0] + ' ' + plotH + ' L' + pts[0][0] + ' ' + plotH + ' Z',
            fill: s.color, 'fill-opacity': 0.10, stroke: 'none'
          }, g);
        }
        el('path', {
          d: V.linePath(pts), fill: 'none', stroke: s.color,
          'stroke-width': s.muted ? 1.5 : 2,
          'stroke-dasharray': s.dashed ? '4 4' : null,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          opacity: s.muted ? 0.85 : 1
        }, g);
      });

      // annotations — a hairline to the axis and a small label. Subtle by
      // construction: no box, no leader, muted ink.
      // Annotation rules always draw; their labels are placed on one of two
      // rows only where they actually fit. A label with nowhere to go is
      // dropped rather than printed over its neighbour — the rule, the dot
      // and the tooltip still carry the event.
      var placeable = [];
      (spec.annotations || []).forEach(function (a) {
        var i = dates.indexOf(a.date);
        if (i < 0) return;
        var px = x(i);
        el('line', { x1: px, x2: px, y1: -6, y2: plotH, stroke: 'var(--hairline-strong)', 'stroke-width': 1 }, g);
        var dot = el('circle', { cx: px, cy: -6, r: 2.5, fill: 'var(--ink-muted)' }, g);
        var hitDot = el('circle', { cx: px, cy: -6, r: 11, fill: 'transparent', tabindex: '0', role: 'img' }, g);
        hitDot.setAttribute('aria-label', a.label + '. ' + (a.detail || '') + ' ' + (spec.xFormat ? spec.xFormat(a.date, true) : a.date));
        function onDot() { V.showTip(hitDot, [{ value: spec.xFormat ? spec.xFormat(a.date, true) : a.date, label: a.detail || '' }], a.label); }
        hitDot.addEventListener('pointerenter', onDot); hitDot.addEventListener('focus', onDot);
        hitDot.addEventListener('pointerleave', V.hideTip); hitDot.addEventListener('blur', V.hideTip);

        placeable.push({ a: a, px: px });
      });

      // Labels are placed newest-first, so when space runs out it is the
      // oldest event that loses its label rather than the one nearest the
      // change being reported.
      var rowStart = [Infinity, Infinity];
      placeable.slice().reverse().forEach(function (it) {
        var a = it.a, px = it.px;
        var w = a.label.length * 6.3 + 18;
        var anchor = px + w > iw ? 'end' : 'start';
        var left = anchor === 'end' ? px - w : px;
        if (left < 0) return;
        var slot = -1;
        for (var r = 0; r < 2; r++) if (left + w < rowStart[r]) { slot = r; break; }
        if (slot < 0) return;
        rowStart[slot] = left;
        var t = el('text', { x: px + (anchor === 'end' ? -6 : 6), y: -3 - slot * 12, class: 'ax ax-note', 'text-anchor': anchor }, g);
        t.textContent = a.label;
      });

      // the NORTH mark — where a change was detected. Clicking opens the
      // investigation behind it, so the chart and the panel are one product.
      var anomalyMark = null;
      if (spec.anomaly) {
        var ai = dates.indexOf(spec.anomaly.date);
        if (ai >= 0) {
          var s0 = series.find(function (s) { return !s.muted; }) || series[0];
          var ax = x(ai), ay = y(s0.values[ai]);
          var mark = anomalyMark = el('g', { class: 'anomaly' + (spec.anomaly.onOpen ? ' is-clickable' : ''), tabindex: spec.anomaly.onOpen ? '0' : null, role: spec.anomaly.onOpen ? 'button' : null }, g);
          if (spec.anomaly.onOpen) {
            mark.setAttribute('aria-label', spec.anomaly.label + '. Open investigation.');
            mark.addEventListener('click', spec.anomaly.onOpen);
            mark.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); spec.anomaly.onOpen(); } });
          }
          var hitZone = el('rect', { fill: 'transparent' }, mark);
          el('circle', { cx: ax, cy: ay, r: 7, fill: 'none', stroke: 'var(--north)', 'stroke-width': 1.25, opacity: 0.5 }, mark);
          el('circle', { cx: ax, cy: ay, r: 4.6, fill: 'var(--surface)' }, mark);
          el('circle', { cx: ax, cy: ay, r: 3.2, fill: 'var(--north)' }, mark);
          // Put the label on the side with room, and below the point when the
          // point sits high, so it never lands on the line or the goal rule.
          var goalY = spec.goal ? y(spec.goal.value) : null;
          var below = ay < plotH * 0.55;
          var ly = below ? ay + 20 : ay - 14;
          if (goalY !== null && Math.abs(ly - goalY) < 14) ly = below ? goalY + 18 : goalY - 18;
          var right = ax < iw - 130;
          var lab = el('text', { x: ax + (right ? 12 : -12), y: ly, class: 'ax ax-north', 'text-anchor': right ? 'start' : 'end' }, mark);
          lab.textContent = spec.anomaly.label;
          // The label is part of the control, so the hit area spans the mark
          // and its text — not just the eight pixels of the dot.
          // One region covering the mark and its label: both are the control,
          // and a target you have to hit dead-centre is not one. Inside it the
          // reader gets the detection rather than the crosshair, which is the
          // right answer for the one point on the chart NORTH is pointing at.
          var labW = spec.anomaly.label.length * 6.3 + 20;
          var top = Math.min(ay, ly - 12) - 8;
          var bot = Math.max(ay, ly) + 10;
          hitZone.setAttribute('x', (right ? ax - 14 : ax - labW - 2));
          hitZone.setAttribute('y', top);
          hitZone.setAttribute('width', labW + 16);
          hitZone.setAttribute('height', bot - top);
          if (spec.anomaly.detail) {
            var onMark = function () {
              V.showTip(mark, [{ color: 'var(--north)', value: spec.xFormat ? spec.xFormat(spec.anomaly.date, true) : spec.anomaly.date, label: spec.anomaly.detail }], spec.anomaly.label);
            };
            mark.addEventListener('pointerenter', onMark);
            mark.addEventListener('focus', onMark);
            mark.addEventListener('pointerleave', V.hideTip);
            mark.addEventListener('blur', V.hideTip);
          }
        }
      }

      // end dot + direct label on the primary series
      var primary = series.find(function (s) { return !s.muted; }) || series[0];
      if (spec.endLabel !== false && primary) {
        var p = ptsById[primary.id][ptsById[primary.id].length - 1];
        el('circle', { cx: p[0], cy: p[1], r: 5.5, fill: 'var(--surface)' }, g);
        el('circle', { cx: p[0], cy: p[1], r: 4, fill: primary.color }, g);
        var t2 = el('text', { x: p[0] + 9, y: p[1] + 4, class: 'ax ax-end' }, g);
        t2.textContent = format(primary.values[primary.values.length - 1]);
      }

      // hover layer — the crosshair finds the X, one readout lists every series
      var cross = el('line', { y1: 0, y2: plotH, stroke: 'var(--hairline-strong)', 'stroke-width': 1, opacity: 0 }, g);
      var dots = series.map(function (s) {
        var d = el('circle', { r: 4, fill: s.color, stroke: 'var(--surface)', 'stroke-width': 2, opacity: 0 }, g);
        return d;
      });
      var hit = el('rect', { x: 0, y: 0, width: iw, height: plotH, fill: 'transparent', tabindex: '0', role: 'application', 'aria-label': (spec.title || 'Series') + '. Use arrow keys to read values.' }, g);
      var focusIdx = dates.length - 1;

      function place(i) {
        i = Math.max(0, Math.min(dates.length - 1, i));
        focusIdx = i;
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
        series.forEach(function (s, n) {
          dots[n].setAttribute('cx', x(i)); dots[n].setAttribute('cy', y(s.values[i])); dots[n].setAttribute('opacity', 1);
        });
        var box = svg.getBoundingClientRect();
        V.showTipAt(box.left + m.left + x(i), box.top + m.top + y(series[0].values[i]),
          series.map(function (s) {
            return { color: s.color, dashed: s.dashed, value: format(s.values[i]), label: s.label };
          }),
          spec.xFormat ? spec.xFormat(dates[i], true) : dates[i]);
      }
      function clear() { cross.setAttribute('opacity', 0); dots.forEach(function (d) { d.setAttribute('opacity', 0); }); V.hideTip(); }

      hit.addEventListener('pointermove', function (ev) {
        var box = svg.getBoundingClientRect();
        place(Math.round(x.invert(ev.clientX - box.left - m.left)));
      });
      hit.addEventListener('pointerleave', clear);
      hit.addEventListener('focus', function () { place(focusIdx); });
      hit.addEventListener('blur', clear);
      hit.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight') { place(focusIdx + 1); ev.preventDefault(); }
        else if (ev.key === 'ArrowLeft') { place(focusIdx - 1); ev.preventDefault(); }
        else if (ev.key === 'Home') { place(0); ev.preventDefault(); }
        else if (ev.key === 'End') { place(dates.length - 1); ev.preventDefault(); }
      });
      if (spec.onPointClick) hit.addEventListener('click', function () { spec.onPointClick(focusIdx); });

      // The NORTH mark is a control, so it has to sit above the crosshair's
      // hit layer — otherwise the layer swallows the click that opens the
      // investigation.
      if (anomalyMark) g.appendChild(anomalyMark);
      return svg;
    }

    var lg = series.length > 1
      ? V.legend(series.map(function (s) { return { color: s.color, label: s.label, dashed: s.dashed }; }))
      : null;

    // Table view: sampled so the twin stays readable, never a 180-row dump.
    var stride = Math.max(1, Math.ceil(dates.length / 24));
    var rows = [];
    for (var i = 0; i < dates.length; i += stride) {
      rows.push([spec.xFormat ? spec.xFormat(dates[i], true) : dates[i]].concat(series.map(function (s) { return format(s.values[i]); })));
    }
    var lastI = dates.length - 1;
    if ((lastI) % stride !== 0) rows.push([spec.xFormat ? spec.xFormat(dates[lastI], true) : dates[lastI]].concat(series.map(function (s) { return format(s.values[lastI]); })));

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption,
      className: spec.className, legend: lg, render: render,
      table: { columns: ['Date'].concat(series.map(function (s) { return s.label; })), rows: rows }
    });
  }

  global.Viz.sparkline = sparkline;
  global.Viz.lineChart = lineChart;
})(typeof window !== 'undefined' ? window : globalThis);
