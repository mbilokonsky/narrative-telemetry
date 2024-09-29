# Narrative-Telemetry

## Project Overview

This project aims to create a tool for narrative analysis that captures the nuanced unfolding of a story, including character development, plot progression, and thematic elements. We offer support for both diagetic and non-diagetic elements, allowing for a comprehensive understanding of the narrative world.

## Key Features

- Comprehensive literary analysis model
- OpenTelemetry (OTEL) integration for advanced querying and visualization
- Support for various narrative types (novels, movies, etc.)
- Flexible framework for different analysis approaches

## Project Goals

- Create a detailed model for literary analysis
- Integrate with OpenTelemetry for data-driven insights
- Support complex queries for deep narrative understanding
- Provide a flexible framework for various narrative types and analysis methods

## OpenTelemetry (OTEL) Integration

The eventual integration with OpenTelemetry allows us to:

- Treat the unfolding of a story as a series of spans and events
- Use OTEL's rich querying capabilities for story analysis
- Visualize story progression, character development, and narrative patterns
- Leverage OTEL's distributed tracing concepts to track cause-and-effect relationships

## Core Concepts

I've pulled together a number of concepts from a number of different domains in order to build this, and I think what I've got so far is a promising start.

### Story Spans (Borrowed from OTEL)

We model the narrative structure as a series of "Story Spans" - these are the building blocks of the story, ranging from the entire work down to individual beats. Each span has a type (StorySpanType) and a start time and end time represented as timestamps, but defined by anything from word count to film running time.

Spans are a concept borrowed from the Open Telemetry standard, and the key idea here is that spans can be nested. The entire work is a span, and each act is a span, and each scene is a span, and within a scene each beat is a span. This allows us to track the unfolding of the story at multiple levels of granularity, dispatching events from whichever span they're most closely associated with.

### Relational Narrative Entities (Borrowed from Relational Databases)

We model the story world as a collection of "Narrative Entities" - these are the characters, settings, items, factions, themes, symbols, and other elements that populate the narrative landscape. Each entity has a type (Character, Setting, Item, etc.) which defines various salient mostly-immutable properties, an append-only log of immutable `State` objects which represent the way other properties change based on the unfolding of the story, and relationships with other entities.

Note that a lot of the way this works is relational - a character's current location is a property of that character's state which references the ID of a `Setting` entity, and when some `Event` transpires that represents movement to a different setting a new state is generated with a reference to that event that updates the current location.

More information below on the types of entities we support.

### Absentials For The Win (Borrowed from Philosophy)

I'm borrowing the concept of an "Absential Property" from the work of [Terrence Deacon](https://www.amazon.com/Incomplete-Nature-Mind-Emerged-Matter/dp/0393049914), but the concept may have originated with [Roy Bhaskar](https://en.wikipedia.org/wiki/Roy_Bhaskar) - I've got some more research to do there.

We can think of absentials as any kind of unrealized state. This could be a character's unfulfilled desire, a setting's pending transformation, or a theme that has not yet been fully manifested. Absentials are a key part of the narrative landscape, and our model aims to capture their influence on the story. Every absential is "owned" by some NarrativeEntity, can decompose into sub-absentials, and can be resolved or negated by events.

Technically any given entity could specify an infinite number of absentials, but for the purposes of narrative analysis we focus on those absentials that have some causal relationship to the unfolding of the story. For instance, a character's desire to save their friends is an absential that can be resolved by an event where they save their friends, or negated by an event where they fail to save their friends. A character not seeing a pink elephant dancing a polka may technically be an "absential" but it's not worth tracking in this model. There's a bit more nuance here than meets the eye, but I think this is a good start.

### Mental Constructs (Borrowed from Epistemology)

Mental Constructs are the beliefs, memories, and knowledge of characters. These are represented as a kind of Narrative Entity, and can be updated by events in the story. For instance, a character might learn a new piece of information, or have a memory triggered by a particular event. Mental Constructs are a key part of character development and narrative progression.

Epistemology is hard - tracking what the reader knows, what the narrator knows, what each character knows etc is a complex problem. I'm hoping that by treating knowledge as a kind of state that's bound to a specific character or faction, and tracking the events that update that state, we can build a model that captures the unfolding of knowledge in the story. The bonus here is that we can literally track the "knowledge state" of each character, and see how it changes over time, and we can also track the "knowledge state" of the reader, and see how it changes over time.

### Events and Causality (Borrowed from Logic and Computer Science)

Events are the building blocks of narrative, representing actions, dialogue, revelations, and other key moments in the story. By modeling events and their causal relationships, we can gain insights into the underlying structure of the narrative. Our event model supports complex causal chains, allowing for detailed analysis of how events unfold and interact over time.

The way to think about this is that an Event ("Luke Skywalker destroys the death star") causes changes to all kinds of state in the narrative world. For instance, a number of absentials are either resolved or negated - Luke's desire to save his friends is resolved, the Empire's desire to destroy the rebels is negated, etc. The event also changes the state of the Death Star, the state of the Rebel Alliance, and so on.

Because each event is bound to a span, and has a timestamp, we have an ordered series of state transitions from the first page to the last. Because the events track both cause and effect, we can also trace the causal chains behind any state transitions we observe.

## Implementation Documentation

I'm starting at the type level, and I'll be working my way down to the implementation details. I'm using TypeScript for this project, so I'll be documenting the types and interfaces that I'm using to build this out. Everything referenced below is available in the `src/types` directory if you want a closer look.

### Core Types (core.ts)

- `StorySpanType`: Enum for different levels of story structure (STORY, ACT, SCENE, BEAT)
- `NarrativeEventType`: Enum for types of narrative events (ACTION, DIALOGUE, REVELATION, etc.)
- `RealmType`: Enum for different "types" of setting (MATERIAL_REALITY, DREAM, MEMORY, etc.)
- `RelationshipLabel`: Enum for labeling relationships between entities
- `NarratorPerspective`: Enum for different narrative perspectives
- `Timestamp`: Interface for tracking story progression
- `State<T>`: Generic interface for representing the state of any narrative element
- `Emotion`: Interface for representing complex emotional states

### Events (events.ts)

- `Event`: Interface representing a narrative event, including causes and effects
- `EventCause` and `EventEffect`: Interfaces for modeling causality in the narrative
- `CausalChain`: Interface for representing sequences of related events

### Narrative Entities (narrativeEntity.ts)

- `NarrativeEntity`: Base interface for all narrative elements
- `DiageticEntity` interface represents an in-world entity.
  - `Character` is a person in the story. This might be a human, an animal, a robot, or any other being that, _within the context of the story_, has agency.
  - `Setting` is a location where some events in the story take place. This could be a physical location, a mental space, a dream, etc.
  - `Item` represents a physical object that has some significance in the story. This could be a weapon, a talisman, a letter, etc.
  - `Faction` represents a group of characters with shared goals, beliefs, or interests. This could be a political party, a secret society, a family, etc, but the faction itself has its own form of collective agency distinct from the agency of its members.
- `NonDiageticEntity` interface represents a meta-narrative entity.
  - `Theme` is a recurring idea, motif, or message in the story. This could be a theme of love, of betrayal, of redemption, etc.
  - `Symbol` is a concrete object or action that represents an abstract idea. This could be a rose, a cross, a flag, etc. Tracking symbolism in text feels interesting to me, and I think it'll be interesting to see if we can detect non-obvious symbolism just by carefully logging the events that transpire.
  - `Author` represents the author of the story in question. This could be a single person, a group of people, or a pseudonymous entity.
  - `Narrator` represents the narrator of the story. This could be a character in the story, an omniscient voice, a first-person narrator, etc.
  - `Reader` represents the reader of the story. This is used primarily for tracking the reader's knowledge state, and how it changes over time.
- There are also three specialized entities:
  - `MentalConstruct` is a representation of a character's beliefs, memories, and knowledge.
  - `Relationship` represents connections between narrative entities. These can be interpersonal, group-based, or symbolic.
  - `Absential` represents states in the narrative and their progression from unrealized to resolved (either positively or negatively).

### Structural Elements (structural.ts)

- `StorySpan`: Interface representing structural units of the story (text, act, scene and beat.)
- `StoryModel`: Top-level interface representing the entire analyzed work

### Specialized Entities

- `Absential` (absential.ts): Represents states in the narrative and their progression from unrealized to resolved (either positively or negatively)
- `MentalConstruct` (mentalConstruct.ts): Represents beliefs, memories, and knowledge of characters
- `Relationship` (relationship.ts): Represents connections between narrative entities. These can be interpersonal, group-based, or symbolic.

## Key Design Decisions

- **Absentials instead of Plot**: A lot of narrative analysis treats Plot as the central element of the story, but I think we can do a bit better. Plot is actually a side effect of the flow of events and their impact on the active absentials extant across the various narrative entities in the story. Further, an overemphasis on plot imposes a nondiagetic structure over the story that diverges significantly from the experiences of the characters. Frodo doesn't see himself as the protagonist of a plot, he sees himself as a hobbit with a bunch of problems to solve. By focusing on absentials we can track the unfolding of the story in a way that's more faithful to the characters' experiences.
- **Separation of Diegetic and Non-diegetic Elements**: This allows for clear distinction between elements within the story world and meta-narrative elements, as well as the relationships between them. We can track the way that the author's beliefs and knowledge are reflected in the text, or how the reader's knowledge state changes as they progress through the story. Narrative analysis usually works by imposing nondiagetic structures over diagetic elements, but by explicitly modeling both we can track the way that the story world and the meta-narrative interact.
- **Flexible State Management**: The `State<T>` generic type allows for tracking the changing state of any narrative element over time. And because we have causal bindings to events, that means we can look at any given value of any given property of any given narrative entity and ask with some confidence "how did we get here?"
- **Comprehensive Event Model**: The `Event` interface and related types enable detailed modeling of cause-and-effect relationships within the narrative.
- **Rich Relationship Modeling**: The `Relationship` types allow for modeling complex interpersonal, group, and symbolic relationships.
- **Mental Model Representation**: Modeling knowledge and beliefs via `MentalConstruct` allows us to engage meaningful with the complex epistemology that can play out in some works. An event may happen, but different characters learn about it at different times, or form diverging interpretations of what it means - this is the kind of thing we can track with this model.
- **Extensible Entity System**: The base `NarrativeEntity` interface allows for easy addition of new entity types as needed.

## Getting Started

There isn't much here yet, just a basic typescript project with some types. If you'd like to noodle on this, just install a recent version of node.js, run `npm install` and `npm run build` to make sure it compiles. It doesn't _do_ anything yet.

## Contributing

This feels like a very _me_ project, by which I mean it's a bit out of left field and specific to my way of making sense of the world, but if you see this and it resonates with you and you want to contribute I'd be happy to entertain pull requests.

## Next Steps

Now that I have a sort of first draft of my type system built out, I'm going to start writing some implementations. Once I have the model and the ability to generate spans and events I'm going to build out a quick front-end. It'll have three columns:

1. A renderer for the `StoryModel` that shows the structure of the story, lists all NarrativeEntities (including absentials) and their current states, basically a way to see the whole thing at a glance in some sort of collapseable tree component.
2. In the middle I'll have a detailed view of the currently open spans, showing where we are in the story and what's happening right now, as well as listing all the events that have transpired in this span.
3. On the right I'll have a space for a story or script, and we'll have the ability to highlight a section of the text and get a little popup that lets you add a span, close a span or dispatch an event. This'll trigger a modal to pop up that has a sort of EventWizard, so you can specify the type of event, the cause, the effect, and any other relevant details.

With those parts in play, then, I'll paste in some short story that I like and try to model it and we'll see where we go.

One further goal beyond this, though, is LLM integration. I don't think it's the sort of thing that can "just run" against a large text, I think it needs to be something that a human can trigger manually against specific things and then edit the results of - but I think it would be cool if I could highlight a section of the text, hit "Generate Event via LLM" and have it give me a first pass at an event and its effects.
