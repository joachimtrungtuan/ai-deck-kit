# Showcase deck — canonical content

Conformance fixture for AI Deck Kit. Neutral, evergreen subject (community weather
station networks). Exercises every v2 slide type, all 9 transitions, and all 10
element animations at realistic copy lengths. No brand, no client, no expiry.

## Slide 01 (slide-01)

```yaml
id: "slide-01"
type: "title"
status: "ready"
intent: "Open the talk with the core promise of a volunteer weather network."
animation: "gentle-rise"
transition: "none"

title: "Reading the weather, together"
description: "How volunteer-run, low-cost weather stations turn backyards and hilltops into a public climate record that outlives any single storm."
kicker: "Community Weather Networks"
courseName: "Community Weather Networks"
lessonName: "A field guide to volunteer stations"

assets: ["assets/station-ridge.svg"]
```

### Speaker Notes

Set the frame in one breath: this is about ordinary people producing extraordinary
records. Nothing here needs a meteorology degree; it needs a mounting pole and
patience.

## Slide 02 (slide-02)

```yaml
id: "slide-02"
type: "agenda"
status: "ready"
intent: "Lay out the three-part structure of the talk."
animation: "staggered-list"
transition: "crossfade"

title: "Three parts of one system"
description: "Sensors, records, and the plumbing that keeps them honest."
items:
  - title: "How the network works"
    description: "Instruments, gateways, and the trip a single reading takes."
  - title: "What the data shows"
    description: "Trends, coverage, and what a volunteer actually sees each morning."
  - title: "Engineering notes"
    description: "The open pipeline from a tipping bucket to a public API."
```

### Speaker Notes

Promise the audience they can leave after any part; each one stands alone.

## Slide 03 (slide-03)

```yaml
id: "slide-03"
type: "text-statement"
status: "ready"
intent: "State the core observation the whole deck is built on."
animation: "fade"
transition: "blur-crossfade"

title: "A storm that used to vanish between towns now leaves a trail of numbers"
description: "Ten years ago, a cell crossing the ridge dropped two hundred millimetres on one valley and nothing on the next, and nobody could prove it happened. Now eleven stations log it minute by minute, and the rain has a paper trail."
source: "Field symposium notes, twelfth season"
```

### Speaker Notes

This is the thesis slide. Let the silence do the work after reading the headline.

## Slide 04 (slide-04)

```yaml
id: "slide-04"
type: "section-divider"
status: "ready"
intent: "Open part one: how the network works."
animation: "line-draw"
transition: "push"

title: "How the network works"
description: "One garden at a time."
index: 1
```

### Speaker Notes

Part one is hardware and habits. Keep it concrete: boxes, poles, batteries.

## Slide 05 (slide-05)

```yaml
id: "slide-05"
type: "text-list"
status: "ready"
intent: "Name the four instruments that make a station worth having."
animation: "staggered-list"
transition: "zoom"

title: "What makes a station a station"
description: "A phone app is not a weather station. Four instruments are."
items:
  - title: "Temperature and humidity, louvered and shaded"
    description: "A sensor in a white louvered box, ventilated, never in direct sun."
  - title: "A tipping bucket that counts every drop"
    description: "Zero-twenty millimetres per tip, logged with the same timestamp as the rest."
  - title: "An ultrasonic wind sensor with no moving parts"
    description: "Speed and direction sampled twice a second, averaged over ten minutes."
  - title: "A panel sized for the worst winter, not the best summer"
    description: "Solar and battery chosen so the station survives weeks of cloud, not just fair days."
```

### Speaker Notes

Emphasise that every one of these is available off the shelf for less than the cost
of a weekend of paid forecasting.

## Slide 06 (slide-06)

```yaml
id: "slide-06"
type: "two-column-text"
status: "ready"
intent: "Contrast what the volunteer gives with what the network guarantees."
animation: "soft-scale"
transition: "wipe"

title: "Private garden, public record"
leftTitle: "On the volunteer's side"
rightTitle: "On the network's side"
items:
  - column: "left"
    title: "A pole, a little roof space, and five minutes a week"
    description: "Mowing around a white box is the entire time commitment."
  - column: "left"
    title: "Landowner consent that is always revocable"
    description: "Anyone can unplug their station tomorrow; the archive keeps what it gathered."
  - column: "left"
    title: "Local knowledge the instruments do not have"
    description: "Where the frost pools, which hedge blocks the north wind."
  - column: "right"
    title: "Calibration checks and drift correction"
    description: "Annual side-by-side comparison with the reference station in the county town."
  - column: "right"
    title: "An archive nobody can quietly edit"
    description: "Every reading keeps its sensor timestamp and its quality flag, forever."
```

### Speaker Notes

The deal is deliberately asymmetric: tiny contribution, permanent public benefit.

## Slide 07 (slide-07)

```yaml
id: "slide-07"
type: "numbered-framework"
status: "ready"
intent: "Give the four rules that keep the network trustworthy."
animation: "fade"
transition: "iris"

title: "Four rules the whole network follows"
description: "Not suggestions. A station that breaks a rule is flagged, not deleted."
items:
  - title: "Every reading is stamped at the sensor, not at the server"
    description: "A network gap must be obvious, never laundered by a re-upload."
  - title: "Every station publishes, including the ones that are doing badly"
    description: "A flatlined humidity sensor is a finding, not an embarrassment."
  - title: "Calibration drift is treated as shared debt"
    description: "One station's drift is corrected in everyone's record the same week."
  - title: "The landowner owns the data from their plot"
    description: "They can request anything be withheld. So far, nobody has."
```

### Speaker Notes

Rule two is the one that surprises people; honest failure is the point of a
volunteer network.

## Slide 08 (slide-08)

```yaml
id: "slide-08"
type: "quote"
status: "ready"
intent: "Human voice mid-way through part one."
animation: "masked-reveal"
transition: "flip"

title: "The rain did not get lighter. The maps just finally got honest."
attribution: "Valley coordinator, twelfth season"
```

### Speaker Notes

Say the attribution out loud; the quote only lands if people know who said it.

## Slide 09 (slide-09)

```yaml
id: "slide-09"
type: "section-divider"
status: "ready"
intent: "Open part two: what the data shows."
animation: "line-draw"
transition: "page-turn"

title: "What the data shows"
description: "Seasons, slopes, and a few surprises."
index: 2
```

### Speaker Notes

Part two is evidence. Everything from here can be downloaded and checked.

## Slide 10 (slide-10)

```yaml
id: "slide-10"
type: "full-bleed-image"
status: "ready"
intent: "Establish the physical setting of the ridge stations."
animation: "image-drift"
transition: "none"

title: "The ridge stations catch what the valley misses"
description: "Two hundred metres of altitude is a different climate."
kicker: "Twelve ridgelines"
imageSrc: "assets/station-ridge.svg"
imageAlt: "Weather station mast silhouetted on a ridge under a wide dusk sky"
```

### Speaker Notes

Point at the mast on the skyline. The whole ridge line is a wind tunnel with
instrument mounts bolted to it.

### Design Notes

image-drift entrance is intentional here: the slow scale and rise gives the dusk
frame a moment to breathe before the headline reads.

## Slide 11 (slide-11)

```yaml
id: "slide-11"
type: "image-text-split"
status: "ready"
intent: "Show the hardware up close and keep it unglamorous."
animation: "gentle-rise"
transition: "none"

title: "A louvered box, a tiny computer, and a radio"
description: "The entire station fits in a bread basket. The radiation shield costs less than a bicycle pump. What you cannot buy off the shelf is the ten minutes a week someone gives it."
imageSrc: "assets/sensor-housing.svg"
imageAlt: "Exploded diagram of a louvered radiation shield with sensor stack inside"
caption: "Standard enclosure: shield, board, battery, radio."
```

### Speaker Notes

People expect sci-fi; the honesty of a plastic box is the selling point.

## Slide 12 (slide-12)

```yaml
id: "slide-12"
type: "image-grid"
status: "ready"
intent: "Convey a year of attention in four frames."
animation: "soft-scale"
transition: "none"

title: "Four seasons at station forty-one"
description: "The same fence post, once per quarter."
images:
  - src: "assets/capture-rain-gauge.svg"
    alt: "Tipping-bucket rain gauge beside a fence post"
    caption: "Late spring, first gust logged"
  - src: "assets/sensor-housing.svg"
    alt: "Louvered radiation shield on its mount"
    caption: "Midsummer calibration day"
  - src: "assets/solar-array.svg"
    alt: "Solar array angled toward the low autumn sun"
    caption: "Autumn on the windward side"
  - src: "assets/mountaintop-station.svg"
    alt: "Mountaintop station mast under a winter sky"
    caption: "First snow, shield cleared by noon"
```

### Speaker Notes

The clearing-the-snow detail matters: a buried shield is a silent station.

## Slide 13 (slide-13)

```yaml
id: "slide-13"
type: "icon-grid"
status: "ready"
intent: "Summarise the measurement set a station reports."
animation: "staggered-list"
transition: "none"

title: "Six things every station reports"
kicker: "The standard package"
items:
  - title: "Air temperature"
    icon: "thermometer"
  - title: "Relative humidity"
    icon: "drop"
  - title: "Wind speed and direction"
    icon: "wind"
  - title: "Rainfall totals"
    icon: "cloud-rain"
  - title: "Solar radiation"
    icon: "sun"
  - title: "Battery and health"
    icon: "battery-charging"
```

### Speaker Notes

Battery and health is the seventh instrument: the station reporting on itself.

## Slide 14 (slide-14)

```yaml
id: "slide-14"
type: "diagram"
status: "ready"
intent: "Reduce the whole pipeline to one line the audience can repeat."
animation: "line-draw"
transition: "none"

title: "From bucket to browser in four hops"
kicker: "The one-line diagram"
items:
  - title: "Sensor event"
    description: "The bucket tips; the counter and clock are on the same board."
  - title: "Gateway relay"
    description: "A hilltop radio picks up six kilometres of gardens."
  - title: "Open archive"
    description: "Every record lands in a flat file anyone can mirror."
  - title: "Public view"
    description: "The map the valley checks before mowing the football pitch."
```

### Speaker Notes

If you remember one picture from this talk, make it this one.

## Slide 15 (slide-15)

```yaml
id: "slide-15"
type: "chart"
status: "ready"
intent: "Show a season of rainfall as a shape, then hand the shape to the next slide."
animation: "morph"
transition: "none"
morph: "rainfall-trend"

title: "Rainfall in a wetting-up spring"
description: "Monthly totals at station forty-one against the ten-year average."
chartData: [{"label": "Nov", "value": 112}, {"label": "Dec", "value": 96}, {"label": "Jan", "value": 88}, {"label": "Feb", "value": 134}, {"label": "Mar", "value": 71}, {"label": "Apr", "value": 149}]
```

### Speaker Notes

Point at February and April. Two months did most of the work.

### Design Notes

slide 15→16 carries the shared morph anchor `rainfall-trend`; the navigation must
pair the chart and the metric across the slide boundary.

## Slide 16 (slide-16)

```yaml
id: "slide-16"
type: "metric-highlight"
status: "ready"
intent: "Collapse the chart into one number with the same morph anchor."
animation: "morph"
transition: "crossfade"
morph: "rainfall-trend"

title: "What a season adds up to"
metric: "41,900"
metricLabel: "millimetres reported network-wide last season"
items:
  - title: "Ninety-six stations across fourteen villages"
    icon: "map-pin"
  - title: "Zero paid infrastructure; the hilltop relay runs on a shepherd's socket"
    description: "The only invoice in twelve years was a lightning arrester."
  - title: "Every reading ever collected is still online"
    description: "Same URL, same format, same promise."
```

### Speaker Notes

The crossfade transition is set deliberately: the morph should win and carry the
trend shape from the previous slide across.

## Slide 17 (slide-17)

```yaml
id: "slide-17"
type: "section-divider"
status: "ready"
intent: "Open part three: engineering notes."
animation: "gentle-rise"
transition: "none"

title: "Engineering notes"
description: "Boring on purpose."
index: 3
```

### Speaker Notes

Signal the gear change: from here on, for the builders in the room.

## Slide 18 (slide-18)

```yaml
id: "slide-18"
type: "process-flow"
status: "ready"
intent: "Walk one reading through its life cycle."
animation: "staggered-list"
transition: "none"

title: "Life of a reading"
kicker: "Sense, stamp, relay, publish"
description: "Four steps, eleven seconds, no human in the loop."
items:
  - title: "Sense"
    icon: "thermometer"
  - title: "Stamp"
    icon: "clock"
  - title: "Relay"
    icon: "radio"
  - title: "Publish"
    icon: "upload-simple"
```

### Speaker Notes

Eleven seconds end to end; the archive is append-only, which is the only clever
idea in the whole stack.

## Slide 19 (slide-19)

```yaml
id: "slide-19"
type: "before-after"
status: "ready"
intent: "Compare a village's situation before and after joining."
animation: "none"
transition: "none"

title: "One valley, before and after the gateway went up"
leftTitle: "Before"
rightTitle: "After"
items:
  - column: "left"
    title: "Two stations, twelve kilometres apart, neither believed by the other"
  - column: "left"
    title: "Storm damage claims argued from memory"
  - column: "right"
    title: "Twenty-two stations on a single clock"
  - column: "right"
    title: "Claims filed with a CSV the insurer already accepts"
```

### Speaker Notes

This slide carries no element animation on purpose: the comparison is meant to be
read all at once, not choreographed. `none` is a catalog member, not an override.

## Slide 20 (slide-20)

```yaml
id: "slide-20"
type: "ui-showcase"
status: "ready"
intent: "Show the volunteer-facing dashboard the network actually runs on."
animation: "soft-scale"
transition: "none"

title: "What a volunteer sees each morning"
kicker: "The station page"
description: "One screen, no login for reading, a health badge that has never lied."
caption: "station-41 · live view"
imageSrc: "assets/dashboard-mock.svg"
imageAlt: "Dashboard mock showing rainfall bars, temperature line, and a green health badge"
items:
  - title: "Battery bar with ten-day history"
    description: "The only red badge that ever gets attention."
  - title: "Rain since last tip, in plain language"
  - title: "A calibrate button that just opens a checklist"
```

### Speaker Notes

Demo the real page afterwards; this frame is the shape, not the whole truth.

## Slide 21 (slide-21)

```yaml
id: "slide-21"
type: "timeline"
status: "ready"
intent: "Give the maintenance year a rhythm."
animation: "masked-reveal"
transition: "none"

title: "A station year in four moments"
description: "Fifteen minutes each, on the calendar."
items:
  - title: "March: calibration week"
    icon: "calendar"
  - title: "May: first heat drift logged"
    icon: "thermometer"
  - title: "September: solar and battery rebuild"
    icon: "battery-charging"
  - title: "December: archive snapshot published"
    icon: "database"
```

### Speaker Notes

The December snapshot is when every mirror across the country pulls the same
file; it is also when the network counts itself.

## Slide 22 (slide-22)

```yaml
id: "slide-22"
type: "case-study"
status: "ready"
intent: "Tell one story the data made possible."
animation: "gentle-rise"
transition: "none"

title: "The flood that started in a dry town"
description: "A named storm, one Tuesday in November."
items:
  - title: "Context"
    description: "The lowland gauge reported dry air all day while the ridge logged heavy rain behind the cloud."
  - title: "Action"
    description: "The ridge record reached the drainage board in time to open the upstream sluices two hours early."
  - title: "Result"
    description: "Ninety-one fewer flooded properties than the same storm in the previous decade."
```

### Speaker Notes

The dry lowland reading and the wet ridge reading were both true; that is the
whole argument for dense volunteer coverage.

## Slide 23 (slide-23)

```yaml
id: "slide-23"
type: "evidence-stack"
status: "ready"
intent: "Answer the obvious objection: can this data be trusted?"
animation: "fade"
transition: "none"

title: "Why the records hold up"
items:
  - title: "Independent side-by-side checks every spring"
    description: "Two volunteers and one reference instrument, photographed while reading."
  - title: "Published error budget, not a promise of accuracy"
    description: "The calibration page states what each sensor is wrong by, and by how much."
  - title: "Raw and corrected records kept as separate files"
    description: "You can always see what the sensor actually said before anyone adjusted it."
  - title: "The correction log is signed by the person who made it"
    description: "Named adjustments only; the archive has no anonymous edits."
```

### Speaker Notes

If someone wants to distrust the network, show them the correction log first.

## Slide 24 (slide-24)

```yaml
id: "slide-24"
type: "code-snippet"
status: "ready"
intent: "Show the whole ingest contract in one small function."
animation: "staggered-list"
transition: "none"

title: "The publish step, in full"
kicker: "publish_reading.py"
description: "A station has exactly one job. This is the whole job."
language: "python"
code: |
  import json
  from network.client import Archive

  def publish(station_id, reading):
      # The archive keys every record by the sensor's own
      # timestamp, so a late relay cannot reorder history.
      stamp = reading["sampled_at"]
      record = {
          "station": station_id,
          "sampled_at": stamp,
          "values": reading["values"],
      }
      Archive.append(json.dumps(record, sort_keys=True))
highlightLines: [5, 6, 7, 12]
caption: "network/publish_reading.py"
```

### Speaker Notes

Read the comment aloud; it is the one hard-won idea in the codebase.

## Slide 25 (slide-25)

```yaml
id: "slide-25"
type: "terminal-output"
status: "ready"
intent: "Show the daily check a volunteer actually runs."
animation: "staggered-list"
transition: "none"

title: "The morning check is one command"
kicker: "stationctl"
caption: "zsh"
commands:
  - prompt: "stationctl status"
    output: "station 41 · up 268d · battery 87% · last tip 04:12 · drift +0.3C"
  - prompt: "stationctl selftest --quiet"
    output: "ok: sensors, radio, clock, archive queue empty"
  - prompt: "stationctl publish --dry-run"
    output: "would send 1 pending reading (rainfall, 2.2 mm, sampled 06:58)"
```

### Speaker Notes

Two seconds a day, which is why ninety-six volunteers are still doing it.

## Slide 26 (slide-26)

```yaml
id: "slide-26"
type: "architecture-overview"
status: "ready"
intent: "Name the five components of the pipeline and nothing more."
animation: "line-draw"
transition: "none"

title: "Five parts, one pipeline"
kicker: "Architecture"
items:
  - title: "Stations"
    icon: "map-pin"
  - title: "Hilltop gateways"
    icon: "radio"
  - title: "Ingest service"
    icon: "cloud-arrow-up"
  - title: "Open archive"
    icon: "database"
  - title: "Public API"
    icon: "globe"
```

### Speaker Notes

There is no database cluster and no dashboard vendor. The flat archive is the
database; the API just reads it.

## Slide 27 (slide-27)

```yaml
id: "slide-27"
type: "data-flow"
status: "ready"
intent: "Trace a single reading through the components with their contracts."
animation: "gentle-rise"
transition: "none"

title: "One reading's journey"
kicker: "Data flow"
flowSteps:
  - from: "station-41"
    to: "gateway-north"
    label: "Radio packet, unconfirmed; the next tip will re-send it"
    icon: "radio"
  - from: "gateway-north"
    to: "ingest"
    label: "Batched POST, retried with backoff for six hours"
    icon: "cloud-arrow-up"
  - from: "ingest"
    to: "archive"
    label: "Append-only line, keyed by sensor timestamp"
    icon: "database"
  - from: "archive"
    to: "api · map · downloads"
    label: "The same file, three readers, no copies"
    icon: "share-network"
```

### Speaker Notes

The first hop is deliberately unconfirmed; re-sending on the next tip beats any
acknowledgement scheme at this scale.

## Slide 28 (slide-28)

```yaml
id: "slide-28"
type: "api-endpoint"
status: "ready"
intent: "Show the public read contract that makes the whole archive useful."
animation: "soft-scale"
transition: "none"

title: "The endpoint everyone actually calls"
kicker: "API"
method: "GET"
path: "/v2/stations/41/readings?last=24h"
description: "One call, one station, any window. The API is read-only by design; writing is a radio problem, not a web problem."
requestExample: |
  GET /v2/stations/41/readings?last=24h HTTP/1.1
  Accept: application/json
responseExample: |
  { "station": 41,
    "readings": [
      { "sampled_at": "06:58", "rain_mm": 2.2,
        "temp_c": 11.4, "hum_pct": 91 }
    ],
    "quality": "checked" }
```

### Speaker Notes

Mention the quality flag; every response admits what it does not know.

## Slide 29 (slide-29)

```yaml
id: "slide-29"
type: "spec-table"
status: "ready"
intent: "List the minimum spec a joining station has to meet."
animation: "fade"
transition: "none"

title: "Minimum spec for a joining station"
kicker: "Requirements"
tableColumns: ["ID", "Requirement", "Priority", "Verified by", "Status"]
tableRows:
  - ["SR-01", "Sensor stamped at capture, not at upload", "Must", "Selftest", "Pass"]
  - ["SR-02", "Shield within 1.2-2.0 m of bare grass", "Must", "Site photo", "Pass"]
  - ["SR-03", "Battery sized for fourteen days of cloud", "Must", "Winter audit", "Review"]
  - ["SR-04", "Rain gauge clear of drip line and canopy", "Must", "Site visit", "Pass"]
  - ["SR-05", "Landowner consent on file", "Must", "Register", "Pass"]
override:
  css: ".ld-table td { font-variant-numeric: tabular-nums }"
  reason: "Requirement tables mix numeric tolerances and codes; tabular numerals keep SR-01 to SR-05 aligned so the ID column scans as one block."
```

### Speaker Notes

SR-03 is always the one under review before winter; fourteen days is not a
suggestion.

## Slide 30 (slide-30)

```yaml
id: "slide-30"
type: "comparison-table"
status: "ready"
intent: "Compare the three placement options volunteers ask about."
animation: "gentle-rise"
transition: "none"

title: "Three ways to place a rain gauge"
kicker: "Placement"
tableColumns: ["Placement", "Accuracy in wind", "Maintenance", "Cost"]
tableRows:
  - ["On a shed roof", "Poor: roof turbulence throws the catch", "Ladder", "Free"]
  - ["Fence post at grass height", "Good, if clear of canopy drip", "Walk out", "A pole bracket"]
  - ["Mast at head height", "Best: standard exposure", "Quarterly check", "A used TV mast"]
recommendedColumn: 2
```

### Speaker Notes

The recommended column is what the network specifies; the shed roof is what
people try first.

## Slide 31 (slide-31)

```yaml
id: "slide-31"
type: "decision-record"
status: "ready"
intent: "Record the single most controversial architecture choice."
animation: "masked-reveal"
transition: "none"

title: "Why the archive is flat files"
kicker: "Decision record"
context: "Every vendor meeting starts with a database pitch. The network has run an append-only flat archive for twelve years, across ninety-six stations, with one mirror failure ever."
decision: "Keep one file per station per year, append-only, mirrored nightly by whoever wants to. Corrections live in a separate signed log."
consequences:
  - "No migration script has ever been needed at an annual snapshot"
  - "Any spreadsheet user can audit a season without asking permission"
  - "Cross-station analytics are slow and stay deliberately off the critical path"
```

### Speaker Notes

The third consequence is accepted out loud every year; slow analytics is the
price of a permanent record.

## Slide 32 (slide-network-diagram)

```yaml
id: "slide-network-diagram"
type: "diagram"
status: "ready"
intent: "Show the full path a reading travels, from bucket tip to public tile, as one diagram."
animation: "gentle-rise"
transition: "crossfade"

title: "How a reading reaches the map"
override:
  layout: "none"
  animation: "none"
  reason: "Rendered from assets/diagrams/station-network.json (diagram IR v1, content 796b3878) by render-diagram.mjs; the diagram supersedes the template layout on this slide. Regenerate, never hand-edit: node engine/skills/presentation-crafting/scripts/render-diagram.mjs --ir <deck>/assets/diagrams/station-network.json --animation gentle-rise"
  css: |-
    /* Generated by render-diagram.mjs from assets/diagrams/station-network.json (diagram IR v1, content 796b3878). Do not hand-edit — re-render. */
    .aideck-diagram--station-network-796b3878 { position: absolute; inset: 0; background: var(--deck-color-bg, transparent); }
    .aideck-diagram--station-network-796b3878 > svg { width: 100%; height: 100%; display: block; }
    .aideck-diagram--station-network-796b3878 .title { font-family: var(--deck-font-display); font-size: 44px; font-weight: 600; fill: var(--deck-color-ink); }
    .aideck-diagram--station-network-796b3878 .subtitle { font-family: var(--deck-font-body); font-size: 21px; fill: var(--deck-color-muted); }
    .aideck-diagram--station-network-796b3878 .node-box { fill: var(--deck-color-surface); stroke: var(--deck-color-ink); stroke-width: 1.5; }
    .aideck-diagram--station-network-796b3878 .node--emphasis .node-box { fill: var(--deck-color-accent-soft); stroke: var(--deck-color-accent); }
    .aideck-diagram--station-network-796b3878 .node-label { font-family: var(--deck-font-body); font-size: 27px; font-weight: 500; fill: var(--deck-color-ink); text-anchor: middle; }
    .aideck-diagram--station-network-796b3878 .node-sublabel { font-family: var(--deck-font-body); font-size: 18px; fill: var(--deck-color-muted); text-anchor: middle; }
    .aideck-diagram--station-network-796b3878 .node-kind { font-family: var(--deck-font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; fill: var(--deck-color-accent); text-anchor: middle; }
    .aideck-diagram--station-network-796b3878 .edge { fill: none; stroke: var(--deck-color-muted); stroke-width: 2; }
    .aideck-diagram--station-network-796b3878 .edge--emphasis { stroke: var(--deck-color-accent); stroke-width: 3.5; }
    .aideck-diagram--station-network-796b3878 .edge--security { stroke: var(--deck-color-accent); }
    .aideck-diagram--station-network-796b3878 .edge--dashed { stroke-dasharray: 10 8; }
    .aideck-diagram--station-network-796b3878 .edge-label { font-family: var(--deck-font-mono); font-size: 16px; fill: var(--deck-color-muted); text-anchor: middle; paint-order: stroke; stroke: var(--deck-color-bg); stroke-width: 8px; }
    .aideck-diagram--station-network-796b3878 .group rect { fill: none; stroke: var(--deck-color-muted); stroke-width: 1.5; }
    .aideck-diagram--station-network-796b3878 .group--region rect { stroke-dasharray: 2 6; }
    .aideck-diagram--station-network-796b3878 .group--security rect { stroke: var(--deck-color-accent); stroke-dasharray: 12 6; }
    .aideck-diagram--station-network-796b3878 .group-label { font-family: var(--deck-font-mono); font-size: 15px; letter-spacing: 0.1em; text-transform: uppercase; fill: var(--deck-color-muted); }
    .aideck-diagram--station-network-796b3878 .arrow-muted { fill: var(--deck-color-muted); }
    .aideck-diagram--station-network-796b3878 .arrow-accent { fill: var(--deck-color-accent); }
  html: |-
    <div class="aideck-diagram aideck-diagram--station-network-796b3878">
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arw-muted-station-network-796b3878" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="arrow-muted"></path></marker>
        <marker id="arw-accent-station-network-796b3878" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="arrow-accent"></path></marker>
      </defs>
      <g class="heading primitive-anim-gentle-rise">
        <text class="title" x="96" y="110">How a reading reaches the map</text>
        <text class="subtitle" x="96" y="148">From a tipping bucket to a public tile</text>
      </g>
      <g class="layer layer--groups">
        <g class="group group--region primitive-anim-gentle-rise">
      <rect x="78" y="202" width="704" height="612" rx="14"></rect>
      <text class="group-label" x="94" y="228">On the ground</text>
    </g>
    <g class="group group--security primitive-anim-gentle-rise">
      <rect x="818" y="202" width="704" height="612" rx="14"></rect>
      <text class="group-label" x="834" y="228">Platform</text>
    </g>
      </g>
      <g class="layer layer--edges">
        <path class="edge edge--dashed primitive-anim-fade" d="M394,309 L466,309" marker-end="url(#arw-muted-station-network-796b3878)"></path>
      <text class="edge-label" x="430" y="299">radio</text>
    <path class="edge primitive-anim-line-draw" pathLength="1" d="M245,646 L245,515 L615,515 L615,384" marker-end="url(#arw-muted-station-network-796b3878)"></path>
    <path class="edge primitive-anim-line-draw" pathLength="1" d="M764,309 L800,309 L800,515 L836,515" marker-end="url(#arw-muted-station-network-796b3878)"></path>
      <text class="edge-label" x="800" y="402">MQTT</text>
    <path class="edge edge--dashed primitive-anim-fade" d="M764,721 L800,721 L800,515 L836,515" marker-end="url(#arw-muted-station-network-796b3878)"></path>
      <text class="edge-label" x="800" y="608">sync</text>
    <path class="edge primitive-anim-line-draw" pathLength="1" d="M985,440 L985,412 L1355,412 L1355,384" marker-end="url(#arw-muted-station-network-796b3878)"></path>
      <text class="edge-label" x="1170" y="402">QA&apos;d batch</text>
    <path class="edge edge--emphasis primitive-anim-line-draw" pathLength="1" d="M1355,384 L1355,646" marker-end="url(#arw-accent-station-network-796b3878)"></path>
      </g>
      <g class="layer layer--nodes">
        <g class="node primitive-anim-gentle-rise" data-node-id="station" role="img" aria-label="Field station">
      <rect class="node-box" x="96" y="234" width="298" height="150" rx="12"></rect>
      <text class="node-label" x="245" y="307">Field station</text>
      <text class="node-sublabel" x="245" y="333">sensor, logger, solar</text>
    </g>
    <g class="node primitive-anim-gentle-rise" data-node-id="volunteer" role="img" aria-label="Volunteer host">
      <rect class="node-box" x="96" y="646" width="298" height="150" rx="12"></rect>
      <text class="node-kind" x="245" y="674">external</text>
      <text class="node-label" x="245" y="719">Volunteer host</text>
      <text class="node-sublabel" x="245" y="745">landowner, gateway power</text>
    </g>
    <g class="node primitive-anim-gentle-rise" data-node-id="gateway" role="img" aria-label="Neighborhood gateway">
      <rect class="node-box" x="466" y="234" width="298" height="150" rx="12"></rect>
      <text class="node-label" x="615" y="290">Neighborhood</text>
      <text class="node-label" x="615" y="324">gateway</text>
      <text class="node-sublabel" x="615" y="350">radio uplink</text>
    </g>
    <g class="node primitive-anim-gentle-rise" data-node-id="phone" role="img" aria-label="Phone check-in">
      <rect class="node-box" x="466" y="646" width="298" height="150" rx="12"></rect>
      <text class="node-kind" x="615" y="674">frontend</text>
      <text class="node-label" x="615" y="719">Phone check-in</text>
      <text class="node-sublabel" x="615" y="745">manual readings</text>
    </g>
    <g class="node node--emphasis primitive-anim-gentle-rise" data-node-id="ingest" role="img" aria-label="Cloud ingest">
      <rect class="node-box" x="836" y="440" width="298" height="150" rx="12"></rect>
      <text class="node-kind" x="985" y="468">cloud</text>
      <text class="node-label" x="985" y="513">Cloud ingest</text>
      <text class="node-sublabel" x="985" y="539">dedupe, QA, stamps</text>
    </g>
    <g class="node primitive-anim-gentle-rise" data-node-id="archive" role="img" aria-label="Reading archive">
      <rect class="node-box" x="1206" y="234" width="298" height="150" rx="12"></rect>
      <text class="node-kind" x="1355" y="262">database</text>
      <text class="node-label" x="1355" y="307">Reading archive</text>
      <text class="node-sublabel" x="1355" y="333">15-minute buckets</text>
    </g>
    <g class="node primitive-anim-gentle-rise" data-node-id="map" role="img" aria-label="Public map">
      <rect class="node-box" x="1206" y="646" width="298" height="150" rx="12"></rect>
      <text class="node-kind" x="1355" y="674">frontend</text>
      <text class="node-label" x="1355" y="719">Public map</text>
      <text class="node-sublabel" x="1355" y="745">live tiles</text>
    </g>
      </g>
    </svg>
    </div>
```

### On-Slide Text

The diagram carries all visible copy. The source of truth is
`assets/diagrams/station-network.json`; the override is generated from it.

### Speaker Notes

Walk the path left to right: bucket tips, radio hops a gateway, the cloud
ingests a de-duplicated batch, the archive publishes tiles. One honest station
at a time.

### Design Notes

Rendered from the diagram IR; regenerate with render-diagram.mjs, never hand-edit
the override.

## Slide 33 (slide-33)

```yaml
id: "slide-33"
type: "closing"
status: "ready"
intent: "Leave the audience with a startable first step."
animation: "spotlight"
transition: "none"

title: "Start with one garden"
description: "A network is not a data center. It is one honest station and the person who checks it on the way to the kettle."
kicker: "Where to begin"
items:
  - title: "Pick a site with morning sun and clear sky"
    icon: "sun"
  - title: "Publish from day one, gaps included"
    icon: "upload-simple"
  - title: "Hand the station to the next volunteer before you need to"
    icon: "users-three"
```

### Speaker Notes

End on the third point: a station with no successor is a station that already
quit.
