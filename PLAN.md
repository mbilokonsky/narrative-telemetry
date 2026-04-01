# Narrative-Telemetry Implementation Plan

## Status: COMPLETE — 35/35 validation checks pass

## Architecture: TextModel + Reading (superposition model)

The text exists in superposition; each reading collapses it into an interpretive frame.
Significance is relational — a property of (event, reading) pairs, never intrinsic.

### TextModel — "what's in the text" (neutral, exhaustive)
- Spans, diegetic entities, events, relationships, absentials, mental constructs
- Events have text location anchors and participants but NO significance
- Multi-pass: extract events first, construct readings after

### Reading — "what it means under this lens"
- Themes, symbols, symbolic relationships, narrator, reader, author
- Event/entity/absential significance maps
- Tension curves and span annotations
- Interpretive mental constructs

### StoryModel = { text: TextModel, readings: Record<string, Reading> }

## Araby Encoding Stats

### TextModel (Pass 1)
- 11 characters (boy, Mangan's sister, uncle, aunt, Mangan, Mrs. Mercer, schoolmaster, stall lady, two gentlemen, turnstile man, dead priest)
- 9 settings (North Richmond St, house, back drawing-room, wild garden, market streets, classroom, Buckingham St, train carriage, Araby hall)
- 7 items (3 priest's books, bicycle-pump, silver bracelet, florin, remaining coins)
- 28 events (beat-by-beat, text-anchored)
- 5 absentials (romantic longing, desire to speak, quest to Araby, Mangan's sister's wish, priest's absence)
- 4 relationships, 3 mental constructs
- 3 acts → 13 scenes

### Formalist Reading (Pass 2)
- 3 themes (disillusionment/epiphany, paralysis, secular devotion)
- 3 symbols (light/dark, chalice, blind street)
- 28/28 events annotated with significance + notes
- 17-point tension curve peaking at the epiphany (e28 = 1.0)

### Postcolonial Reading (Pass 2)
- 4 themes (orientalism, commerce/empire, English dominance, Dublin as colonized)
- 3 symbols (the name "Araby", "The Arab's Farewell", the florin/coins)
- 28/28 events annotated — DIFFERENT significance scores
- 12-point tension curve peaking at the English flirtation (e25 = 1.0)
- The two readings demonstrably diverge on ≥5 events (significance diff > 0.2)
