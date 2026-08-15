---
name: ui-data-viz
description: Data visualization and dashboard patterns — chart type selection (bar vs line vs pie vs number), when a number is better than a chart, dashboard card patterns (sparkline, big number, trend indicator), data-ink ratio principles, and color for data. Use when designing dashboards, choosing chart types, or presenting quantitative data.
---

# UI Data Visualization — Charts, Metrics & Dashboards

A decision engine for presenting quantitative data visually. Covers chart type selection, dashboard card patterns, and data-ink principles. For the layout of dashboards within a page, see `ui-layouts`. For using color in charts, see `ui-color`.

## Initial Response

When this skill is first invoked without a specific request, respond only with:

> I'm ready to help you with data visualization — choosing chart types, designing dashboard cards, or presenting metrics clearly. What data are you working with, and what question should the visualization answer?

Do not provide any other information until the user asks a question or presents a visualization to review.

---

## 1. Before You Visualize: The Number Test

The most important data visualization decision is whether to visualize at all. A well-formatted number often communicates more clearly than a chart.

### When a Number Is Better Than a Chart

| Situation | Use a Number | Why |
| :--- | :--- | :--- |
| **One metric, one time period** | "$12,450" | The number is the answer; a chart adds nothing |
| **The user needs precise values** | "3,247 users" | Charts show patterns, not exact values |
| **Very limited space** (sidebar, mobile card) | "↑ 18%" | A tiny chart conveys nothing |
| **The trend is simple** (up, down, flat) | "$12,450 · ↑ 18%" | The arrow + number tells the full story |

### When a Chart Is Better Than a Number

| Situation | Use a Chart | Why |
| :--- | :--- | :--- |
| **Showing change over time** | Line chart of revenue over 12 months | The shape of the line shows trend, seasonality, anomalies |
| **Comparing 3+ categories** | Bar chart of revenue by product line | A bar chart makes relative sizes instantly visible |
| **Showing distribution** | Histogram of customer order values | The shape of the distribution matters, not individual values |
| **Part-to-whole relationships** | Stacked bar or donut chart (carefully) | Shows both the total and how parts contribute |

### The Hybrid: Big Number + Sparkline

For dashboards, the most common pattern is a metric card that combines a big number with a small trend indicator:

```
Revenue (MTD)
$12,450
↑ 18% vs last month    [tiny sparkline showing the trend]
```

The number answers "what is it?" The sparkline answers "where is it going?" The percentage change answers "is that good?" This hybrid pattern does more work than either a number or a chart alone.

---

## 2. Chart Type Selection

### The Decision Tree

```
What question does the data answer?

Comparison: "Which categories are biggest/smallest?"
  ├─ 2-8 categories, simple comparison   → Horizontal Bar Chart
  ├─ 9+ categories                       → Horizontal Bar Chart (taller)
  ├─ Over time (e.g., monthly revenue)   → Vertical Bar Chart (Column)
  └─ Two variables (e.g., revenue vs cost per product) → Grouped Bar Chart

Change over time: "What's the trend?"
  ├─ One series (e.g., total revenue)    → Line Chart
  ├─ Multiple series (e.g., revenue by product line) → Multi-Line Chart
  ├─ Cumulative or stacked values        → Stacked Area Chart
  └─ Sparse or irregular time intervals  → Bar Chart (bars emphasize individual data points)

Distribution: "How is the data spread?"
  ├─ One variable                        → Histogram
  ├─ Two variables, relationship         → Scatter Plot / Bubble Chart
  └─ By category                         → Box Plot or Violin Plot (statistical audience)

Part-to-whole: "How do parts contribute to the total?"
  ├─ 2-4 categories                      → Stacked Bar Chart (horizontal)
  ├─ As percentages (but use sparingly)  → Donut Chart (max 4-5 segments)
  └─ Avoid                               → Pie Chart (hard to compare slices; donut is slightly better)

Progression/flow: "How do items move through stages?"
  ── Funnel or Sankey diagram
```

### Chart Type Details

#### Bar Charts

**Horizontal bar charts** are the workhorse. They're the easiest chart to read because labels are horizontal (natural reading direction) and bar length maps directly to value.

```
Product A  ████████████████████  $4,200
Product B  ████████████          $2,800
Product C  ██████                $1,500
Product D  ███                   $800
```

**Rules:**
- Start the axis at zero. Truncating the axis exaggerates differences and is misleading.
- Sort bars by value (largest to smallest) unless there's a natural order (months, categories with fixed sequence).
- Use horizontal bars when labels are long (> ~10 characters). Vertical bars compress labels.
- Gap between bars: 30-50% of bar width.

**Vertical bar charts (column charts)** are better for time-series data where the x-axis is naturally ordered (months, quarters, years).

#### Line Charts

Line charts are for continuous data over time. The slope of the line is the signal.

**Rules:**
- **One line is clearest.** Two or three lines can work if they're visually distinct (color, dash pattern). 4+ lines becomes spaghetti — consider small multiples (separate charts for each series).
- **Don't smooth the line excessively.** Slight smoothing is fine; heavy smoothing invents data between points.
- **Grid lines should be subtle.** Light gray, thin. The data should dominate, not the grid.
- **Y-axis doesn't always need to start at zero** for line charts (unlike bar charts). The line's shape — not the absolute bar length — carries the meaning, and slight variations can be important.

#### Pie & Donut Charts

**Avoid pie charts when possible.** Humans are bad at comparing angles and areas. A horizontal bar chart is almost always better.

**If you must use a donut/pie:**
- Maximum 4-5 segments. 6+ slices are impossible to compare.
- Sort segments by size (largest first, clockwise from 12 o'clock).
- Use a donut over a pie — the hole makes it slightly easier to read.
- Label segments directly rather than using a legend. Legends force eye-travel.
- Never use a pie chart for data that doesn't sum to 100%. Sounds obvious, but it happens.

---

## 3. Dashboard Card Patterns

### Metric Card (Big Number)

```
+----------------------------------+
| Revenue (MTD)                    |  ← Label
| $12,450                          |  ← Value (prominent)
| ↑ 18% vs last month              |  ← Change indicator
+----------------------------------+
```

**Components:**
1. **Label** — what is being measured, in muted text (12-13px)
2. **Value** — the number itself, prominent (24-32px, bold, primary text)
3. **Change indicator** — trend vs previous period (13-14px, green for positive, red for negative, with an arrow)

**Rules:**
- The label should be specific: "Revenue (MTD)" not "Revenue." The user shouldn't wonder what time period this covers.
- The change indicator needs a reference point: "vs last month" or "vs same period last year." "↑ 18%" without context is ambiguous.
- Don't show change for cumulative metrics where direction is always the same ("Total Users" always goes up).

### Metric Card with Sparkline

```
+----------------------------------+
| Revenue (MTD)                    |
| $12,450            ╱‾‾‾╲         |
| ↑ 18%          ╱‾╱     ╲___     |
|              ╱‾╱                |
+----------------------------------+
```

The sparkline shows the trend that produced the number. It's small, has no axes or labels, and communicates shape — not precise values. The sparkline answers "is the trend smooth or erratic? Up or down? Accelerating or decelerating?"

### Progress Card

```
+----------------------------------+
| Storage Used                     |
| ████████████░░░░░░  68%         |
| 6.8 GB of 10 GB                 |
+----------------------------------+
```

Use for metrics that approach a known maximum. The progress bar shows both current value and proximity to the limit.

### Top-N List

```
+----------------------------------+
| Top Products              [View] |
|                                  |
| 1. Enterprise Plan    $8,200     |
| 2. Pro Plan           $3,400     |
| 3. Basic Plan         $850       |
+----------------------------------+
```

A ranked list of the top N items by a metric. Simpler than a full chart. Includes a link to the full detail view.

### Activity / Event Feed

```
+----------------------------------+
| Recent Activity          [View]  |
|                                  |
| ● Invoice #1234 paid     2m ago |
| ● User jane@ invited    10m ago |
| ● Project "API" created  1h ago |
+----------------------------------+
```

Chronological list of recent events. Each event has a timestamp and an entity link. Provides situational awareness without requiring the user to navigate.

---

## 4. Data-Ink Ratio (Tufte's Principle)

**Data-ink ratio = ink used to present data / total ink in the visualization**

Maximize the proportion of ink that represents data. Erase ink that doesn't.

### What to Remove

| Element | Keep or Remove |
| :--- | :--- |
| **Heavy grid lines** | Remove or make very subtle (light gray, 0.5px) |
| **Chart borders / frames** | Remove — the chart area doesn't need a box around it |
| **Background fills** | Remove — let the chart sit on the page background |
| **3D effects, gradients, shadows** | Remove — they distort perception of values |
| **Legend (when possible)** | Remove — label data directly instead |
| **Redundant axis labels** | Remove if the context makes them obvious (e.g., months on a time axis, clearly labeled in the chart title) |
| **Decorative illustrations** | Remove from data displays |

### What to Keep or Add

| Element | Why |
| :--- | :--- |
| **Clear axis labels with units** | "Revenue ($)" not "Revenue" — the user needs to know the unit |
| **Data labels on key points** | The most recent value, the peak, the target — label directly on the chart |
| **Title that answers a question** | "Revenue grew 18% in Q2" is better than "Revenue Over Time" |
| **Annotations for anomalies** | A dip in March with a note "Site outage (March 3-4)" explains what the data shows |

---

## 5. Color for Data

### Categorical Data (Comparing Categories)

Use distinct, equally-weighted colors. No color should appear more important than another.

```
Product A  ████████████████████  ← blue
Product B  ████████████          ← teal
Product C  ██████                ← green
Product D  ███                   ← amber
```

Use a categorical palette with colors that are visually distinct but equally prominent.

### Sequential Data (Low to High)

Use a single hue that varies in lightness. Darker = more. Lighter = less.

```
Revenue by Month:
Jan ░░  Feb ░░░  Mar ░░░░  Apr ░░░░░  May ░░░░░░  Jun ░░░░░░░
```

This is intuitive: darker bars represent larger values, which matches the visual weight.

### Diverging Data (Above/Below a Midpoint)

Use two hues diverging from a neutral center. Above the midpoint goes one direction (e.g., blue); below goes the other (e.g., red).

```
Variance from Target:
Product A  ████████  +12%  (blue)
Product B  ████      +5%   (blue)
Product C  ██        -3%   (red)
Product D  ██████    -8%   (red)
```

### Color Accessibility for Data

- **Don't rely on red/green alone** to communicate good/bad. Add arrows (↑↓), plus/minus signs, or text labels.
- **Use a colorblind-friendly palette.** Viridis, ColorBrewer, and IBM's design library all provide accessible palettes.
- **Test in grayscale.** If the chart still communicates meaning when desaturated, it passes.

---

## 6. Time-Series Best Practices

### Time Axis

- **Consistent intervals.** Don't skip months or compress weekends unevenly.
- **Label at natural boundaries.** First of each month, every Monday, etc. Don't crowd the axis with every data point.
- **Format dates consistently.** "Jan 2026" or "2026-01" — pick one format and use it everywhere.

### Comparison Periods

When showing a metric over time, always give the user a way to compare:

- **vs previous period:** Compare this month to last month
- **vs same period last year:** Compare January 2026 to January 2025 (removes seasonality)
- **vs target:** Compare actual to goal/target

"Revenue is $12,450" is a fact. "Revenue is $12,450 — up 18% vs last month and 12% above target" is information.

### Y-Axis

- **For bar/column charts:** Start at zero. Always.
- **For line charts:** Can start above zero if the variation is the story (e.g., stock price moving between $98-102). Label the axis clearly so the user knows it's truncated.
- **Label with units.** "Revenue ($)" or "Users (thousands)". The unit must be immediately clear.
- **Use concise number formatting.** "12.5K" not "12,450.00" for large numbers. "1.2M" not "1,234,567".

---

## 7. When NOT to Visualize

| Situation | Better Alternative |
| :--- | :--- |
| **2-3 data points** | Just write the numbers. A chart with three bars is a waste of space. |
| **Data changes rapidly** (real-time) | A live-updating number + directional indicator. Redrawing a chart 10×/second is expensive and unreadable. |
| **The values are nearly identical** | A table with exact values. A chart where all bars are 47-49 units tall shows nothing useful. |
| **The data needs precise lookup** | A table. Charts are for pattern recognition, not exact value retrieval. |
| **Very limited space** | A metric card (big number + trend arrow). A 100px-tall chart communicates nothing. |

---

## 8. Common Dashboard Mistakes

| Mistake | Why It Happens | Fix |
| :--- | :--- | :--- |
| **Kitchen-sink dashboard** | Every metric the API provides gets a card | Curate. Only show metrics that drive decisions. "Total Users" might be interesting but if no one acts on it, remove it. |
| **Charts without context** | A line chart with no title, no units, no comparison | Every chart needs a clear question it answers. The title IS the answer. |
| **Equal-sized cards for unequal metrics** | The most important KPI is the same size as "Average Session Duration" | Size cards proportionally to importance. The top-left card should be the most important metric, and it should be visually prominent. |
| **Too many charts on one dashboard** | 12+ charts on a single page — the user can't process them all | 5-7 cards per dashboard is the sweet spot. Split into multiple focused dashboards if needed. |
| **Pie charts everywhere** | Default charting library choice | Replace with horizontal bar charts in 95% of cases. |
| **No drill-down** | Dashboard shows a number but clicking it does nothing | Every metric card should link to the detailed view where the user can explore the data. |

---

## Review Format (Required)

When reviewing data visualizations, you MUST use this structure:

1. **Current State Summary:** What data is being shown? What chart types are used? What questions do the visualizations answer?
2. **Finding → Recommendation Table:**

| # | Current | Issue | Recommendation | Why |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Pie chart with 8 segments | Slices are indistinguishable; labels overlap | Horizontal bar chart sorted by value | Bar charts make comparison instant; pie charts with >5 segments fail |
| 2 | Chart titled "Revenue" | Title doesn't tell the user what to learn | "Revenue grew 18% in Q2, driven by Enterprise upgrades" | A chart title should answer the question the chart was built to answer |
| 3 | Dashboard with 14 equal-sized metric cards | No visual hierarchy; primary metrics don't stand out | Reduce to 5-7 cards; size top 2 cards larger; remove non-actionable metrics | A dashboard should surface decisions, not display every available metric |

3. **Ergonomic Rationale:** 2-4 sentences on the core data visualization principle driving these recommendations.