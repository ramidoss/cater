#!/usr/bin/env python3
"""Generate the C3 'Chat + work canvas' agent panel as Figma-pasteable SVG.

Two variants (light / dark) from one layout. Figma names layers from the `id`
attribute on groups and from the string content of text nodes, so ids here are
written as the layer names we want to see in the Figma layer tree.

Deliberate constraints for a clean Figma import:
  * presentation attributes only (no <style> blocks, no CSS classes)
  * no filters, gradients or masks
  * text positioned on its baseline (Figma ignores dominant-baseline)
  * fonts limited to two Google families Figma ships with
"""

W, H = 1160, 680
SANS = "Instrument Sans"
MONO = "IBM Plex Mono"

LIGHT = dict(
    name="light",
    surface="#FFFFFF", surface2="#EFF3F2", surface3="#DFE7E4",
    line="#DBE3E0", line_strong="#C2CFCB",
    ink="#0E1B19", ink2="#3E4F4C", ink3="#6E7E7B",
    accent="#0C6C61", accent_soft="#DEEFEB", accent_line="#9FCCC4",
    good="#2E7D4F", crit="#AE3A34",
    btn_fill="#0E1B19", btn_text="#FFFFFF", on_accent="#FFFFFF",
)

DARK = dict(
    name="dark",
    surface="#111918", surface2="#18211F", surface3="#1F2A28",
    line="#232E2C", line_strong="#35433F",
    ink="#E3ECE9", ink2="#A6B6B2", ink3="#7A8B87",
    accent="#43C1AC", accent_soft="#12302C", accent_line="#1D5B53",
    good="#57B681", crit="#E0776F",
    btn_fill="#43C1AC", btn_text="#06201C", on_accent="#06201C",
)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def rect(x, y, w, h, fill=None, stroke=None, rx=0, sid=None, sw=1):
    a = ['<rect']
    if sid:
        a.append('id="%s"' % esc(sid))
    a.append('x="%g" y="%g" width="%g" height="%g"' % (x, y, w, h))
    if rx:
        a.append('rx="%g"' % rx)
    a.append('fill="%s"' % (fill if fill else "none"))
    if stroke:
        a.append('stroke="%s" stroke-width="%g"' % (stroke, sw))
    return " ".join(a) + "/>"


def line(x1, y1, x2, y2, stroke, sw=1):
    return ('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="%g"/>'
            % (x1, y1, x2, y2, stroke, sw))


def text(x, y, s, size, fill, family=SANS, weight=400, anchor="start", ls=None):
    a = ['<text x="%g" y="%g"' % (x, y)]
    a.append('font-family="%s" font-size="%g" font-weight="%d" fill="%s"' % (family, size, weight, fill))
    if anchor != "start":
        a.append('text-anchor="%s"' % anchor)
    if ls:
        a.append('letter-spacing="%g"' % ls)
    return " ".join(a) + ">" + esc(s) + "</text>"


def group(sid, body):
    return '<g id="%s">\n%s\n</g>' % (esc(sid), "\n".join("  " + b for b in body))


def build(t):
    o = []

    # ---- card ------------------------------------------------------------
    o.append(rect(0.5, 0.5, W - 1, H - 1, fill=t["surface"], stroke=t["line"], rx=16, sid="Panel background"))

    # ---- header ----------------------------------------------------------
    hdr = [
        text(24, 35, "Broadcast Performance Analysis", 15, t["ink"], weight=600),
        rect(1028, 12, 108, 32, fill=t["btn_fill"], rx=8, sid="Button / New chat"),
        text(1082, 33, "+  New chat", 12.5, t["btn_text"], weight=600, anchor="middle"),
        ('<g id="Icon / Collapse" transform="translate(990 20)" stroke="%s" '
         'stroke-width="1.4" stroke-linecap="round" fill="none">'
         '<path d="M6 0.5V6H0.5"/><path d="M0.5 0.5L6 6"/>'
         '<path d="M8 13.5V8h5.5"/><path d="M13.5 13.5L8 8"/></g>') % t["ink3"],
        line(0, 56, W, 56, t["line"]),
    ]
    o.append(group("Header", hdr))

    # ---- chat rail -------------------------------------------------------
    rail = []
    rail.append('<path id="Rail background" d="M0 56H320V680H16A16 16 0 0 1 0 664Z" fill="%s"/>' % t["surface2"])

    def label(y, s):
        return text(16, y, s, 9.5, t["ink3"], family=MONO, ls=1.3)

    def bubble(top, lines):
        h = 22 + 18 * len(lines)
        out = [rect(16, top, 288, h, fill=t["surface"], stroke=t["line"], rx=10)]
        for i, ln in enumerate(lines):
            out.append(text(30, top + 24 + i * 18, ln, 13, t["ink"]))
        return out, top + h

    def plain(top, lines, fill=None):
        out = []
        for i, ln in enumerate(lines):
            out.append(text(16, top + 13 + i * 18, ln, 13, fill or t["ink2"]))
        return out, top + 18 * len(lines)

    b, _ = bubble(92, ["Summarize my last 5 broadcasts and", "flag what to change."])
    rail.append(group("Turn 1 · You", [label(85, "YOU")] + b))

    b, _ = plain(184, ["Built a comparison on the right.", "Revenue is concentrated in two",
                       "re-engagement sends."])
    rail.append(group("Turn 2 · Agent", [label(177, "AGENT")] + b))

    b, _ = bubble(272, ["Add unsubscribe rate."])
    rail.append(group("Turn 3 · You", [label(265, "YOU")] + b))

    b, _ = plain(346, ["Added — column 4. The 4:40pm", "send is the outlier."])
    rail.append(group("Turn 4 · Agent", [label(339, "AGENT")] + b))

    rail.append(group("Reasoning badge", [
        rect(16, 402, 172, 26, fill=t["accent_soft"], stroke=t["accent_line"], rx=13),
        text(29, 419, "Agent's work · 6 steps", 10.5, t["accent"], family=MONO),
    ]))

    rail.append(group("Suggestion chips", [
        rect(16.5, 578.5, 145, 29, fill=t["surface"], stroke=t["line_strong"], rx=14.5),
        text(89, 597, "Group by send time", 12.5, t["ink2"], anchor="middle"),
        rect(169.5, 578.5, 122, 29, fill=t["surface"], stroke=t["line_strong"], rx=14.5),
        text(231, 597, "Save as routine", 12.5, t["ink2"], anchor="middle"),
    ]))

    rail.append(group("Composer", [
        rect(16.5, 620.5, 287, 43, fill=t["surface"], stroke=t["line_strong"], rx=10),
        text(30, 647, "Ask a follow-up…", 13, t["ink3"]),
        '<circle id="Send" cx="283" cy="642" r="13" fill="%s"/>' % t["accent"],
        ('<path d="M283 636.5V647.5M278.5 641L283 636.5L287.5 641" stroke="%s" '
         'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>') % t["on_accent"],
    ]))

    rail.append(line(320, 56, 320, 680, t["line"]))
    o.append(group("Chat rail", rail))

    # ---- canvas ----------------------------------------------------------
    can = []

    can.append(group("Tabs", [
        text(348, 94, "Comparison", 13.5, t["ink"], weight=600),
        text(452, 94, "Takeaways", 13.5, t["ink3"]),
        line(348, 109, 1132, 109, t["line"]),
        rect(348, 107, 76, 2, fill=t["accent"], sid="Tab indicator"),
    ]))

    def tri(x, y, up, fill):
        pts = ("%g,%g %g,%g %g,%g" % (x, y - 3, x + 7, y - 3, x + 3.5, y - 9.5)) if up else \
              ("%g,%g %g,%g %g,%g" % (x, y - 9.5, x + 7, y - 9.5, x + 3.5, y - 3))
        return '<polygon points="%s" fill="%s"/>' % (pts, fill)

    def stat(x, lbl, val, delta=None, up=True, vw=0):
        out = [text(x, 146, lbl, 9.5, t["ink3"], family=MONO, ls=1.3),
               text(x, 174, val, 24, t["ink"], weight=600)]
        if delta:
            dx = x + vw + 12
            out.append(tri(dx, 174, up, t["good"] if up else t["crit"]))
            out.append(text(dx + 11, 174, delta, 11.5, t["good"] if up else t["crit"], family=MONO))
        return out

    can.append(group("Stat row", (
        stat(348, "AVG OPEN", "39.3%", "1.4", True, 68)
        + stat(572, "AVG CLICK", "4.7%", "0.9", False, 55)
        + stat(796, "REVENUE", "$13,075")
    )))

    cols = [("OPEN", 880), ("CLICK", 962), ("UNSUB", 1050), ("REVENUE", 1132)]
    head = [text(348, 211, "BROADCAST", 9.5, t["ink3"], family=MONO, ls=1.3)]
    for lbl, rx_ in cols:
        head.append(text(rx_, 211, lbl, 9.5, t["ink3"], family=MONO, ls=1.3, anchor="end"))
    head.append(line(348, 222, 1132, 222, t["line"]))

    rows = [
        ("Rooms you saved are back", "42.9%", "7.1%", "0.08%", "$5,015", True),
        ("Your August rooms are live", "44.1%", "6.8%", "0.11%", "$4,120", False),
        ("3 spots left this weekend", "40.7%", "5.2%", "0.14%", "$2,890", False),
        ("Weekly digest #34", "37.8%", "2.4%", "0.09%", "$740", False),
        ("A quick update from us", "31.2%", "1.9%", "0.31%", "$310", False),
    ]
    table = list(head)
    for i, (name, op, cl, un, rev, top) in enumerate(rows):
        y = 222 + i * 38
        cells = []
        if top:
            cells.append(rect(340, y + 2, 800, 34, fill=t["accent_soft"], rx=6, sid="Top performer tint"))
            cells.append(rect(340, y + 2, 3, 34, fill=t["accent"], sid="Top performer marker"))
        cells.append(text(348, y + 24, name, 13, t["ink"], weight=500))
        if top:
            cells.append(rect(516, y + 11, 36, 16, fill=t["accent"], rx=8))
            cells.append(text(534, y + 22, "TOP", 8.5, t["on_accent"], family=MONO, weight=500, anchor="middle", ls=.6))
        for val, rx_ in zip((op, cl, un, rev), (880, 962, 1050, 1132)):
            cells.append(text(rx_, y + 24, val, 12.5, t["ink2"], family=MONO, anchor="end"))
        if i < len(rows) - 1:
            cells.append(line(348, y + 38, 1132, y + 38, t["line"]))
        table.append(group("Row %d · %s" % (i + 1, name), cells))
    can.append(group("Table · Broadcast comparison", table))

    can.append(group("Takeaway callout", [
        rect(348, 440, 784, 84, fill=t["surface2"], rx=10, sid="Callout background"),
        rect(348, 440, 3, 84, fill=t["accent"], sid="Callout marker"),
        text(368, 468, "TAKEAWAY · SEND TIME", 9.5, t["accent"], family=MONO, ls=1.3),
        text(368, 492, "Every send before 10am beat every afternoon send on click rate. The 4:40pm digest carries", 13, t["ink"]),
        text(368, 510, "3× the unsubscribe rate of the morning sends for a fifth of the revenue.", 13, t["ink"]),
    ]))

    can.append(group("Confidence", [
        text(348, 556, "CONFIDENCE · 5 SENDS, 7-DAY WINDOW", 9.5, t["ink3"], family=MONO, ls=1.3),
        rect(348, 565, 280, 6, fill=t["surface3"], rx=3, sid="Track"),
        rect(348, 565, 174, 6, fill=t["accent"], rx=3, sid="Fill"),
    ]))

    can.append(group("Action bar", [
        line(348, 598, 1132, 598, t["line"]),
        rect(884, 622, 132, 34, fill=t["accent"], rx=8, sid="Button / Save as routine"),
        text(950, 643, "Save as routine", 12.5, t["on_accent"], weight=600, anchor="middle"),
        rect(1028.5, 622.5, 103, 33, fill="none", stroke=t["line_strong"], rx=8, sid="Button / Export CSV"),
        text(1080, 643, "Export CSV", 12.5, t["ink2"], weight=500, anchor="middle"),
    ]))
    o.append(group("Work canvas", can))

    inner = "\n".join("    " + s for s in o)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" fill="none">\n'
        '  <g id="C3 · Chat + Work Canvas (%s)">\n%s\n  </g>\n</svg>\n'
        % (W, H, W, H, t["name"], inner)
    )


if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    for tokens in (LIGHT, DARK):
        path = os.path.join(here, "c3-chat-work-canvas-%s.svg" % tokens["name"])
        with open(path, "w", encoding="utf-8") as f:
            f.write(build(tokens))
        print("wrote", path)
