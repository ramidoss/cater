/* NORTH — comparison marks: bridge, funnel, segments, ranked bars,
 * distribution, topic deltas, cohorts and the goal meter.
 */
(function (global) {
  'use strict';
  var V = global.Viz, el = V.el, h = V.h;

  var BAR = 22;          // <= 24px: the band's leftover is air, not ink
  var GAP = 2;           // the surface gap that separates touching marks
  var R = 4;             // rounded data end

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  /* Pick ink or white for a label set inside a coloured fill. */
  function inkOn(hex) {
    var c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    var L = 0.2126 * f(parseInt(c.slice(0, 2), 16)) + 0.7152 * f(parseInt(c.slice(2, 4), 16)) + 0.0722 * f(parseInt(c.slice(4, 6), 16));
    return L > 0.42 ? '#0b0b0b' : '#ffffff';
  }
  /* Measure before placing: a label that will not fit is never clipped. */
  function fits(text, px, fontPx) { return text.length * fontPx * 0.56 + 16 < px; }

  /* ------------------------------------------------------------ bridge
   * What actually changed our MRR. Only the four movements are drawn as
   * bars, and they encode differences, so the window can sit off zero
   * without misstating anything. The two totals are reference rules with
   * their values written out — never truncated bars. */
  function bridge(spec) {
    var items = spec.items, start = spec.start, end = spec.end;
    var fmt = spec.format;

    function render(width) {
      var m = { top: 26, right: 14, bottom: 40, left: 14 };
      var plotH = spec.height || 190;
      var svg = el('svg', { width: width, height: plotH + m.top + m.bottom, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'MRR movement' });
      var g = el('g', { transform: 'translate(' + m.left + ',' + m.top + ')' }, svg);
      var iw = Math.max(60, width - m.left - m.right);

      var run = [start], v = start;
      items.forEach(function (it) { v += it.value; run.push(v); });
      var lo = Math.min.apply(null, run), hi = Math.max.apply(null, run);
      var pad = (hi - lo) * 0.35 || 1;
      var y = V.scale(lo - pad, hi + pad, plotH, 0);

      var cols = items.length + 2;
      var band = iw / cols;
      var cx = function (i) { return band * i + band / 2; };

      // starting and ending totals — rules, with the value written out
      [[0, start, spec.startLabel], [cols - 1, end, spec.endLabel]].forEach(function (t) {
        var yy = y(t[1]);
        el('line', { x1: cx(t[0]) - band * 0.42, x2: cx(t[0]) + band * 0.42, y1: yy, y2: yy, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
        var lb = el('text', { x: cx(t[0]), y: yy - 10, class: 'ax ax-end', 'text-anchor': 'middle' }, g);
        lb.textContent = fmt(t[1]);
        var sub = el('text', { x: cx(t[0]), y: plotH + 17, class: 'ax', 'text-anchor': 'middle' }, g);
        sub.textContent = t[2];
      });

      items.forEach(function (it, i) {
        var col = i + 1;
        var y0 = y(run[i]), y1 = y(run[i + 1]);
        var up = it.value > 0;
        var top = Math.min(y0, y1), hgt = Math.abs(y1 - y0);
        var col0 = up ? 'var(--good)' : 'var(--critical)';
        var bw = Math.min(BAR, band - 18);
        var gx = cx(col) - bw / 2;

        // connector from the previous running total
        el('line', { x1: cx(col - 1) + (i === 0 ? band * 0.42 : bw / 2), x2: gx, y1: y0, y2: y0, stroke: 'var(--hairline-strong)', 'stroke-width': 1 }, g);

        var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
        grp.setAttribute('aria-label', it.label + ' ' + fmt(it.value) + '. ' + it.detail);
        el('rect', { x: gx - 8, y: top - 12, width: bw + 16, height: hgt + 24, fill: 'transparent' }, grp);
        el('path', { d: V.barPath(gx, top, bw, hgt, R, up ? 'up' : 'down'), fill: col0 }, grp);

        var lab = el('text', { x: cx(col), y: up ? top - 8 : top + hgt + 15, class: 'ax ax-end', 'text-anchor': 'middle' }, grp);
        lab.textContent = (up ? '+' : '−') + fmt(Math.abs(it.value));
        var nm = el('text', { x: cx(col), y: plotH + 17, class: 'ax', 'text-anchor': 'middle' }, g);
        nm.textContent = it.label;

        function on() { V.showTip(grp, [{ color: col0, value: (up ? '+' : '−') + fmt(Math.abs(it.value)), label: it.detail }], it.label); }
        grp.addEventListener('pointerenter', on);
        grp.addEventListener('focus', on);
        grp.addEventListener('pointerleave', V.hideTip);
        grp.addEventListener('blur', V.hideTip);
      });

      // last connector into the ending rule
      el('line', { x1: cx(cols - 2) + Math.min(BAR, band - 18) / 2, x2: cx(cols - 1) - band * 0.42, y1: y(run[run.length - 1]), y2: y(end), stroke: 'var(--hairline-strong)', 'stroke-width': 1 }, g);
      return svg;
    }

    var rows = [[spec.startLabel, fmt(start)]].concat(
      items.map(function (i) { return [i.label, (i.value > 0 ? '+' : '−') + fmt(Math.abs(i.value))]; })
    ).concat([[spec.endLabel, fmt(end)]]);

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption, className: spec.className,
      legend: V.legend([{ color: 'var(--good)', label: 'Adds to MRR', shape: 'rect' }, { color: 'var(--critical)', label: 'Removes from MRR', shape: 'rect' }]),
      render: render, table: { columns: ['Movement', 'Amount'], rows: rows }
    });
  }

  /* ------------------------------------------------------------- funnel
   * One hue for every step — length already carries the order. The story
   * is a single broken transition, so that is what gets the emphasis. */
  function funnel(spec) {
    var rows = spec.rows;

    function render(width) {
      var rowH = 62, m = { left: 0, right: 0, top: 4 };
      var labelW = 176, tailW = 120;
      var barMax = Math.max(80, width - labelW - tailW);
      var svg = el('svg', { width: width, height: rows.length * rowH + 8, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'Activation funnel' });
      var g = el('g', { transform: 'translate(0,' + m.top + ')' }, svg);

      rows.forEach(function (r, i) {
        var yTop = i * rowH;
        var w = (r.curCumulative / 100) * barMax;
        var wPrev = (r.prevCumulative / 100) * barMax;
        var worst = spec.worstId === r.id;

        var name = el('text', { x: 0, y: yTop + 17, class: 'fn-name' }, g);
        name.textContent = r.label;
        var cnt = el('text', { x: 0, y: yTop + 35, class: 'fn-count' }, g);
        cnt.textContent = r.cur.toLocaleString('en-US') + ' users';

        var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
        grp.setAttribute('aria-label', r.label + ': ' + r.cur.toLocaleString('en-US') + ' users, ' +
          r.curCumulative.toFixed(1) + '% of signups; previous period ' + r.prevCumulative.toFixed(1) + '%');
        el('rect', { x: labelW - 8, y: yTop, width: barMax + 16, height: 42, fill: 'transparent' }, grp);
        el('path', { d: V.barPath(labelW, yTop + 8, w, 26, R, 'right'), fill: 'var(--series-1)' }, grp);

        // previous period as a tick on the same scale — secondary by design
        el('line', { x1: labelW + wPrev, x2: labelW + wPrev, y1: yTop + 3, y2: yTop + 39, stroke: 'var(--de-emphasis)', 'stroke-width': 2, 'stroke-linecap': 'round' }, grp);

        var pct = el('text', { x: labelW + Math.max(w, wPrev) + 12, y: yTop + 26, class: 'fn-pct' }, g);
        pct.textContent = r.curCumulative.toFixed(0) + '%';

        function on() {
          V.showTip(grp, [
            { color: cssVar('--series-1'), value: r.cur.toLocaleString('en-US') + ' · ' + r.curCumulative.toFixed(1) + '%', label: 'This period' },
            { color: cssVar('--de-emphasis'), value: r.prev.toLocaleString('en-US') + ' · ' + r.prevCumulative.toFixed(1) + '%', label: 'Previous 30 days' }
          ], r.label);
        }
        grp.addEventListener('pointerenter', on); grp.addEventListener('focus', on);
        grp.addEventListener('pointerleave', V.hideTip); grp.addEventListener('blur', V.hideTip);

        // the transition between this step and the next
        if (i < rows.length - 1) {
          var nxt = rows[i + 1];
          var badWorst = spec.worstId === nxt.id;
          var ty = yTop + 47;
          el('path', { d: 'M' + (labelW + 9) + ' ' + (ty - 4) + 'v9', stroke: badWorst ? 'var(--critical)' : 'var(--axis)', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
          var tt = el('text', { x: labelW + 20, y: ty + 8 }, g);
          var a1 = el('tspan', { class: badWorst ? 'fn-step is-worst' : 'fn-step' }, tt);
          a1.textContent = nxt.curStepRate.toFixed(1) + '% continue';
          var a2 = el('tspan', { class: badWorst ? 'fn-delta is-worst' : 'fn-delta', dx: 10 }, tt);
          a2.textContent = (nxt.stepDelta > 0 ? '+' : '−') + Math.abs(nxt.stepDelta).toFixed(1) + 'pp vs previous 30 days';
        }
      });
      return svg;
    }

    var worst = rows.find(function (r) { return r.id === spec.worstId; });
    return V.figure({
      title: spec.title, question: spec.question,
      caption: spec.caption || (worst && worst.fromLabel
        ? 'The largest abnormal drop is ' + worst.fromLabel.toLowerCase() + ' → ' + worst.label.toLowerCase() +
          ': ' + worst.prevStepRate.toFixed(1) + '% → ' + worst.curStepRate.toFixed(1) + '%. Every other step is within half a point of the previous period.'
        : null),
      className: spec.className,
      legend: V.legend([
        { color: 'var(--series-1)', label: 'This period', shape: 'rect' },
        { color: 'var(--de-emphasis)', label: 'Previous 30 days', shape: 'tick' }
      ]),
      render: render,
      table: {
        columns: ['Step', 'Users', '% of signups', 'Prev %', 'Step conversion', 'vs prev'],
        rows: rows.map(function (r) {
          return [r.label, r.cur.toLocaleString('en-US'), r.curCumulative.toFixed(1) + '%', r.prevCumulative.toFixed(1) + '%',
            r.curStepRate.toFixed(1) + '%', (r.stepDelta > 0 ? '+' : '−') + Math.abs(r.stepDelta).toFixed(1) + 'pp'];
        })
      }
    });
  }

  /* ---------------------------------------------------- segment compare
   * Horizontal bars, one hue, previous period as a tick. The second column
   * is contribution to the blended change — weight x the segment's own move
   * — because a segment can move a long way and still barely matter. */
  function segments(spec) {
    var segs = spec.segments;
    var showContribution = spec.showContribution !== false;

    function render(width) {
      var rowH = 46;
      var labelW = Math.min(158, Math.max(112, width * 0.32));
      var contribW = showContribution ? 108 : 0;
      var valueW = 62;
      var barMax = Math.max(60, width - labelW - valueW - contribW - 20);
      var maxV = Math.max.apply(null, segs.map(function (s) { return Math.max(s.cur, s.prev); }));
      var svg = el('svg', { width: width, height: segs.length * rowH + 24, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'Segment comparison' });
      var g = el('g', { transform: 'translate(0,20)' }, svg);
      var lead = segs.reduce(function (a, b) { return Math.abs(b.contribution) > Math.abs(a.contribution) ? b : a; }, segs[0]);

      segs.forEach(function (s, i) {
        var y = i * rowH;
        var isLead = showContribution && s.id === lead.id;
        var nm = el('text', { x: 0, y: y + 17, class: 'sg-name' + (isLead ? ' is-lead' : '') }, g);
        nm.textContent = s.label;
        if (s.sub) { var sb = el('text', { x: 0, y: y + 32, class: 'sg-sub' }, g); sb.textContent = s.sub; }

        var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
        grp.setAttribute('aria-label', s.label + ': ' + s.cur.toFixed(1) + '%, previous ' + s.prev.toFixed(1) +
          '%, change ' + (s.delta > 0 ? 'up ' : 'down ') + Math.abs(s.delta).toFixed(1) + ' points');
        el('rect', { x: labelW - 6, y: y, width: barMax + valueW + 12, height: 38, fill: 'transparent' }, grp);
        var w = (s.cur / maxV) * barMax, wp = (s.prev / maxV) * barMax;
        el('path', { d: V.barPath(labelW, y + 8, w, BAR, R, 'right'), fill: 'var(--series-1)' }, grp);
        el('line', { x1: labelW + wp, x2: labelW + wp, y1: y + 4, y2: y + 34, stroke: 'var(--de-emphasis)', 'stroke-width': 2, 'stroke-linecap': 'round' }, grp);
        var vt = el('text', { x: labelW + Math.max(w, wp) + 10, y: y + 24, class: 'sg-val' }, g);
        vt.textContent = s.cur.toFixed(0) + '%';

        function on() {
          V.showTip(grp, [
            { color: cssVar('--series-1'), value: s.cur.toFixed(1) + '%', label: 'This period' },
            { color: cssVar('--de-emphasis'), value: s.prev.toFixed(1) + '%', label: 'Previous 30 days' },
            { value: (s.delta > 0 ? '+' : '−') + Math.abs(s.delta).toFixed(1) + 'pp', label: (s.rel > 0 ? '+' : '−') + Math.abs(s.rel).toFixed(1) + '% relative' }
          ], s.label);
        }
        grp.addEventListener('pointerenter', on); grp.addEventListener('focus', on);
        grp.addEventListener('pointerleave', V.hideTip); grp.addEventListener('blur', V.hideTip);

        if (showContribution) {
          var cx0 = width - contribW + 44;
          var maxC = Math.max.apply(null, segs.map(function (x) { return Math.abs(x.contribution); })) || 1;
          var cw = (Math.abs(s.contribution) / maxC) * 40;
          el('line', { x1: cx0, x2: cx0, y1: y + 4, y2: y + 34, stroke: 'var(--grid)', 'stroke-width': 1 }, g);
          el('path', {
            d: s.contribution < 0 ? V.barPath(cx0 - cw, y + 12, cw, 14, 3, 'left') : V.barPath(cx0, y + 12, cw, 14, 3, 'right'),
            fill: isLead ? 'var(--critical)' : 'var(--de-emphasis)'
          }, g);
          var ct = el('text', { x: cx0 + (s.contribution < 0 ? 8 : cw + 8), y: y + 24, class: 'sg-contrib' + (isLead ? ' is-lead' : '') }, g);
          ct.textContent = (s.contribution > 0 ? '+' : '−') + Math.abs(s.contribution).toFixed(1) + 'pp';
        }
      });

      if (showContribution) {
        // A column header, right-aligned to the plot edge — a caption slung
        // under the column would run past it.
        var hd = el('text', { x: width, y: -8, class: 'sg-axis', 'text-anchor': 'end' }, g);
        hd.textContent = 'contribution to ' + spec.totalLabel;
      }
      return svg;
    }

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption, className: spec.className,
      legend: V.legend([
        { color: 'var(--series-1)', label: 'This period', shape: 'rect' },
        { color: 'var(--de-emphasis)', label: 'Previous 30 days', shape: 'tick' }
      ]),
      render: render,
      table: {
        columns: [spec.dimension || 'Segment', 'This period', 'Previous', 'Change', 'Relative', 'Share of signups', 'Contribution'],
        rows: segs.map(function (s) {
          return [s.label, s.cur.toFixed(1) + '%', s.prev.toFixed(1) + '%',
            (s.delta > 0 ? '+' : '−') + Math.abs(s.delta).toFixed(1) + 'pp',
            (s.rel > 0 ? '+' : '−') + Math.abs(s.rel).toFixed(1) + '%',
            Math.round(s.weight * 100) + '%',
            (s.contribution > 0 ? '+' : '−') + Math.abs(s.contribution).toFixed(2) + 'pp'];
        })
      }
    });
  }

  /* -------------------------------------------------------- ranked bars
   * Feature adoption. Ranked, one hue, previous period as a tick, and the
   * change spelled out — never a pie of things that are not one whole. */
  function rankedBars(spec) {
    var items = spec.items;

    function render(width) {
      var rowH = 38;
      var labelW = Math.min(150, Math.max(104, width * 0.3));
      var deltaW = 76;
      var barMax = Math.max(60, width - labelW - deltaW - 56);
      var maxV = Math.max.apply(null, items.map(function (i) { return Math.max(i.cur, i.prev); }));
      var svg = el('svg', { width: width, height: items.length * rowH + 10, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'Ranked comparison' });
      var g = el('g', { transform: 'translate(0,6)' }, svg);

      items.forEach(function (it, i) {
        var y = i * rowH;
        var nm = el('text', { x: 0, y: y + 18, class: 'sg-name' }, g);
        nm.textContent = it.label;
        var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
        grp.setAttribute('aria-label', it.label + ': ' + it.cur + '%, previous ' + it.prev + '%, ' +
          (it.delta >= 0 ? 'up ' : 'down ') + Math.abs(it.delta) + ' points');
        el('rect', { x: labelW - 6, y: y, width: barMax + 60, height: rowH - GAP, fill: 'transparent' }, grp);
        var w = (it.cur / maxV) * barMax, wp = (it.prev / maxV) * barMax;
        el('path', { d: V.barPath(labelW, y + 6, w, 16, 3, 'right'), fill: 'var(--series-1)' }, grp);
        el('line', { x1: labelW + wp, x2: labelW + wp, y1: y + 2, y2: y + 26, stroke: 'var(--de-emphasis)', 'stroke-width': 2, 'stroke-linecap': 'round' }, grp);
        var vt = el('text', { x: labelW + Math.max(w, wp) + 10, y: y + 19, class: 'sg-val is-sm' }, g);
        vt.textContent = it.cur + '%';
        var tone = it.delta === 0 ? 'is-flat' : (it.delta > 0) === (spec.higherIsBetter !== false) ? 'is-good' : 'is-bad';
        var dt = el('text', { x: width, y: y + 19, class: 'sg-delta ' + tone, 'text-anchor': 'end' }, g);
        dt.textContent = (it.delta > 0 ? '+' : it.delta < 0 ? '−' : '') + Math.abs(it.delta) + 'pp';

        function on() {
          V.showTip(grp, [
            { color: cssVar('--series-1'), value: it.cur + '%', label: 'This period' },
            { color: cssVar('--de-emphasis'), value: it.prev + '%', label: 'Previous 30 days' }
          ], it.label);
        }
        grp.addEventListener('pointerenter', on); grp.addEventListener('focus', on);
        grp.addEventListener('pointerleave', V.hideTip); grp.addEventListener('blur', V.hideTip);
      });
      return svg;
    }

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption, className: spec.className,
      legend: V.legend([
        { color: 'var(--series-1)', label: 'This period', shape: 'rect' },
        { color: 'var(--de-emphasis)', label: 'Previous 30 days', shape: 'tick' }
      ]),
      render: render,
      table: {
        columns: [spec.dimension || 'Item', 'This period', 'Previous', 'Change'],
        rows: items.map(function (i) { return [i.label, i.cur + '%', i.prev + '%', (i.delta > 0 ? '+' : i.delta < 0 ? '−' : '') + Math.abs(i.delta) + 'pp']; })
      }
    });
  }

  /* ------------------------------------------------------- distribution
   * One segmented bar — three parts of one whole, which is the only case
   * where part-to-whole is honest. Not a donut. */
  function distribution(spec) {
    var bands = spec.bands;
    var toneVar = { good: '--good', warning: '--warning', critical: '--critical' };

    function render(width) {
      var barH = 34, svgH = barH + 66;
      var svg = el('svg', { width: width, height: svgH, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'Distribution' });
      var g = el('g', { transform: 'translate(0,4)' }, svg);
      var total = bands.reduce(function (s, b) { return s + b.cur; }, 0);
      var x = 0;
      bands.forEach(function (b, i) {
        var w = (b.cur / total) * width - (i < bands.length - 1 ? GAP : 0);
        var first = i === 0, last = i === bands.length - 1;
        var col = 'var(' + toneVar[b.tone] + ')';
        var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
        grp.setAttribute('aria-label', b.label + ': ' + b.cur.toLocaleString('en-US') + ' customers, ' +
          b.curShare.toFixed(0) + '%, ' + (b.shareDelta >= 0 ? 'up ' : 'down ') + Math.abs(b.shareDelta).toFixed(1) + ' points');
        var d = first ? V.barPath(x, 0, w, barH, R, 'left').replace(/^M[^h]*h/, 'M' + x + ' ' + 0 + 'h')
          : last ? V.barPath(x, 0, w, barH, R, 'right') : 'M' + x + ' 0h' + w + 'v' + barH + 'h' + (-w) + 'z';
        if (first) d = 'M' + (x + R) + ' 0h' + (w - R) + 'v' + barH + 'h' + (-(w - R)) + 'a' + R + ' ' + R + ' 0 0 1 ' + (-R) + ' ' + (-R) + 'v' + (-(barH - 2 * R)) + 'a' + R + ' ' + R + ' 0 0 1 ' + R + ' ' + (-R) + 'z';
        el('path', { d: d, fill: col }, grp);
        // in-fill label only when it measures as fitting, with ink chosen by luminance
        var pctText = b.curShare.toFixed(0) + '%';
        if (fits(pctText, w, 12)) {
          var t = el('text', { x: x + 10, y: barH / 2 + 4, class: 'dist-in', fill: inkOn(cssVar(toneVar[b.tone]) || '#888') }, grp);
          t.textContent = pctText;
        }
        function on() {
          V.showTip(grp, [
            { color: cssVar(toneVar[b.tone]), value: b.cur.toLocaleString('en-US') + ' · ' + b.curShare.toFixed(1) + '%', label: 'This period' },
            { color: cssVar('--de-emphasis'), value: b.prev.toLocaleString('en-US') + ' · ' + b.prevShare.toFixed(1) + '%', label: 'Previous 30 days' }
          ], b.label);
        }
        grp.addEventListener('pointerenter', on); grp.addEventListener('focus', on);
        grp.addEventListener('pointerleave', V.hideTip); grp.addEventListener('blur', V.hideTip);
        x += (b.cur / total) * width;
      });

      // key beneath the bar: swatch, label, count and the share move
      var colW = width / bands.length;
      bands.forEach(function (b, i) {
        var bx = i * colW;
        el('rect', { x: bx, y: barH + 20, width: 8, height: 8, rx: 2, fill: 'var(' + toneVar[b.tone] + ')' }, g);
        var l = el('text', { x: bx + 14, y: barH + 28, class: 'dist-key' }, g); l.textContent = b.label;
        var dtone = b.tone === 'good' ? (b.shareDelta >= 0 ? 'is-good' : 'is-bad') : (b.shareDelta > 0 ? 'is-bad' : 'is-good');
        var c = el('text', { x: bx, y: barH + 46 }, g);
        var c1 = el('tspan', { class: 'dist-num' }, c); c1.textContent = b.cur.toLocaleString('en-US');
        var c2 = el('tspan', { class: 'dist-delta ' + (b.shareDelta === 0 ? 'is-flat' : dtone), dx: 6 }, c);
        c2.textContent = (b.shareDelta > 0 ? '+' : b.shareDelta < 0 ? '−' : '') + Math.abs(b.shareDelta).toFixed(1) + 'pp';
      });
      return svg;
    }

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption, className: spec.className,
      render: render,
      table: {
        columns: ['Band', 'Customers', 'Share', 'Previous share', 'Change', 'Definition'],
        rows: bands.map(function (b) {
          return [b.label, b.cur.toLocaleString('en-US'), b.curShare.toFixed(1) + '%', b.prevShare.toFixed(1) + '%',
            (b.shareDelta > 0 ? '+' : '−') + Math.abs(b.shareDelta).toFixed(1) + 'pp', b.definition];
        })
      }
    });
  }

  /* --------------------------------------------------------- topic delta
   * The interesting thing about support volume is which problem is growing,
   * so the chart plots the change and keeps the total as context. */
  function topicDeltas(spec) {
    // A residual bucket is not a topic: it stays in the table, out of the plot,
    // and is named in the caption. Otherwise "Other" wins the chart on a
    // number nobody can act on.
    var residual = spec.residualId ? spec.items.filter(function (i) { return i.id === spec.residualId; })[0] : null;
    var items = spec.items
      .filter(function (i) { return !residual || i.id !== residual.id; })
      .sort(function (a, b) { return b.rel - a.rel; });

    function render(width) {
      var rowH = 40;
      var countW = 54;                       // volume lives on the right rail
      var labelW = Math.min(190, Math.max(120, width * 0.30));
      var plotR = width - countW;
      // The zero axis sits where the two arms actually need it, and the scale
      // is whatever makes the longest bar plus its label fit the plot.
      var up = items.reduce(function (m, i) { return Math.max(m, i.rel); }, 0.001);
      var down = items.reduce(function (m, i) { return Math.max(m, -i.rel); }, 0.001);
      var plotW = Math.max(60, plotR - labelW - 52);
      var unit = plotW / (up + down);
      var axisX = labelW + 26 + down * unit;
      var svg = el('svg', { width: width, height: items.length * rowH + 40, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'Change by topic' });
      var g = el('g', { transform: 'translate(0,20)' }, svg);
      el('line', { x1: axisX, x2: axisX, y1: -6, y2: items.length * rowH - 6, stroke: 'var(--axis)', 'stroke-width': 1 }, g);
      var ch = el('text', { x: width, y: -8, class: 'sg-axis', 'text-anchor': 'end' }, g);
      ch.textContent = 'conversations';

      items.forEach(function (it, i) {
        var y = i * rowH;
        var nm = el('text', { x: 0, y: y + 18, class: 'sg-name' }, g); nm.textContent = it.label;
        var ct = el('text', { x: width, y: y + 18, class: 'tp-count', 'text-anchor': 'end' }, g);
        ct.textContent = it.cur.toLocaleString('en-US');
        var up = it.rel > 0;
        var good = up === (spec.higherIsBetter === true);
        var col = it.rel === 0 ? 'var(--de-emphasis)' : good ? 'var(--good)' : 'var(--critical)';
        var w = Math.abs(it.rel) * unit;
        var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
        grp.setAttribute('aria-label', it.label + ': ' + it.cur + ' conversations, ' +
          (up ? 'up ' : 'down ') + Math.abs(it.rel).toFixed(0) + '% from ' + it.prev);
        el('rect', { x: 0, y: y, width: width, height: rowH - GAP, fill: 'transparent' }, grp);
        el('path', { d: up ? V.barPath(axisX, y + 7, w, 14, 3, 'right') : V.barPath(axisX - w, y + 7, w, 14, 3, 'left'), fill: col }, grp);
        var lt = el('text', { x: up ? axisX + w + 8 : axisX - w - 8, y: y + 19, class: 'sg-delta ' + (good ? 'is-good' : 'is-bad'), 'text-anchor': up ? 'start' : 'end' }, g);
        lt.textContent = (up ? '+' : '−') + Math.abs(it.rel).toFixed(0) + '%';

        function on() {
          V.showTip(grp, [
            { color: col, value: it.cur.toLocaleString('en-US'), label: 'This period' },
            { color: cssVar('--de-emphasis'), value: it.prev.toLocaleString('en-US'), label: 'Previous 30 days' },
            { value: (it.delta > 0 ? '+' : '−') + Math.abs(it.delta), label: 'conversations' }
          ], it.label);
        }
        grp.addEventListener('pointerenter', on); grp.addEventListener('focus', on);
        grp.addEventListener('pointerleave', V.hideTip); grp.addEventListener('blur', V.hideTip);
      });
      var ax = el('text', { x: axisX, y: items.length * rowH + 8, class: 'sg-axis', 'text-anchor': 'middle' }, g);
      ax.textContent = 'no change vs previous 30 days';
      return svg;
    }

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption, className: spec.className,
      render: render,
      table: {
        columns: ['Topic', 'This period', 'Previous', 'Change', 'Relative'],
        rows: spec.items.slice().sort(function (a, b) { return b.rel - a.rel; }).map(function (i) {
          return [i.label, i.cur, i.prev, (i.delta > 0 ? '+' : '−') + Math.abs(i.delta),
            (i.rel > 0 ? '+' : '−') + Math.abs(i.rel).toFixed(0) + '%'];
        })
      }
    });
  }

  /* ------------------------------------------------------------ cohorts
   * A genuine magnitude grid, so a single-hue sequential ramp. Detail only
   * — never on the overview. */
  function cohortGrid(spec) {
    var ramp = ['--ramp-0', '--ramp-1', '--ramp-2', '--ramp-3', '--ramp-4'];
    function shade(v) {
      // 100 is always the anchor column; the rest step by retention level
      var t = Math.max(0, Math.min(1, (v - 60) / 40));
      return 'var(' + ramp[Math.min(ramp.length - 1, Math.floor(t * ramp.length))] + ')';
    }

    function render(width) {
      var labelW = 92, cellH = 34, headH = 26;
      var n = spec.periods.length;
      var cellW = Math.max(38, (width - labelW - 44) / n);
      var svg = el('svg', { width: width, height: headH + spec.rows.length * cellH + 34, class: 'chart', role: 'img', 'aria-label': spec.ariaLabel || 'Retention cohorts' });
      var g = el('g', {}, svg);

      spec.periods.forEach(function (p, i) {
        var t = el('text', { x: labelW + i * cellW + cellW / 2, y: 16, class: 'ch-head', 'text-anchor': 'middle' }, g);
        t.textContent = p;
      });

      spec.rows.forEach(function (r, ri) {
        var y = headH + ri * cellH;
        var lb = el('text', { x: 0, y: y + cellH / 2 + 4, class: 'ch-row' }, g); lb.textContent = r.cohort;
        r.values.forEach(function (v, ci) {
          var x = labelW + ci * cellW;
          var fill = shade(v);
          var grp = el('g', { class: 'hit', tabindex: '0', role: 'img' }, g);
          grp.setAttribute('aria-label', r.cohort + ' at ' + spec.periods[ci] + ': ' + v + '% retained of ' + r.size + ' accounts');
          el('rect', { x: x + GAP / 2, y: y + GAP / 2, width: cellW - GAP, height: cellH - GAP, rx: 3, fill: fill }, grp);
          var resolved = getComputedStyle(document.documentElement).getPropertyValue(fill.slice(4, -1)).trim();
          var t2 = el('text', { x: x + cellW / 2, y: y + cellH / 2 + 4, class: 'ch-cell', 'text-anchor': 'middle', fill: inkOn(resolved || '#888') }, grp);
          t2.textContent = v;
          function on() { V.showTip(grp, [{ color: resolved, value: v + '%', label: 'retained at ' + spec.periods[ci] }, { value: r.size.toLocaleString('en-US'), label: 'accounts in cohort' }], r.cohort); }
          grp.addEventListener('pointerenter', on); grp.addEventListener('focus', on);
          grp.addEventListener('pointerleave', V.hideTip); grp.addEventListener('blur', V.hideTip);
        });
      });

      // scale legend — a sequential encoding always ships one
      var ly = headH + spec.rows.length * cellH + 16;
      var lo = el('text', { x: labelW, y: ly + 9, class: 'sg-axis', 'text-anchor': 'end' }, g); lo.textContent = '60%';
      ramp.forEach(function (r, i) {
        el('rect', { x: labelW + 8 + i * 24, y: ly, width: 22, height: 9, rx: 2, fill: 'var(' + r + ')' }, g);
      });
      var hi = el('text', { x: labelW + 8 + ramp.length * 24 + 6, y: ly + 9, class: 'sg-axis' }, g); hi.textContent = '100% retained';
      return svg;
    }

    return V.figure({
      title: spec.title, question: spec.question, caption: spec.caption, className: spec.className,
      render: render,
      table: {
        columns: ['Cohort', 'Accounts'].concat(spec.periods),
        rows: spec.rows.map(function (r) {
          return [r.cohort, r.size].concat(spec.periods.map(function (_, i) { return r.values[i] === undefined ? '—' : r.values[i] + '%'; }));
        })
      }
    });
  }

  /* -------------------------------------------------------------- meter
   * Progress toward a target that genuinely exists. The unfilled track is a
   * lighter step of the same ramp, so state reads across the whole bar. */
  function meter(opts) {
    var pct = Math.max(0, Math.min(100, (opts.value / opts.goal) * 100));
    var gap = opts.goal - opts.value;
    var wrap = h('div', { class: 'meter' });
    var track = h('div', { class: 'meter-track', role: 'meter', 'aria-valuenow': String(opts.value), 'aria-valuemin': '0', 'aria-valuemax': String(opts.goal), 'aria-label': opts.ariaLabel || 'Progress to goal' });
    var fill = h('div', { class: 'meter-fill' + (pct >= 100 ? ' is-met' : '') });
    fill.style.width = pct.toFixed(1) + '%';
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(h('div', { class: 'meter-foot' }, [
      h('span', { class: 'meter-goal', text: 'Goal ' + opts.formatGoal(opts.goal) }),
      h('span', { class: 'meter-gap' + (gap <= 0 ? ' is-met' : ''), text: opts.gapLabel(gap) })
    ]));
    return wrap;
  }

  Object.assign(global.Viz, {
    bridge: bridge, funnel: funnel, segments: segments, rankedBars: rankedBars,
    distribution: distribution, topicDeltas: topicDeltas, cohortGrid: cohortGrid,
    meter: meter, inkOn: inkOn, cssVar: cssVar
  });
})(typeof window !== 'undefined' ? window : globalThis);
