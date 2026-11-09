import { formatDate } from '../utils/dateFormat';
import React from 'react';
import { scaleLinear, line, curveMonotoneX, max } from 'd3';
import { formatApi } from '../utils/formatApi';

// Static D3 geometry prints immediately, independent of tabs and screen animations.
function DailyChart({ rows, start, duration }) {
  const x = scaleLinear().domain([0, 23]).range([46, 674]);
  const y = scaleLinear().domain([0, Math.max(100, max(rows, (d) => d.predicted_api) || 100)]).nice().range([205, 20]);
  const curve = line().x((d) => x(d.hour)).y((d) => y(d.predicted_api)).curve(curveMonotoneX);
  return <svg viewBox="0 0 700 250" role="img" aria-label="24-hour historical seasonal API estimates">
    {y.ticks(5).map((v) => <g key={v}><line x1="46" x2="674" y1={y(v)} y2={y(v)} stroke="#e2e8f0" /><text x="38" y={y(v) + 4} textAnchor="end">{formatApi(v)}</text></g>)}
    <text x="46" y="12">API</text>
    {[0, 6, 12, 18, 23].map((h) => <text key={h} x={x(h)} y="227" textAnchor="middle">{String(h).padStart(2, '0')}:00</text>)}
    <line x1="46" x2="674" y1={y(50)} y2={y(50)} stroke="#15803d" strokeDasharray="5 4" />
    <path d={curve(rows) || ''} fill="none" stroke="#2563eb" strokeWidth="2.5" />
    {rows.filter((d) => (d.hour - start + 24) % 24 < duration).map((d) => <circle key={d.hour} cx={x(d.hour)} cy={y(d.predicted_api)} r="4" fill="#2563eb" stroke="white" />)}
    <text x="46" y="248">Blue dots: selected event hours · Green dashed line: 50.0 API</text>
  </svg>;
}

function AttributionChart({ rows }) {
  const limit = max(rows, (d) => Math.abs(d.shap_value)) || 1;
  const x = scaleLinear().domain([-limit, limit]).range([300, 630]);
  return <svg viewBox={`0 0 700 ${rows.length * 33 + 40}`} role="img" aria-label="Historical seasonal feature contributions in API units">
    <line x1={x(0)} x2={x(0)} y1="0" y2={rows.length * 33} stroke="#94a3b8" />
    {rows.map((d, i) => <g key={d.feature} transform={`translate(0, ${i * 33})`}>
      <text x="0" y="18">{d.feature}</text>
      <rect x={Math.min(x(0), x(d.shap_value))} y="4" width={Math.max(1, Math.abs(x(d.shap_value) - x(0)))} height="19" rx="3" fill={d.shap_value >= 0 ? '#b45309' : '#15803d'} />
      <text x="690" y="18" textAnchor="end">{d.shap_value > 0 ? '+' : ''}{formatApi(d.shap_value)}</text>
    </g>)}
    <text x="0" y={rows.length * 33 + 24}>Green: lowers predicted API · Amber: raises predicted API</text>
  </svg>;
}

export default function SafetyPrintReport({ assessment, modelResult }) {
  if (!assessment) return null;
  const { school_info: school, station, event_context: event, prediction, moe_safety: safety, weather_outlook: weather, time_optimization: time } = assessment;
  const header = (page) => <header className="report-header"><div><p className="report-brand">SCHOOLAIR</p><h1>School Activity Safety Report</h1></div><span>{page} / 2</span></header>;
  const footer = <footer className="report-footer">Historical seasonal estimates for planning · Not live air-quality observations.</footer>;
  return <article className="safety-print-report">
    <section className="report-page">
      {header(1)}
      <h2>{school?.school_name || station.district}</h2>
      <dl className="report-details">
        <div><dt>Event date</dt><dd>{event.event_date ? formatDate(event.event_date) : event.month_name}</dd></div>
        <div><dt>Event time</dt><dd>{event.start_time_label}–{event.end_time_label} ({event.duration_hours} hours)</dd></div>
        <div><dt>Activity</dt><dd>{event.activity_type}</dd></div>
        <div><dt>Monitoring station</dt><dd>{station.district}, {station.state}</dd></div>
        <div><dt>Student group</dt><dd>{safety.cohort_label}</dd></div>
        <div><dt>Data source</dt><dd>Precomputed XGBoost seasonal dataset</dd></div>
      </dl>
      <div className="report-metrics">
        <div><span>Predicted API</span><strong>{formatApi(prediction.predicted_api)}</strong><small>{safety.tier_label}</small></div>
        <div><span>Peak event API</span><strong>{formatApi(prediction.peak_window_api)}</strong><small>Selected event hours</small></div>
        <div><span>Cleanest daytime hour</span><strong>{time.safest_daytime_label}</strong><small>{formatApi(time.safest_daytime_api)} API</small></div>
      </div>
      <h3>Safety recommendation</h3>
      <p className="report-recommendation">{safety.headline}</p>
      <ul>{(safety.advisories || []).map((text) => <li key={text}>{text}</li>)}</ul>
      <h3>24-hour seasonal outlook</h3>
      <DailyChart rows={assessment.diurnal_24h_series || []} start={event.start_hour} duration={event.duration_hours} />
      <p className="report-note">Historical weather inputs: {weather.temperature}°C · {weather.humidity}% humidity · {weather.wind_speed} m/s wind. Readings shown to one decimal place.</p>
      {footer}
    </section>
    <section className="report-page">
      {header(2)}
      <h2>Understanding the prediction</h2>
      <p>Feature contributions explain the precomputed seasonal estimate for the selected start hour. The event summary on page 1 covers the full selected time window.</p>
      <h3>Feature contributions · API units</h3>
      <AttributionChart rows={assessment.shap_attributions || []} />
      <h3>How to interpret this report</h3>
      <p>The selected date identifies the planned event. Estimates use historical patterns for the selected district, month and hour; they are not date-specific weather forecasts. Planning years reuse the same seasonal dataset.</p>
      <p>{safety.threshold_note}</p>
      {modelResult && <aside className="report-model"><h3>Separate model run</h3><p><strong>{formatApi(modelResult.predicted_api)} API · {modelResult.moe_safety?.tier_label}</strong></p><p>{modelResult.basis}</p><p>The main report readings remain the precomputed dataset values.</p></aside>}
      {footer}
    </section>
  </article>;
}
