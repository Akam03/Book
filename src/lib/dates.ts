const WORDS = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty'];
export const chapterWord = (n: number) => WORDS[n] ?? String(n);

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const formatMonth = (d: Date) =>
  d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Day 1 = the day you started dating. Returns null for dates before that. */
export function dayNumber(date: Date, since: string): number | null {
  const start = Date.parse(since + 'T00:00:00Z');
  const n = Math.floor((date.getTime() - start) / 86400000) + 1;
  return n >= 1 ? n : null;
}
