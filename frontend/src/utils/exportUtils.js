/**
 * exportUtils.js
 * ============================================================================
 * Client-side CSV Export and Printable MOE Compliance Report Utilities
 * Unit: COS30049 Computing Technology Innovation Project (Group 7 - SchoolAir)
 */

/**
 * Converts an array of flat objects into a RFC-4180 compliant CSV string and
 * triggers an immediate browser file download.
 */
export function downloadCsvFile(filename, rows) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return /[,"\n]/.test(str) ? `"${str}"` : str;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the current School Activity Safety Assessment (including 24-hour
 * diurnal forecast and TreeSHAP attributions) to a CSV report.
 */
export function exportAssessmentToCsv(assessment) {
  if (!assessment) return;

  const { school_info, station, event_context, prediction, moe_safety, weather_outlook, diurnal_24h_series } =
    assessment;

  const rows = (diurnal_24h_series || []).map((hr) => ({
    School_Name: school_info?.school_name || station?.district,
    Matched_DOE_Station: station?.district,
    Corridor: station?.corridor,
    Event_Date: event_context?.event_date,
    Month: event_context?.month_name,
    Activity_Type: event_context?.activity_type,
    Student_Cohort: moe_safety?.cohort_label,
    Hour_24H: hr.time_label,
    Is_Selected_Event_Window: hr.is_selected_window ? 'YES' : 'NO',
    Predicted_API_Selected_Regime: hr.predicted_api,
    Predicted_API_Typical: hr.typical_api,
    Predicted_API_Peak_Haze: hr.peak_haze_api,
    MOE_Safety_Directive: hr.tier_label,
    Temperature_C: hr.temperature,
    Humidity_Pct: hr.humidity,
    Wind_Speed_ms: hr.wind_speed,
    Overall_Event_API: prediction?.predicted_api,
    Model_Confidence_Pct: prediction?.confidence_pct,
    Dominant_SHAP_Driver: prediction?.dominant_driver,
    Inference_Source: weather_outlook?.inference_source,
  }));

  const safeDistrict = (station?.district || 'Station').replace(/\s+/g, '_');
  const safeDate = event_context?.event_date || 'Forecast';
  downloadCsvFile(`SchoolAir_Safety_Report_${safeDistrict}_${safeDate}.csv`, rows);
}

/**
 * Exports the 12-Month Seasonal Event Planner summary for a district to CSV.
 */
export function exportSeasonalPlannerToCsv(plannerData) {
  if (!plannerData || !plannerData.months) return;

  const rows = plannerData.months.map((m) => ({
    District: plannerData.district,
    State: plannerData.state,
    Corridor: plannerData.corridor,
    Student_Cohort: plannerData.cohort,
    Month_Number: m.month,
    Month_Name: m.month_name,
    MOE_Recommended_Tier: m.tier_label,
    Seasonal_Planning_Risk_Index: m.planning_risk_index,
    Typical_Predicted_API: m.pred_mean_api,
    Peak_Haze_Surge_API: m.pred_peak_haze_api,
    Safest_Morning_Hour: m.safest_hour_label,
    Peak_Risk_Hour: m.peak_risk_hour_label,
    Mean_Temperature_C: m.mean_temp,
    Mean_Humidity_Pct: m.mean_humidity,
    Mean_Wind_Speed_ms: m.mean_wind,
    Historical_Safe_Hours_Pct: m.safe_pct,
    Is_Optimal_Month:
      plannerData.optimal_month && plannerData.optimal_month.month === m.month ? 'OPTIMAL' : '',
  }));

  const safeDistrict = (plannerData.district || 'District').replace(/\s+/g, '_');
  downloadCsvFile(`SchoolAir_12Month_Planner_${safeDistrict}.csv`, rows);
}

/**
 * Exports all scheduled school outdoor events to a CSV file.
 */
export function exportScheduledEventsToCsv(events) {
  if (!events || events.length === 0) return;

  const rows = events.map((ev) => ({
    Event_ID: ev.event_id,
    Event_Title: ev.event_title,
    School_Name: ev.school_name,
    DOE_Station_District: ev.district,
    Corridor: ev.corridor,
    Event_Date: ev.event_date,
    Start_Hour: `${String(ev.start_hour).padStart(2, '0')}:00`,
    Duration_Hours: ev.duration_hours,
    Activity_Type: ev.activity_type,
    Student_Cohort: ev.cohort,
    Participants_Count: ev.participants_count,
    Weather_Regime: ev.weather_regime,
    AI_Predicted_API: ev.predicted_api,
    MOE_Safety_Directive: ev.tier_label,
    Recommended_Safest_Hour: `${String(ev.safest_hour || 8).padStart(2, '0')}:00`,
    Temperature_C: ev.temperature,
    Humidity_Pct: ev.humidity,
    Wind_Speed_ms: ev.wind_speed,
    Notes: ev.notes,
  }));

  downloadCsvFile('SchoolAir_Master_Event_Schedule.csv', rows);
}
