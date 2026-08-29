# NORTH — metric & visualisation system

A working prototype of the metric and data-visualisation layer for NORTH, plus the
design study behind it.

The brief was not "build a dashboard". It was to work out a **visualisation system
for SaaS business understanding**, tested against one question:

> Can a founder understand what is happening in seconds?

Two deliverables, both self-contained HTML:

| File | What it is |
|---|---|
| `dist/north-prototype.html` | The product — overview, three domain details, metric detail, and an investigation. |
| `dist/north-metric-system.html` | The design study — four card patterns, four whole-dashboard directions compared, the change grammar, and the chart vocabulary. |

Open either directly in a browser. No server, no build step needed to view them.

---

## The metric system

One card component, four patterns. **The pattern belongs to the metric, not to the
grid it sits in** — so a row can mix them, and the mixture is itself informative.

| Pattern | For | Example |
|---|---|---|
| **1 · Simple KPI** | The value and its direction are the whole story | Active customers |
| **2 · KPI + sparkline** | The *shape* carries something the number cannot | MRR, 30-day retention |
| **3 · KPI + context** | NORTH can attribute the change to something specific | Activation, customer churn |
| **4 · KPI + goal** | A target genuinely exists | ARR vs plan, NRR vs goal |

The information hierarchy inside every card is fixed and short: **metric → value →
change → context.** Trend, goal, status and everything else appear only when they
earn the room. Three metrics carry a goal meter because a goal was set for them; the
rest carry none, and no progress bar is drawn against an invented target.

### Why the hybrid

The study renders the same four metrics four ways — all-minimal, all-sparkline,
all-context, and the hybrid — and scores them on scan speed, clarity, density,
founder usefulness, visual noise and ability to detect change.

The hybrid wins for one reason worth stating plainly: **uniformity hides change.**
When every card looks the same, the one with a problem looks the same too. Letting
each metric take only the treatment it has earned means the odd card out is itself a
signal — you can see which metric NORTH has something to say about before reading a
word. The cost is real: it is a system rather than a template, and left unpoliced it
degrades into "sparkline on everything".

### Change is four facts

A change is *what changed, by how much, in which direction, and against what*. A card
that shows three of those is guessing on the reader's behalf, so `vs previous 30 days`
is never optional.

**Points and percentages are different quantities and never wear the same clothes.**
Activation moving 69.6% → 64.0% has moved 5.6 points *and* 8.0 percent. Both are true;
they answer different questions.

```
a rate    Activation  64.0%   −5.6pp    (−8.0% relative)     points lead
a level   MRR         $428K   +7.2%     (+$28.9K)            percent leads
```

The card component picks the form from the metric's unit, so a card cannot get this
wrong by accident and nobody gets to pick the flattering framing week by week.

---

## Charts answer questions

No chart exists because dashboards usually have one. Every figure states the question
it answers, and the question chooses the form:

| Question | Form |
|---|---|
| Are we growing? | Line, area wash, event annotations |
| Is it a step or a drift? | Line + the point NORTH detected, as a control |
| What actually changed our MRR? | Bridge — new, expansion, contraction, churn |
| At which step do signups stop? | Funnel, with the one abnormal transition marked |
| Where is the change concentrated? | Segment bars **+ contribution to the blended change** |
| Which features are being adopted? | Ranked bars — five independent rates, not a pie |
| How is the base distributed? | One segmented bar — not a donut |
| What are customers struggling with? | Diverging deltas from a no-change axis |
| Are cohorts retaining better or worse? | Cohort grid, single-hue sequential ramp |
| Which customers? | A table. The answer is a list of names. |

Two of those deserve a note:

**Segment comparison shows contribution, not just rates.** Small teams fell 12.5pp;
enterprise and mid-market each moved about a point. But the number that answers *where
did the decline come from* is the contribution — each segment's share of signups times
its own move. Small teams are **89% of the blended change**. A segment can move a long
way and still barely matter, and only the contribution column says so. The signup mix
is held constant across both periods, so the comparison isolates rates rather than
mixing in a shift in who signed up.

**The bridge draws only the movements.** New, expansion, contraction and churn encode
*differences*, so their window can sit off zero without misstating anything. The two
totals are written out as reference rules rather than drawn as truncated bars — which
is what a naïve waterfall does, and it is a lie about the scale.

### Density discipline

- **Overview** — large values, change, one primary graph per business domain at most,
  and NORTH's signals. No cohort tables, no full funnels, no dense breakdowns. The
  funnel appears as a one-line summary of *which step broke*, not as a funnel.
- **Detail** — the full apparatus: trends, movement, funnels, cohorts, segment
  comparisons, adoption, distributions, related signals, evidence.
- **Investigation** — the visualisation follows the question. "When did it begin" is a
  time series; "which segment" is a comparison; "at which step" is a funnel; "is
  retention affected" is a cohort grid; "which customers" is a table; "what changed at
  the same time" is small multiples plus a sequence.

### Charts and the AI panel are one product

A signal is a single object with three views. The metric card carries the mark, the
chart carries the mark at the point of detection, and the panel carries the
investigation — and any of the three opens the other two. Selecting a chart changes
the panel's *Ask NORTH* questions to questions about that chart.

---

## Correlation, not cause

Five things move within nine days in the sample data: a release, activation falling,
setup support conversations rising, integrations adoption falling, and customer churn
rising.

NORTH ranks candidates by how well they fit the *shape* of the change — a step on a
date, in one segment, at one step of the funnel — and says which fits best and why. It
does not promote the best-fitting candidate to a cause. The investigation carries an
explicit note to that effect, and closes with what would actually settle it rather
than with a conclusion the data cannot support.

---

## The sample data

180 days ending 2026-08-29, generated from a seeded function so the prototype is
deterministic, then affinely calibrated so the headline windows land on round numbers.
Calibration rescales a series; it does not reshape it, so the generated noise and
inflection points survive intact.

Series: MRR, ARR, NRR, revenue churn, activation, 30-day retention, active customers,
customer churn, CSAT, setup conversations — plus funnel, cohorts, MRR movement, feature
adoption, customer health, support topics and at-risk accounts.

**Planted signals**, so there is something real to detect:

- MRR grows steadily, $317K → $428K, with a pricing change in June.
- Activation holds ~70–71% until 19 July, then steps down to 64.0%.
- Customer churn rises 2.4% → 3.1% in the same window.
- Setup support conversations rise 20%; integrations adoption falls 6pp.
- The July cohort is the first to retain below 89% at month one.

**Everything reconciles**, because the interface holds no numbers of its own:

- The funnel's last step (822 / 1,284) is 64.0% — the activation headline.
- The segment breakdown, weighted, is 64.0% now and 69.6% before.
- The MRR bridge runs $399.3K → $428.2K, the +7.2% the MRR card reports.
- Support topic counts sum to the 384 total, and the daily setup-conversation series
  sums to the 112 in the topic table.

Rate metrics are charted as their **trailing 30-day average** — the same window the
headline number uses — so a line's last point is always the number on the card. Daily
rates are too noisy to read a change out of, and a chart that ends somewhere other
than its own KPI is a bug a reader will find.

---

## Craft notes

- **Colour was computed, not eyeballed.** The categorical, ordinal and status values
  were run through a contrast and colour-vision validator against these exact
  surfaces, in both light and dark. Dark mode is a selected set of steps for the dark
  surface, not an inverted light palette.
- **No dual axes anywhere.** Four metrics that moved together are four panels sharing
  one x range, never two y-scales on one plot.
- **Text wears text tokens.** Identity comes from a coloured mark beside the label,
  never from tinting the label.
- **Every figure has a table view** behind a toggle, and keyboard focus shows what
  hover shows. Charts are keyboard-navigable with arrow keys; the anomaly marker is a
  real button.
- **Marks**: 2px lines, bars capped at 22px with a 4px rounded data end, ≥8px markers
  with a 2px surface ring, a 2px surface gap between touching fills, solid hairline
  grid. Direct labels are selective — endpoint, extreme, or the one series the story is
  about.
- **A label that will not fit is dropped, never clipped.** Annotation labels are placed
  newest-first onto two rows, and one with nowhere to go loses its label but keeps its
  rule, its dot and its tooltip.
- Responsive to 420px; no horizontal page scroll at any width.

---

## Repository

```
src/
  data.js             seeded series + window calibration
  model.js            metrics, breakdowns, funnel, cohorts, signals, investigations
  tokens.css          colour roles, light + dark
  ui.css              layout and components
  charts.js           SVG utilities, figure wrapper, table view, tooltip
  chart-line.js       sparkline, line chart (comparison, annotations, anomaly, goal)
  chart-bars.js       bridge, funnel, segments, ranked bars, distribution,
                      topic deltas, cohort grid, meter
  metric-cards.js     the four card patterns and the change component
  app.js              state, shared pieces, overview
  app-views.js        revenue / product / customers / metric detail
  app-investigation.js  the investigation; question → visualisation
  app-shell.js        navigation, filter row, NORTH panel, mount
  exploration.*       the design study
build.mjs             inlines sources into the two self-contained pages
dist/                 build output — open these
```

```sh
node build.mjs      # rebuild dist/ after editing src/
```

No runtime dependencies. Playwright is a dev-only dependency used to render and check
the pages.
