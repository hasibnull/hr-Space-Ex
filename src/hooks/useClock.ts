import { useState, useEffect } from 'react';
import { ClockFormat } from '../types';
import { formatTime, formatDate } from '../utils/formatters';

export function useClock(clockFormat: ClockFormat = '12h', showSeconds: boolean = true) {
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { timeStr, period } = formatTime(date, clockFormat, showSeconds);
  const dateStr = formatDate(date);

  return {
    date,
    timeStr,
    period,
    dateStr,
  };
}
