// Dates come from the API as 'YYYY-MM-DD' strings; shown in India time.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseDate = (d) => {
  const [y, m, day] = String(d).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
};

export const fmt = {
  date(d) { // 14 Nov 2026
    if (!d) return 'Date will be updated';
    const x = parseDate(d);
    return `${String(x.getUTCDate()).padStart(2, '0')} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  },
  weekday(d) { return d ? DAYS[parseDate(d).getUTCDay()] : ''; },
  shortDay(d) { return d ? DAYS[parseDate(d).getUTCDay()].slice(0, 3) : ''; },
  time(t) { // 10:00 AM
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  },
  timeRange(a, b) {
    if (!a) return 'Time will be updated';
    return b ? `${fmt.time(a)} – ${fmt.time(b)}` : fmt.time(a);
  },
  stamp(ts) { // 29 Oct 2026, 04:15 PM (India time)
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    }).formatToParts(new Date(ts)).reduce((o, p) => ((o[p.type] = p.value), o), {});
    return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toUpperCase()}`;
  },
};
