import { useCallback, useEffect, useState } from 'react';
import { customerApi } from './api';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { DeliveryAssignment, Order } from '../types';

// Re-polls the delivery assignment on an interval as a fallback alongside the
// Supabase subscription — in demo mode (no live Supabase project) the
// subscription never fires, so this is what actually produces visible rider
// movement; on a real project, realtime events arrive faster than this and
// this just becomes a low-frequency safety net.
const POLL_MS = 4000;

// Shared between the native (map) and web (no-map) Order Tracking screens —
// react-native-maps is native-only, so the two screens are split by platform
// file extension, but both need the exact same order/assignment fetch, poll,
// and realtime-subscribe logic.
export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res: any = await customerApi.getOrder(orderId);
      const o = res?.data || res;
      setOrder(o);
      const a = await customerApi.getDeliveryAssignment(orderId, o.createdAt);
      setAssignment(a);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!order) return;
      try {
        const a = await customerApi.getDeliveryAssignment(orderId, order.createdAt);
        setAssignment(a);
      } catch {
        // stays on last known position
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [orderId, order]);

  // Order status (PLACED → CONFIRMED → ... → DELIVERED) previously only
  // refreshed when a screen regained focus — if this screen stayed open while
  // the vendor/admin advanced the order's status, nothing changed on screen
  // until the user navigated away and back. Subscribing directly to the
  // Order row means a status change lands live, same as the rider's position.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = getSupabase()
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'Order',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (!row?.status) return;
        setOrder((prev) => (prev ? { ...prev, status: row.status, updatedAt: row.updatedAt } : prev));
      })
      .subscribe();

    return () => { getSupabase().removeChannel(channel); };
  }, [orderId]);

  useEffect(() => {
    if (!assignment?.deliveryPartnerId || !isSupabaseConfigured()) return;
    const channel = getSupabase()
      .channel(`delivery-partner-${assignment.deliveryPartnerId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'DeliveryPartner',
        filter: `id=eq.${assignment.deliveryPartnerId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (row?.currentLat == null || row?.currentLng == null) return;
        setAssignment((prev) => (prev ? {
          ...prev,
          deliveryPartner: { ...prev.deliveryPartner!, currentLat: row.currentLat, currentLng: row.currentLng },
        } : prev));
      })
      .subscribe();

    return () => { getSupabase().removeChannel(channel); };
  }, [assignment?.deliveryPartnerId]);

  return { order, assignment, loading };
}

export const STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
export const STEP_LABELS: Record<string, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed by Vendor',
  PACKED: 'Packed',
  ASSIGNED_TO_DELIVERY: 'Assigned for Delivery',
  PICKED_UP: 'Picked Up',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

export function currentStepFor(assignment: DeliveryAssignment | null): string {
  if (assignment?.status === 'DELIVERED') return 'DELIVERED';
  if (assignment?.status === 'OUT_FOR_DELIVERY') return 'OUT_FOR_DELIVERY';
  if (assignment?.status === 'PICKED_UP') return 'PICKED_UP';
  if (assignment) return 'ASSIGNED_TO_DELIVERY';
  return 'CONFIRMED';
}
