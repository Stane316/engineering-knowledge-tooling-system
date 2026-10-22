# Inventaire — Bklit UI (registre shadcn `@bklit`)

Source : `packages/ui/registry.json` du dépôt GitHub `bklit/bklit-ui`, récupéré le 5 octobre 2026.
**56 entrées de registre** installables via `npx shadcn@latest add @bklit/<nom>`.


## Composants (charts + primitives de composition) — 32

| Nom du registre | Description | Dépendances déclarées |
| --- | --- | --- |
| `area-chart` | A composable area chart with gradient fills and animations | npm: @visx/curve@4.0.1-alpha.0, @visx/gradient@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-series, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip, @bklit/shimmering-text, @bklit/utils |
| `background` | Pattern fill for the plot area when grid lines are hidden | npm: @visx/pattern@4.0.1-alpha.0, motion / registry: @bklit/chart-context |
| `bar-chart` | A composable bar chart with horizontal/vertical orientations and animations | npm: @visx/gradient@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/grid, @bklit/chart-tooltip, @bklit/utils |
| `bar-depth` | 3D depth and glossy glass surfaces for BarChart bars | npm: motion / registry: @bklit/bar-chart |
| `candlestick-chart` | A composable OHLC candlestick chart with gradients, patterns, tooltips, and hover interactions | npm: @visx/scale@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, d3-array, motion / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/grid, @bklit/x-axis, @bklit/y-axis, @bklit/chart-tooltip, @bklit/utils |
| `chart-animation` | Shared motion helpers for chart enter transitions, clip reveals, and staggered animations | npm: motion / registry: — |
| `chart-context` | Shared context and hooks for Bklit chart components | npm: @visx/event@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/scale@4.0.1-alpha.0, d3-array, motion / registry: @bklit/utils, @bklit/chart-utils |
| `chart-series` | Shared line and area series rendering helpers (paths, markers, highlights, dash tails) | npm: @visx/shape@4.0.1-alpha.0, d3-shape, motion / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-tooltip |
| `chart-stat-flow` | Animated stat value and label for chart overlays | npm: @number-flow/react, motion / registry: @bklit/utils |
| `chart-tooltip` | Composable tooltip components for charts | npm: @number-flow/react, motion / registry: @bklit/chart-context, @bklit/utils |
| `choropleth-chart` | A geographic map chart with zoom, pan, and data visualization | npm: @types/geojson, @visx/geo@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/zoom@4.0.1-alpha.0, d3-geo, topojson-client, motion / registry: @bklit/chart-animation, @bklit/utils, @bklit/chart-utils, @bklit/chart-tooltip |
| `composed-chart` | Time-series chart composing Line, Area, and SeriesBar on one shared scale (Recharts ComposedChart-style) | npm: @visx/curve@4.0.1-alpha.0, @visx/scale@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, d3-array, motion / registry: @bklit/chart-context, @bklit/grid, @bklit/x-axis, @bklit/y-axis, @bklit/chart-tooltip, @bklit/utils, @bklit/line-chart, @bklit/area-chart |
| `funnel-chart` | An animated funnel chart with multi-layer halo rings, hover interactions, and staggered entrance animations | npm: motion / registry: @bklit/chart-animation, @bklit/utils, @bklit/chart-utils |
| `gauge-chart` | Notch-based radial or linear gauge with optional center label, patterns, and optional gradients | npm: @visx/responsive@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @number-flow/react, motion, d3-shape / registry: @bklit/utils |
| `grid` | Grid lines for charts | npm: @visx/grid@4.0.1-alpha.0 / registry: @bklit/chart-context |
| `heatmap-chart` | A contribution heatmap with animated cells and configurable level colors | npm: @visx/group@4.0.1-alpha.0, @visx/heatmap@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/scale@4.0.1-alpha.0, motion / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/utils, @bklit/chart-utils, @bklit/chart-tooltip, @bklit/background, @bklit/shimmering-text |
| `legend` | Composable legend components for charts | npm: @base-ui/react, @number-flow/react / registry: @bklit/utils, @bklit/chart-utils |
| `line-chart` | A composable line chart with multiple series support | npm: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-series, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip, @bklit/shimmering-text, @bklit/utils |
| `live-line-chart` | Real-time streaming line chart with smooth scrolling, crosshair, and animated axes | npm: @visx/curve@4.0.1-alpha.0, @visx/scale@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/event@4.0.1-alpha.0, d3-array, motion / registry: @bklit/chart-context, @bklit/chart-tooltip, @bklit/utils |
| `markers` | Marker components for highlighting data points on charts | npm: — / registry: @bklit/chart-context, @bklit/chart-tooltip, @bklit/utils |
| `pie-chart` | A composable pie chart with animations and customizable slices | npm: @number-flow/react, @visx/group@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, d3-shape, motion / registry: @bklit/chart-animation, @bklit/utils |
| `profit-loss-line` | Sign-colored line segments for profit and loss on LineChart | npm: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0 / registry: @bklit/line-chart, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip, @bklit/legend, @bklit/utils |
| `projection-line` | Forecast segment extending a line series past the last data point | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/chart-context, @bklit/line-chart |
| `radar-chart` | A composable radar/spider chart with multiple data series | npm: @visx/group@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/scale@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, d3-shape, motion / registry: @bklit/chart-animation, @bklit/utils |
| `reference-area` | Shaded data-coordinate band for target ranges and thresholds on time-series charts | npm: motion / registry: @bklit/chart-context, @bklit/background |
| `ring-chart` | A composable donut/ring chart with progress indicators | npm: @visx/group@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, @number-flow/react, motion / registry: @bklit/chart-animation, @bklit/utils |
| `sankey-chart` | A flow diagram for visualizing data transfers between nodes | npm: @visx/event@4.0.1-alpha.0, @visx/gradient@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/sankey@4.0.1-alpha.0, d3-sankey, motion / registry: @bklit/chart-animation, @bklit/utils, @bklit/chart-utils, @bklit/chart-tooltip |
| `scatter-chart` | A composable time-series scatter chart with offset rings, hover dimming, and animated enter | npm: d3-array, d3-scale, motion, react-use-measure / registry: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-series, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip, @bklit/utils |
| `shimmering-text` | Per-character shimmer animation for loading labels and badges | npm: motion / registry: @bklit/utils |
| `sunburst-chart` | A composable hierarchical sunburst chart with drill-down zoom and animated segments | npm: motion / registry: @bklit/chart-animation, @bklit/utils |
| `x-axis` | X-axis component for time-series charts | npm: — / registry: @bklit/chart-context, @bklit/utils |
| `y-axis` | Y-axis component for value labels in line and area charts | npm: — / registry: @bklit/chart-context, @bklit/utils |

## Exemples installables — 19

| Nom du registre | Description | Dépendances déclarées |
| --- | --- | --- |
| `area-chart-example` | Composable area-chart demo for Open in v0 | npm: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/area-chart, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip |
| `bar-chart-example` | Composable bar-chart demo for Open in v0 | npm: @visx/gradient@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/bar-chart, @bklit/grid, @bklit/chart-tooltip |
| `candlestick-chart-example` | Composable candlestick-chart demo for Open in v0 | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/candlestick-chart, @bklit/grid, @bklit/x-axis, @bklit/y-axis, @bklit/chart-tooltip |
| `choropleth-chart-example` | Composable choropleth-chart demo for Open in v0 | npm: @visx/geo@4.0.1-alpha.0, d3-geo, topojson-client / registry: @bklit/choropleth-chart |
| `composed-chart-example` | Composable composed-chart demo for Open in v0 | npm: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/composed-chart, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip |
| `funnel-chart-example` | Composable funnel-chart demo for Open in v0 | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/funnel-chart |
| `gauge-chart-example` | Composable gauge-chart demo for Open in v0 | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/gauge-chart |
| `heatmap-chart-example` | Composable heatmap-chart demo for Open in v0 | npm: @visx/heatmap@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/heatmap-chart |
| `line-chart-example` | Composable line-chart demo for Open in v0 | npm: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/line-chart, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip |
| `live-line-chart-example` | Composable live-line-chart demo for Open in v0 | npm: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/live-line-chart, @bklit/chart-tooltip |
| `pie-chart-example` | Composable pie-chart demo for Open in v0 | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/pie-chart |
| `radar-chart-example` | Composable radar-chart demo for Open in v0 | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/radar-chart |
| `ring-chart-example` | Composable ring-chart demo for Open in v0 | npm: @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/ring-chart |
| `sankey-chart-example` | Composable sankey-chart demo for Open in v0 | npm: @visx/sankey@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion / registry: @bklit/sankey-chart |
| `scatter-chart-example` | Composable scatter-chart demo for Open in v0 | npm: d3-scale, d3-array, motion, react-use-measure / registry: @bklit/scatter-chart, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip |
| `stat-card-area-01-example` | Revenue stat card with gradient area sparkline, NumberFlow, and trend badge — demo for Open in v0 | npm: @visx/curve@4.0.1-alpha.0, @visx/gradient@4.0.1-alpha.0, @number-flow/react, @central-icons-react/all / registry: @bklit/stat-card-area-01 |
| `stat-card-choropleth-01-example` | Visitor map stat card with choropleth sparkline, NumberFlow, and trend badge — demo for Open in v0 | npm: @number-flow/react, @types/geojson, @types/topojson-specification, @central-icons-react/all, topojson-client / registry: @bklit/stat-card-choropleth-01 |
| `stat-card-line-01-example` | Sessions stat card with line sparkline, overlaid NumberFlow, and trend badge — demo for Open in v0 | npm: @visx/curve@4.0.1-alpha.0, @number-flow/react, @central-icons-react/all / registry: @bklit/stat-card-line-01 |
| `sunburst-chart-example` | Composable sunburst-chart demo for Open in v0 | npm: motion / registry: @bklit/sunburst-chart |

## Blocs prêts à l'emploi (stat cards) — 3

| Nom du registre | Description | Dépendances déclarées |
| --- | --- | --- |
| `stat-card-area-01` | Revenue stat card with gradient area sparkline, NumberFlow, and trend badge | npm: @visx/curve@4.0.1-alpha.0, @visx/gradient@4.0.1-alpha.0, @number-flow/react, @central-icons-react/all / registry: @bklit/area-chart, @bklit/chart-stat-flow, card, badge |
| `stat-card-choropleth-01` | Visitor map stat card with choropleth sparkline, NumberFlow, and trend badge | npm: @number-flow/react, @types/geojson, @types/topojson-specification, @central-icons-react/all, topojson-client / registry: @bklit/choropleth-chart, @bklit/chart-stat-flow, card, badge |
| `stat-card-line-01` | Sessions stat card with line sparkline, overlaid NumberFlow, and trend badge | npm: @visx/curve@4.0.1-alpha.0, @number-flow/react, @central-icons-react/all / registry: @bklit/line-chart, @bklit/chart-stat-flow, card, badge |

## Utilitaires (lib) — 2

| Nom du registre | Description | Dépendances déclarées |
| --- | --- | --- |
| `chart-utils` | Shared Intl formatters, time-series decimation, and RAF tooltip scheduling for Bklit charts | npm: — / registry: — |
| `utils` | Utility functions for className merging with clsx and tailwind-merge | npm: clsx, tailwind-merge / registry: — |