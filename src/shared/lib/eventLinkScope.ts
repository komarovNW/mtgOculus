import { createContext } from 'react';
import type { DashboardFilters } from '@/shared/api/types';

// Entity links opened from an event should describe that event's format and type,
// even when the detail was opened directly without dashboard query parameters.
export const EventLinkScope = createContext<Partial<DashboardFilters> | null>(null);
