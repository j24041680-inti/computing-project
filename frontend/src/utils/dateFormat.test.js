import { formatDate, parseDisplayDate } from './dateFormat';

test('formats stored calendar dates in day/month/year order', () => {
  expect(formatDate('2026-04-15')).toBe('15/04/2026');
  expect(formatDate('2026-11-03')).toBe('03/11/2026');
});

test('accepts real calendar dates and preserves leap days', () => {
  expect(parseDisplayDate('29/02/2028')).toBe('2028-02-29');
  expect(parseDisplayDate('03/11/2026')).toBe('2026-11-03');
});

test('rejects impossible dates and ambiguous input', () => {
  for (const value of ['29/02/2026', '31/04/2026', '15/13/2026', '00/11/2026', '3/11/2026', '2026-11-03', '']) {
    expect(parseDisplayDate(value)).toBeNull();
  }
});
