import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { computeSummary, tripStatus } from '../lib/summary';
import type { Trip } from '../types';

/** Lista/cria/edita/remove viagens + resumo calculado. */
export function useTrips() {
  const { trips, expenses, categories, createTrip, updateTrip, deleteTrip } = useApp();

  const summaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeSummary>> = {};
    trips.forEach((t) => {
      map[t.id] = computeSummary(t, expenses, categories);
    });
    return map;
  }, [trips, expenses, categories]);

  return { trips, summaries, createTrip, updateTrip, deleteTrip };
}

/** Resumo de uma viagem específica. */
export function useTrip(id: string | undefined) {
  const { trips, expenses, categories } = useApp();
  const trip: Trip | undefined = useMemo(() => trips.find((t) => t.id === id), [trips, id]);
  const summary = useMemo(
    () => (trip ? computeSummary(trip, expenses, categories) : null),
    [trip, expenses, categories],
  );
  const status = useMemo(() => (trip ? tripStatus(trip) : null), [trip]);
  return { trip, summary, status };
}
