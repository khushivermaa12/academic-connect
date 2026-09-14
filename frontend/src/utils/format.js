// frontend/src/utils/format.js
import { parseISO, format } from 'date-fns';

// Format slot display given slot_date and slot_time
export function formatSlotDisplay(slot_date, slot_time) {
  try {
    // If slot_date is an ISO combined string in slot_date or slot_time, attempt parse
    const candidate = slot_time && slot_time.includes('T') ? slot_time : `${slot_date || ''} ${slot_time || ''}`;
    let dt = null;
    if (candidate && candidate.includes('T')) {
      dt = parseISO(candidate);
    } else {
      // try new Date on combined string
      const tmp = new Date(candidate);
      if (!isNaN(tmp)) dt = tmp;
    }
    if (dt && !isNaN(dt)) return format(dt, 'PPP p');
  } catch (e) {
    // ignore parse errors
  }
  // fallback
  return `${slot_date || ''} ${slot_time || ''}`.trim();
}
