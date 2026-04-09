/**
 * Simple linear regression forecast for time series data.
 * Takes existing data points and returns predicted future values.
 */

type DataPoint = { date: string; value: number };

/**
 * Compute linear regression (y = mx + b) from a series of values.
 */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Generate forecast data points for the next `forecastDays` days.
 * Returns combined array of actual + forecast data.
 */
export function generateForecast(
  data: DataPoint[],
  forecastDays: number = 7,
): { date: string; value: number | null; forecast: number | null }[] {
  if (data.length < 3) {
    return data.map((d) => ({ date: d.date, value: d.value as number | null, forecast: null as number | null }));
  }

  const values = data.map((d) => d.value);
  const { slope, intercept } = linearRegression(values);

  // Actual data — no forecast
  const result: { date: string; value: number | null; forecast: number | null }[] = data.map((d) => ({
    date: d.date,
    value: d.value,
    forecast: null,
  }));

  // Bridge point: last actual value is also first forecast
  const lastActual = data[data.length - 1];
  result[result.length - 1].forecast = lastActual.value;

  // Future predictions
  const lastDate = new Date(lastActual.date);
  const n = data.length;

  for (let i = 1; i <= forecastDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    const predicted = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));

    result.push({
      date: futureDate.toISOString().slice(0, 10),
      value: null,
      forecast: predicted,
    });
  }

  return result;
}
