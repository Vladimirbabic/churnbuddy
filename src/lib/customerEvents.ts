/**
 * Customer Events Module for Churn Intelligence
 *
 * Type-safe helper functions for tracking customer activity events.
 * These events are used by the daily health calculator to compute risk scores.
 */

import { getServerSupabase } from './supabase';

// Predefined event types for type safety
export type PredefinedEventName =
  | 'login'
  | 'core_action'
  | 'seat_added'
  | 'seat_removed'
  | 'feature_used'
  | 'page_view'
  | 'api_call';

// Allow custom event names too
export type EventName = PredefinedEventName | string;

export interface TrackEventParams {
  organizationId: string;
  customerId: string;
  customerEmail?: string;
  eventName: EventName;
  properties?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface TrackEventResult {
  success: boolean;
  error?: string;
  eventId?: string;
}

/**
 * Track a customer event.
 *
 * Example usage:
 * ```typescript
 * await trackCustomerEvent({
 *   organizationId: 'org_123',
 *   customerId: 'cus_abc',
 *   customerEmail: 'user@example.com',
 *   eventName: 'login',
 *   properties: { device: 'mobile', browser: 'chrome' }
 * });
 * ```
 */
export async function trackCustomerEvent({
  organizationId,
  customerId,
  customerEmail,
  eventName,
  properties = {},
  occurredAt,
}: TrackEventParams): Promise<TrackEventResult> {
  try {
    const supabase = getServerSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('customer_events')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        customer_email: customerEmail || null,
        event_name: eventName,
        event_properties: properties,
        occurred_at: occurredAt?.toISOString() || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to track customer event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, eventId: (data as { id: string })?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error tracking customer event:', message);
    return { success: false, error: message };
  }
}

/**
 * Track multiple events in a batch.
 * More efficient than calling trackCustomerEvent multiple times.
 */
export async function trackCustomerEventsBatch(
  events: TrackEventParams[]
): Promise<{ success: boolean; inserted: number; errors: string[] }> {
  try {
    const supabase = getServerSupabase();

    const rows = events.map((event) => ({
      organization_id: event.organizationId,
      customer_id: event.customerId,
      customer_email: event.customerEmail || null,
      event_name: event.eventName,
      event_properties: event.properties || {},
      occurred_at: event.occurredAt?.toISOString() || new Date().toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('customer_events')
      .insert(rows)
      .select('id');

    if (error) {
      console.error('Failed to batch insert customer events:', error);
      return { success: false, inserted: 0, errors: [error.message] };
    }

    return { success: true, inserted: (data as Array<{ id: string }> | null)?.length || 0, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error batch inserting customer events:', message);
    return { success: false, inserted: 0, errors: [message] };
  }
}

/**
 * Get recent events for a customer.
 * Useful for debugging and viewing event history.
 */
export async function getCustomerEvents(
  organizationId: string,
  customerId: string,
  options: { limit?: number; eventName?: EventName } = {}
): Promise<{
  success: boolean;
  events: Array<{
    id: string;
    event_name: string;
    event_properties: Record<string, unknown>;
    occurred_at: string;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = getServerSupabase();
    const { limit = 50, eventName } = options;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('customer_events')
      .select('id, event_name, event_properties, occurred_at, created_at')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (eventName) {
      query = query.eq('event_name', eventName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get customer events:', error);
      return { success: false, events: [], error: error.message };
    }

    type EventRecord = {
      id: string;
      event_name: string;
      event_properties: Record<string, unknown>;
      occurred_at: string;
      created_at: string;
    };
    return {
      success: true,
      events: ((data as EventRecord[] | null) || []).map((e) => ({
        ...e,
        event_properties: e.event_properties || {},
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error getting customer events:', message);
    return { success: false, events: [], error: message };
  }
}

/**
 * Get event counts for a time window.
 * Used by the daily health calculator.
 */
export async function getEventCounts(
  organizationId: string,
  customerId: string,
  eventName: EventName,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const supabase = getServerSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase as any)
      .from('customer_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .eq('event_name', eventName)
      .gte('occurred_at', startDate.toISOString())
      .lt('occurred_at', endDate.toISOString());

    if (error) {
      console.error('Failed to get event counts:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error getting event counts:', err);
    return 0;
  }
}

/**
 * Get unique user count from events in a time window.
 * Counts distinct user_id values from event properties.
 */
export async function getActiveUserCount(
  organizationId: string,
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const supabase = getServerSupabase();

    // Get all events in the window and extract unique user IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('customer_events')
      .select('event_properties')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .gte('occurred_at', startDate.toISOString())
      .lt('occurred_at', endDate.toISOString());

    if (error) {
      console.error('Failed to get active user count:', error);
      return 0;
    }

    // Extract unique user_id values from event properties
    type EventRecord = { event_properties: Record<string, unknown> };
    const userIds = new Set<string>();
    for (const event of (data as EventRecord[] | null) || []) {
      const props = event.event_properties;
      if (props?.user_id && typeof props.user_id === 'string') {
        userIds.add(props.user_id);
      }
    }

    return userIds.size;
  } catch (err) {
    console.error('Error getting active user count:', err);
    return 0;
  }
}

/**
 * Get seat change count (seat_removed events) in a time window.
 */
export async function getSeatDroppedCount(
  organizationId: string,
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  return getEventCounts(organizationId, customerId, 'seat_removed', startDate, endDate);
}
