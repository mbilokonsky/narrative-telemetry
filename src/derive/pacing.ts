import { StorySpan, TextModel, SpanID } from '../types';

export interface PacingScore {
  spanId: SpanID;
  title: string;
  type: string;
  eventDensity: number;    // events per percentage-point of story time
  spanDuration: number;    // percentage points
  eventCount: number;
  children: PacingScore[];
}

/**
 * Compute pacing metrics: event density per span.
 *
 * High density = fast pacing (lots happening per unit of story-time).
 * Low density = slow/reflective.
 */
export function computePacing(rootSpan: StorySpan, textModel: TextModel): PacingScore {
  return computeSpanPacing(rootSpan, textModel);
}

function countAllEvents(span: StorySpan): number {
  const direct = span.events.length;
  const nested = span.childSpans.reduce((sum, child) => sum + countAllEvents(child), 0);
  return direct + nested;
}

function computeSpanPacing(span: StorySpan, textModel: TextModel): PacingScore {
  const children = span.childSpans.map(child => computeSpanPacing(child, textModel));

  const spanDuration = span.endTimestamp.percentage - span.startTimestamp.percentage;
  const eventCount = countAllEvents(span);
  const eventDensity = spanDuration > 0 ? eventCount / spanDuration : 0;

  return {
    spanId: span.id,
    title: span.title,
    type: span.type,
    eventDensity,
    spanDuration,
    eventCount,
    children,
  };
}
