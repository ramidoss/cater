/* NORTH — chart primitives.
 *
 * Hand-rolled SVG. Every chart is built from the same small set of marks so
 * the whole product reads as one system: 2px lines, <=24px bars with a 4px
 * rounded data end, 8px markers with a 2px surface ring, hairline solid grid,
 * selective direct labels, and a table view behind every figure.
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------------ util

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];      // labels are data: never innerHTML
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function scale(d0, d1, r0, r1) {
    var span = d1 - d0 || 1;
    var f = function (v) { return r0 + ((v - d0) / span) * (r1 - r0); };
    f.invert = function (p) { return d0 + ((p - r0) / (r1 - r0 || 1)) * span; };
    return f;
  }

  /* Round tick values to numbers a reader recognises (0 / 1,000 / 2,000). */
  function niceTicks(min, max, count) {
    if (min === max) { min -= 1; max += 1; }
    var raw = (max - min) / Math.max(1, count);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
    var out = [], t = Math.ceil(min / step) * step;
    for (; t <= max + step * 0.001; t += step) out.push(Math.round(t / step) * step);
    return out;
  }

  function extent(arrays) {
    var lo = Infinity, hi = -Infinity;
    arrays.forEach(function (a) {
      a.forEach(function (v) { if (v === null || v === undefined || isNaN(v)) return; if (v < lo) lo = v; if (v > hi) hi = v; });
    });
    return [lo, hi];
  }

  function linePath(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
  }

  /* A bar whose data end is rounded 4px and whose baseline end stays square. */
  function barPath(x, y, w, hgt, r, dir) {
    r = Math.min(r, w / 2, Math.abs(hgt));
    if (Math.abs(hgt) < 0.6) return 'M' + x + ' ' + y + 'h' + w + 'v' + (hgt || 0.6) + 'h' + (-w) + 'z';
    if (dir === 'up')    return 'M' + x + ' ' + (y + hgt) + 'v' + (-(hgt - r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (-r) + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + (hgt - r) + 'z';
    if (dir === 'down')  return 'M' + x + ' ' + y + 'v' + (hgt - r) + 'a' + r + ' ' + r + ' 0 0 0 ' + r + ' ' + r + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 0 ' + r + ' ' + (-r) + 'v' + (-(hgt - r)) + 'z';
    if (dir === 'left')  return 'M' + (x + w) + ' ' + y + 'h' + (-(w - r)) + 'a' + r + ' ' + r + ' 0 0 0 ' + (-r) + ' ' + r + 'v' + (hgt - 2 * r) + 'a' + r + ' ' + r + ' 0 0 0 ' + r + ' ' + r + 'h' + (w - r) + 'z';
    return 'M' + x + ' ' + y + 'h' + (w - r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + (hgt - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + 'h' + (-(w - r)) + 'z';
  }

  // --------------------------------------------------------------- tooltip

  var tip = null;
  function tooltip() {
    if (!tip) { tip = h('div', { class: 'viz-tip', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(tip); }
    return tip;
  }
  function showTip(node, rows, title) {
    var t = tooltip();
    t.textContent = '';
    if (title) t.appendChild(h('div', { class: 'viz-tip-title', text: title }));
    rows.forEach(function (r) {
      t.appendChild(h('div', { class: 'viz-tip-row' }, [
        r.color ? h('span', { class: 'viz-tip-key', style: 'background:' + r.color + (r.dashed ? ';opacity:.75' : '') }) : h('span', { class: 'viz-tip-key viz-tip-key-none' }),
        h('span', { class: 'viz-tip-val', text: r.value }),
        h('span', { class: 'viz-tip-lab', text: r.label })
      ]));
    });
    if (rows.note) t.appendChild(h('div', { class: 'viz-tip-note', text: rows.note }));
    t.classList.add('is-on');
    var r = node.getBoundingClientRect();
    var w = t.offsetWidth, hh = t.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    var y = r.top - hh - 10;
    if (y < 8) y = r.bottom + 10;
    t.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }
  function showTipAt(x, y, rows, title) {
    var t = tooltip();
    t.textContent = '';
    if (title) t.appendChild(h('div', { class: 'viz-tip-title', text: title }));
    rows.forEach(function (r) {
      t.appendChild(h('div', { class: 'viz-tip-row' }, [
        r.color ? h('span', { class: 'viz-tip-key', style: 'background:' + r.color + (r.dashed ? ';opacity:.75' : '') }) : h('span', { class: 'viz-tip-key viz-tip-key-none' }),
        h('span', { class: 'viz-tip-val', text: r.value }),
        h('span', { class: 'viz-tip-lab', text: r.label })
      ]));
    });
    t.classList.add('is-on');
    var w = t.offsetWidth, hh = t.offsetHeight;
    var px = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8);
    var py = y - hh - 14;
    if (py < 8) py = y + 18;
    t.style.transform = 'translate(' + Math.round(px) + 'px,' + Math.round(py) + 'px)';
  }
  function hideTip() { if (tip) tip.classList.remove('is-on'); }

  // ---------------------------------------------------------------- figure
  // Every chart ships inside a figure that owns its title, the question it
  // answers, and the table view that makes it readable without colour.

  function figure(spec) {
    var body = h('div', { class: 'viz-body' });
    var tableWrap = h('div', { class: 'viz-table', hidden: 'hidden' });
    var toggle = null;

    var head = h('div', { class: 'viz-head' }, [
      h('div', { class: 'viz-head-text' }, [
        spec.title ? h('h4', { class: 'viz-title', text: spec.title }) : null,
        spec.question ? h('p', { class: 'viz-question', text: spec.question }) : null
      ])
    ]);

    if (spec.table) {
      toggle = h('button', {
        class: 'viz-toggle', type: 'button', 'aria-expanded': 'false',
        text: 'Table',
        onclick: function () {
          var on = tableWrap.hidden;
          tableWrap.hidden = !on;
          body.hidden = on;
          toggle.setAttribute('aria-expanded', String(on));
          toggle.textContent = on ? 'Chart' : 'Table';
        }
      });
      head.appendChild(toggle);
      tableWrap.appendChild(buildTable(spec.table));
    }

    var fig = h('figure', { class: 'viz' + (spec.className ? ' ' + spec.className : '') }, [
      (spec.title || spec.question) ? head : null,
      spec.legend ? spec.legend : null,
      body,
      tableWrap,
      spec.caption ? h('figcaption', { class: 'viz-caption', text: spec.caption }) : null
    ]);

    // Charts are drawn at real pixel sizes so text is never scaled; redraw on
    // resize rather than stretching a viewBox.
    var lastW = 0;
    function draw() {
      var w = body.clientWidth;
      if (!w || Math.abs(w - lastW) < 1) return;
      lastW = w;
      body.textContent = '';
      body.appendChild(spec.render(w));
    }
    if (global.ResizeObserver) new ResizeObserver(draw).observe(body);
    requestAnimationFrame(draw);
    fig.redraw = function () { lastW = 0; draw(); };
    return fig;
  }

  function buildTable(t) {
    return h('table', {}, [
      h('thead', {}, [h('tr', {}, t.columns.map(function (c, i) {
        return h('th', { scope: 'col', class: i ? 'num' : '', text: c });
      }))]),
      h('tbody', {}, t.rows.map(function (r) {
        return h('tr', {}, r.map(function (c, i) {
          return i === 0 ? h('th', { scope: 'row', text: String(c) }) : h('td', { class: 'num', text: String(c) });
        }));
      }))
    ]);
  }

  function legend(items) {
    return h('div', { class: 'viz-legend' }, items.map(function (i) {
      return h('span', { class: 'viz-legend-item' }, [
        h('span', { class: 'viz-legend-key ' + (i.shape || 'line') + (i.dashed ? ' is-dashed' : ''), style: 'color:' + i.color }),
        h('span', { text: i.label })
      ]);
    }));
  }

  global.Viz = {
    el: el, h: h, scale: scale, niceTicks: niceTicks, extent: extent,
    linePath: linePath, barPath: barPath,
    showTip: showTip, showTipAt: showTipAt, hideTip: hideTip,
    figure: figure, buildTable: buildTable, legend: legend, NS: NS
  };
})(typeof window !== 'undefined' ? window : globalThis);
