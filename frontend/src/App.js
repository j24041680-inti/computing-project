/**
 * App.js — SchoolAir Full-Stack Application
 * ============================================================================
 * Updated:
 *  - iPad Mini / Tablet Home Search: When inputs form a 2x2 grid, "Check Safety"
 *    button spans both columns and centers cleanly in the middle.
 *  - Retains all responsive, multi-year, and state/district improvements.
 *
 * Unit: COS30049 Group 7 (Poh Wei Le, Ng Boon Ping, Kennard Chan Kai Lik, Tee Ming Jun)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Box,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  LinearProgress,
  Tooltip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Shield as ShieldIcon,
  CalendarMonth as CalendarIcon,
  Insights as InsightsIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Bolt as BoltIcon,
  Science as ScienceIcon,
  Print as PrintIcon,
  ArrowForward as ArrowForwardIcon,
  Air as AirIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Speed as SpeedIcon,
  Cloud as CloudIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import axios from 'axios';

import './App.css';
import SafetyGaugeD3 from './components/charts/SafetyGaugeD3';
import DiurnalTrendD3 from './components/charts/DiurnalTrendD3';
import ShapAttributionD3 from './components/charts/ShapAttributionD3';
import SeasonalHeatmapD3 from './components/charts/SeasonalHeatmapD3';
import {
  exportAssessmentToCsv,
  exportSeasonalPlannerToCsv,
  exportScheduledEventsToCsv,
} from './utils/exportUtils';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const ACTIVITY_OPTIONS = [
  'Annual Sports Day (Hari Sukan)',
  'Morning Outdoor Assembly',
  '1-Hour PE Class',
  'Cross-Country Run (Merentas Desa)',
  'Outdoor Football / Netball Clinic',
  'Uniformed Bodies Parade & Camping',
];

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SUPPORTED_YEARS = [2026, 2027, 2028, 2029];

const MALAYSIA_STATES = [
  'All States',
  'Selangor',
  'Kuala Lumpur',
  'Putrajaya',
  'Pulau Pinang',
  'Johor',
  'Sarawak',
  'Sabah',
  'Labuan',
];

function AnimatedNumber({ value, duration = 1000, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }
    let rafId;
    const animate = (time) => {
      if (!startRef.current) startRef.current = time;
      const progress = Math.min((time - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) rafId = requestAnimationFrame(animate);
      else setDisplay(value);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  if (typeof value !== 'number') return <>{value}</>;
  return (
    <>
      {display}
      {suffix}
    </>
  );
}

function KpiCard({ icon, label, value, sub, color = '#2563eb', numeric = false, suffix = '' }) {
  return (
    <Card
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 3.5,
        width: '100%',
        maxWidth: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          borderColor: color,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}15`, color }}>
          {React.cloneElement(icon, { fontSize: 'small' })}
        </Avatar>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1.2 }}
        >
          {label}
        </Typography>
      </Stack>
      <Box sx={{ mt: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
          {numeric ? <AnimatedNumber value={value} suffix={suffix} /> : value}
        </Typography>
        {sub && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block', minHeight: 16 }}
          >
            {sub}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // App Theme & UI State
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  const showNotice = (message, severity = 'success') =>
    setSnackbar({ open: true, severity, message });

  // Dialog States
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  // Directory Data
  const [stations, setStations] = useState([]);
  const [corridors, setCorridors] = useState([
    'Central Corridor',
    'Northern Corridor',
    'Southern Corridor',
    'East Malaysia',
  ]);
  const [scheduledEvents, setScheduledEvents] = useState([]);

  // Multi-Year & Date State
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [eventDate, setEventDate] = useState('2026-04-15');
  const [startHour, setStartHour] = useState(8);
  const [durationHours] = useState(2);

  // State & District Two-Tier Selection + Custom School Name
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedDistrict, setSelectedDistrict] = useState('Petaling Jaya');
  const [customSchoolName, setCustomSchoolName] = useState('SK Sri Petaling');
  const [activityType, setActivityType] = useState('Annual Sports Day (Hari Sukan)');
  const [cohort, setCohort] = useState('general');
  const [weatherRegime, setWeatherRegime] = useState('typical');

  // Isolated Analytics State
  const [analyticsDistrict, setAnalyticsDistrict] = useState('Petaling Jaya');
  const [analyticsCorridor, setAnalyticsCorridor] = useState('All Corridors');

  // Chart Tabs
  const [checkerChartTab, setCheckerChartTab] = useState(0);
  const [analyticsTab, setAnalyticsTab] = useState(0);

  // Payloads
  const [assessment, setAssessment] = useState(null);
  const [plannerData, setPlannerData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Dialog Inputs
  const [newEventTitle, setNewEventTitle] = useState('Annual Inter-House Sports Day');
  const [newEventParticipants, setNewEventParticipants] = useState(200);
  const [customApiInput, setCustomApiInput] = useState('');
  const [customTempInput, setCustomTempInput] = useState('');
  const [customHumInput, setCustomHumInput] = useState('');
  const [customWindInput, setCustomWindInput] = useState('');

  // Fluid Material UI Theme
  const theme = useMemo(() => {
    let baseTheme = createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
        secondary: { main: '#6366f1' },
        success: { main: '#16a34a' },
        warning: { main: '#ca8a04' },
        error: { main: '#dc2626' },
        background: {
          default: darkMode ? '#0b1220' : '#f8fafc',
          paper: darkMode ? '#111b2e' : '#ffffff',
        },
        text: {
          primary: darkMode ? '#f1f5f9' : '#0f172a',
          secondary: darkMode ? '#94a3b8' : '#475569',
        },
        divider: darkMode ? '#1e293b' : '#e2e8f0',
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        h3: { fontWeight: 900, letterSpacing: '-0.8px' },
        h4: { fontWeight: 800, letterSpacing: '-0.5px' },
        h5: { fontWeight: 800, letterSpacing: '-0.3px' },
        h6: { fontWeight: 700, fontSize: '1.02rem', letterSpacing: '-0.2px' },
        button: { textTransform: 'none', fontWeight: 600 },
        body2: { fontSize: '0.875rem', lineHeight: 1.6 },
        caption: { fontSize: '0.75rem', letterSpacing: '0.2px' },
      },
      shape: { borderRadius: 14 },
      components: {
        MuiContainer: {
          styleOverrides: {
            root: {
              width: '100%',
              maxWidth: '100% !important',
              paddingLeft: '14px',
              paddingRight: '14px',
              '@media (min-width: 600px)': {
                paddingLeft: '20px',
                paddingRight: '20px',
              },
              '@media (min-width: 1200px)': {
                maxWidth: '1440px !important',
                paddingLeft: '32px',
                paddingRight: '32px',
              },
            },
          },
        },
        MuiCard: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: {
              border: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
              backgroundImage: 'none',
              borderRadius: 14,
              maxWidth: '100%',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              height: 40,
              fontSize: '0.84rem',
            },
          },
        },
        MuiTextField: {
          defaultProps: { size: 'small' },
          styleOverrides: {
            root: {
              '& .MuiInputBase-root': {
                height: 40,
                fontSize: '0.86rem',
              },
            },
          },
        },
      },
    });
    return responsiveFontSizes(baseTheme);
  }, [darkMode]);

  const filteredStations = useMemo(() => {
    if (!selectedState || selectedState === 'All States') return stations;
    return stations.filter((s) => s.state?.toLowerCase() === selectedState.toLowerCase());
  }, [stations, selectedState]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [dirRes, evRes] = await Promise.all([
        axios.get(`${API_BASE}/stations`),
        axios.get(`${API_BASE}/events`),
      ]);
      const stList = dirRes.data.stations || [];
      setStations(stList);
      if (dirRes.data.corridors) setCorridors(dirRes.data.corridors);
      setScheduledEvents(evRes.data.events || []);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchEventAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        district: selectedDistrict,
        custom_school_name: customSchoolName,
        event_date: eventDate,
        month: selectedMonth,
        start_hour: startHour,
        duration_hours: durationHours,
        activity_type: activityType,
        cohort,
        weather_regime: weatherRegime,
      };
      const res = await axios.get(`${API_BASE}/forecast-lookup`, { params });
      setAssessment(res.data);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, customSchoolName, eventDate, selectedMonth, startHour, durationHours, activityType, cohort, weatherRegime]);

  useEffect(() => {
    fetchEventAssessment();
  }, [fetchEventAssessment]);

  const fetchSeasonalPlanner = useCallback(async () => {
    try {
      const params = {
        district: selectedDistrict,
        cohort,
        weather_regime: weatherRegime,
        year: selectedYear,
      };
      const res = await axios.get(`${API_BASE}/seasonal-planner`, { params });
      setPlannerData(res.data);
    } catch {}
  }, [selectedDistrict, cohort, weatherRegime, selectedYear]);

  useEffect(() => {
    fetchSeasonalPlanner();
  }, [fetchSeasonalPlanner]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const params = { district: analyticsDistrict, corridor: analyticsCorridor };
      const res = await axios.get(`${API_BASE}/analytics`, { params });
      setAnalyticsData(res.data);
    } catch {}
  }, [analyticsDistrict, analyticsCorridor]);

  useEffect(() => {
    if (location.pathname === '/analytics') fetchAnalyticsData();
  }, [location.pathname, fetchAnalyticsData]);

  const handleYearChange = (newYear) => {
    const yr = Number(newYear);
    setSelectedYear(yr);
    const mPadded = String(selectedMonth).padStart(2, '0');
    setEventDate(`${yr}-${mPadded}-15`);
    showNotice(`Calendar updated to ${yr} school year.`);
  };

  const handleDateChange = (newDateStr) => {
    setEventDate(newDateStr);
    if (/^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) {
      const [y, m] = newDateStr.split('-').map(Number);
      if (y >= 2024 && y <= 2035) setSelectedYear(y);
      if (m >= 1 && m <= 12) setSelectedMonth(m);
    }
  };

  const handleMonthChange = (newMonthInt) => {
    const m = Number(newMonthInt);
    setSelectedMonth(m);
    setEventDate(`${selectedYear}-${String(m).padStart(2, '0')}-15`);
  };

  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    const validStations =
      stateName === 'All States'
        ? stations
        : stations.filter((s) => s.state?.toLowerCase() === stateName.toLowerCase());
    if (validStations.length > 0) {
      setSelectedDistrict(validStations[0].district);
    }
  };

  const handleCreateEvent = async () => {
    const trimmedTitle = (newEventTitle || '').trim();
    if (trimmedTitle.length < 3) {
      showNotice('Event title must be at least 3 characters.', 'error');
      return;
    }
    const countNum = Number(newEventParticipants);
    if (Number.isNaN(countNum) || countNum < 1 || countNum > 5000) {
      showNotice('Student count must be between 1 and 5,000.', 'error');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/events`, {
        event_title: trimmedTitle,
        school_name: customSchoolName || `${selectedDistrict} School`,
        district: selectedDistrict,
        event_date: eventDate,
        start_hour: startHour,
        duration_hours: durationHours,
        activity_type: activityType,
        cohort,
        participants_count: countNum,
        weather_regime: weatherRegime,
      });
      setScheduledEvents((prev) => [res.data.event, ...prev]);
      setAddEventDialogOpen(false);
      showNotice(res.data.message || `Saved: ${trimmedTitle}`);
    } catch (err) {
      showNotice(err.response?.data?.message || 'Failed to save event.', 'error');
    }
  };

  const handleOptimizeEvent = async (ev, mode = 'hour') => {
    const payload =
      mode === 'month'
        ? {
            event_date: `${selectedYear}-04-15`,
            start_hour: ev.safest_hour || 8,
            weather_regime: 'typical',
          }
        : { start_hour: ev.safest_hour || 7 };
    try {
      const res = await axios.put(`${API_BASE}/events/${ev.event_id}`, payload);
      setScheduledEvents((prev) =>
        prev.map((item) => (item.event_id === ev.event_id ? res.data.event : item))
      );
      showNotice(res.data.message);
    } catch {
      showNotice('Update failed.', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const res = await axios.delete(`${API_BASE}/events/${eventId}`);
      setScheduledEvents((prev) => prev.filter((item) => item.event_id !== eventId));
      showNotice(res.data.message || `Event ${eventId} removed.`);
    } catch {
      showNotice('Delete failed.', 'error');
    }
  };

  const handleRunWhatIfTest = async (bypassClient = false) => {
    const apiVal = customApiInput !== '' ? Number(customApiInput) : null;
    const tempVal = customTempInput !== '' ? Number(customTempInput) : null;
    const humVal = customHumInput !== '' ? Number(customHumInput) : null;
    const windVal = customWindInput !== '' ? Number(customWindInput) : null;

    if (!bypassClient) {
      if (apiVal !== null && (apiVal < 0 || apiVal > 1000)) {
        const c = Math.min(1000, Math.max(0, apiVal));
        setCustomApiInput(String(c));
        showNotice(`Clamped API to ${c}.`, 'warning');
        return;
      }
      if (tempVal !== null && (tempVal < 15 || tempVal > 45)) {
        const c = Math.min(45, Math.max(15, tempVal));
        setCustomTempInput(String(c));
        showNotice(`Clamped Temp to ${c}°C.`, 'warning');
        return;
      }
    }

    try {
      const res = await axios.post(`${API_BASE}/assess-event`, {
        district: selectedDistrict,
        custom_school_name: customSchoolName,
        event_date: eventDate,
        month: selectedMonth,
        start_hour: startHour,
        duration_hours: durationHours,
        activity_type: activityType,
        cohort,
        weather_regime: 'custom_override',
        override_api: apiVal,
        override_temperature: tempVal,
        override_humidity: humVal,
        override_wind_speed: windVal,
      });
      setAssessment(res.data);
      setValidationDialogOpen(false);
      showNotice(
        `Live Model: ${res.data.prediction.predicted_api} API (${res.data.moe_safety.tier_label})`
      );
    } catch (err) {
      showNotice(
        `Server: ${
          err.response?.data?.details?.[0] || err.response?.data?.message || 'Validation error'
        }`,
        'error'
      );
    }
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Safety Checker', path: '/checker', icon: <ShieldIcon fontSize="small" /> },
    { label: 'Event Planner', path: '/planner', icon: <CalendarIcon fontSize="small" /> },
    { label: 'Analytics', path: '/analytics', icon: <InsightsIcon fontSize="small" /> },
  ];

  const getTierChipStyle = (riskKey) => {
    if (riskKey === 'safe') return { bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 };
    if (riskKey === 'caution') return { bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 700 };
    if (riskKey === 'move') return { bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 700 };
    return { bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700 };
  };

  const getTierIcon = (riskKey) => {
    if (riskKey === 'safe') return <CheckIcon fontSize="small" />;
    if (riskKey === 'caution') return <WarningIcon fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  const PageHeader = ({ title, subtitle, actions }) => (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1.5}
      sx={{ mb: 1, width: '100%', maxWidth: '100%' }}
    >
      <Box sx={{ maxWidth: '100%' }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.6rem' } }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
          {subtitle}
        </Typography>
      </Box>
      {actions && (
        <Box
          className="no-print"
          sx={{
            width: { xs: '100%', sm: 'auto' },
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </Box>
      )}
    </Stack>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        {/* =================================================================
            APP BAR (Fluid Container)
            ================================================================= */}
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          className="no-print"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: darkMode ? '#0b1220' : '#ffffff',
            zIndex: 1400,
            width: '100%',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ minHeight: 64, gap: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setDrawerOpen(true)}
                sx={{ display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1.2}
                onClick={() => navigate('/')}
                sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, cursor: 'pointer' }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <AirIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px' }}
                  >
                    SchoolAir
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1 }}
                  >
                    Malaysian Outdoor Safety Platform
                  </Typography>
                </Box>
              </Stack>

              {/* Navigation Items */}
              <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      startIcon={item.icon}
                      variant={active ? 'contained' : 'text'}
                      color={active ? 'primary' : 'inherit'}
                      size="small"
                      sx={{
                        px: 2,
                        py: 0.9,
                        borderRadius: 2.5,
                        fontWeight: active ? 700 : 600,
                        color: active ? '#fff' : 'text.secondary',
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ml: 2 }}>
                <Chip
                  size="small"
                  label={backendOnline ? 'Online' : 'Offline'}
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    borderColor: backendOnline ? '#86efac' : '#fca5a5',
                    color: backendOnline ? '#166534' : '#991b1b',
                    bgcolor: backendOnline ? '#f0fdf4' : '#fef2f2',
                  }}
                />
                <Tooltip title="Toggle dark / light mode">
                  <Switch
                    size="small"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />
                </Tooltip>
              </Stack>
            </Toolbar>
          </Container>
          {loading && <LinearProgress sx={{ height: 2 }} />}
        </AppBar>

        {/* Mobile Navigation Drawer */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 260, pt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 2.5, pb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AirIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                SchoolAir
              </Typography>
            </Stack>
            <Divider />
            <List>
              {navItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      setDrawerOpen(false);
                    }}
                    selected={location.pathname === item.path}
                    sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* =================================================================
            MAIN CONTAINER
            ================================================================= */}
        <Container
          component="main"
          maxWidth="xl"
          sx={{
            py: { xs: 2, sm: 3, md: 4 },
            flex: 1,
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Box key={location.key} className="page-enter">
            <Routes>
              {/* =========================== HOME =========================== */}
              <Route
                path="/"
                element={
                  <Stack spacing={{ xs: 2.5, md: 3.5 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 2.5, sm: 4, md: 5.5 },
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 4,
                        background: darkMode
                          ? 'linear-gradient(135deg, #111b2e 0%, #0b1220 100%)'
                          : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 60%, #f5f3ff 100%)',
                      }}
                    >
                      <Chip
                        icon={<SpeedIcon fontSize="small" />}
                        label="Nationwide AI Decision Platform • All Malaysian Schools & Districts"
                        color="primary"
                        size="small"
                        sx={{ mb: 2, fontWeight: 700 }}
                      />
                      <Typography
                        variant="h3"
                        sx={{ fontSize: { xs: '1.75rem', sm: '2.3rem', md: '2.85rem' }, mb: 1.5 }}
                      >
                        Plan Safe Outdoor{' '}
                        <Box
                          component="span"
                          sx={{
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          School Events
                        </Box>
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ maxWidth: 640, mx: 'auto', mb: 3 }}
                      >
                        Select your state & district across Malaysia to check air quality and plan
                        ahead for {selectedYear}–{selectedYear + 1}.
                      </Typography>

                      {/* Clean Quick Lookup Bar: In 2x2 grid (iPad Mini), button centers in the middle */}
                      <Card
                        sx={{
                          p: { xs: 1.8, sm: 2.2 },
                          maxWidth: 960,
                          mx: 'auto',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                              xs: '1fr',
                              sm: '1fr 1fr',
                              md: '1.2fr 1.2fr 0.9fr 1fr auto',
                            },
                            gap: 1.5,
                            alignItems: 'center',
                          }}
                        >
                          <TextField
                            select
                            fullWidth
                            label="State / Region"
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                          >
                            {MALAYSIA_STATES.map((st) => (
                              <MenuItem key={st} value={st}>
                                {st}
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            select
                            fullWidth
                            label="District / Station"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                          >
                            {filteredStations.map((s) => (
                              <MenuItem key={s.district} value={s.district}>
                                {s.district} ({s.state})
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            select
                            fullWidth
                            label="Year"
                            value={selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                          >
                            {SUPPORTED_YEARS.map((y) => (
                              <MenuItem key={y} value={y}>
                                {y}
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            select
                            fullWidth
                            label="Month"
                            value={selectedMonth}
                            onChange={(e) => handleMonthChange(e.target.value)}
                          >
                            {MONTH_NAMES.slice(1).map((mName, idx) => (
                              <MenuItem key={mName} value={idx + 1}>
                                {mName}
                              </MenuItem>
                            ))}
                          </TextField>

                          {/* "Check Safety" Button: In iPad Mini (sm), spans both cols and centers in the middle! */}
                          <Box
                            sx={{
                              gridColumn: { xs: 'span 1', sm: 'span 2', md: 'auto' },
                              display: 'flex',
                              justifyContent: 'center',
                              width: '100%',
                            }}
                          >
                            <Button
                              variant="contained"
                              endIcon={<ArrowForwardIcon />}
                              onClick={() => navigate('/checker')}
                              sx={{
                                height: 40,
                                px: 4,
                                width: { xs: '100%', sm: '260px', md: 'auto' },
                              }}
                            >
                              Check Safety
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    </Paper>

                    {/* KPI Cards */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: 2,
                      }}
                    >
                      {[
                        {
                          value: 26,
                          label: 'Continuous DOE Stations',
                          icon: <LocationIcon />,
                          color: '#2563eb',
                        },
                        {
                          value: '10,000+',
                          label: 'Malaysian Schools Supported',
                          icon: <SchoolIcon />,
                          color: '#7c3aed',
                        },
                        {
                          value: `${selectedYear}–${selectedYear + 2}`,
                          label: 'Multi-Year Planning Horizon',
                          icon: <CalendarIcon />,
                          color: '#0891b2',
                        },
                        {
                          value: 6.96,
                          label: 'MAE API Accuracy (XGBoost)',
                          icon: <TrendingUpIcon />,
                          color: '#16a34a',
                          decimal: true,
                        },
                      ].map((stat) => (
                        <Card
                          key={stat.label}
                          sx={{ textAlign: 'center', py: 2.2, px: 2, height: '100%' }}
                        >
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              mx: 'auto',
                              mb: 1,
                              bgcolor: `${stat.color}15`,
                              color: stat.color,
                            }}
                          >
                            {stat.icon}
                          </Avatar>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 900, color: stat.color, fontSize: '1.35rem' }}
                          >
                            {stat.decimal ? '±' : ''}
                            {typeof stat.value === 'number' ? (
                              <AnimatedNumber value={stat.value} />
                            ) : (
                              stat.value
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            {stat.label}
                          </Typography>
                        </Card>
                      ))}
                    </Box>

                    {/* 3 Step Modules */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                        gap: 2.5,
                      }}
                    >
                      {[
                        {
                          title: 'Safety Checker',
                          desc: 'Assess specific dates & hours for any Malaysian school or district.',
                          path: '/checker',
                          icon: <ShieldIcon />,
                          color: '#2563eb',
                          tag: 'Step 1',
                        },
                        {
                          title: '12-Month Planner',
                          desc: 'Identify low-risk months across the year and manage school event schedules.',
                          path: '/planner',
                          icon: <CalendarIcon />,
                          color: '#7c3aed',
                          tag: 'Step 2',
                        },
                        {
                          title: 'D3 Analytics',
                          desc: 'Inspect multi-day haze trends, regional correlation matrices, and TreeSHAP.',
                          path: '/analytics',
                          icon: <InsightsIcon />,
                          color: '#0891b2',
                          tag: 'Step 3',
                        },
                      ].map((mod) => (
                        <Card
                          key={mod.title}
                          onClick={() => navigate(mod.path)}
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                              borderColor: mod.color,
                            },
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 2.8 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                              sx={{ mb: 1.5 }}
                            >
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: `${mod.color}15`,
                                  color: mod.color,
                                }}
                              >
                                {mod.icon}
                              </Avatar>
                              <Box>
                                <Chip
                                  label={mod.tag}
                                  size="small"
                                  sx={{
                                    bgcolor: `${mod.color}15`,
                                    color: mod.color,
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    height: 18,
                                    mb: 0.5,
                                  }}
                                />
                                <Typography variant="h6">{mod.title}</Typography>
                              </Box>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {mod.desc}
                            </Typography>
                          </CardContent>
                          <Box sx={{ px: 2.8, pb: 2 }}>
                            <Button
                              endIcon={<ArrowForwardIcon fontSize="small" />}
                              sx={{ color: mod.color, fontWeight: 700, px: 0 }}
                            >
                              Open Module
                            </Button>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  </Stack>
                }
              />

              {/* =========================== CHECKER =========================== */}
              <Route
                path="/checker"
                element={
                  <Stack spacing={2.5}>
                    <PageHeader
                      title="School Activity Safety Checker"
                      subtitle="Select your state, district, and planned school event to assess air quality risk."
                      actions={
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto auto auto' },
                            gap: 1,
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ScienceIcon />}
                            onClick={() => setValidationDialogOpen(true)}
                          >
                            What-If Test
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => exportAssessmentToCsv(assessment)}
                          >
                            CSV
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                          >
                            Print
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setNewEventTitle(`${activityType} (${selectedDistrict})`);
                              setAddEventDialogOpen(true);
                            }}
                          >
                            Save Event
                          </Button>
                        </Box>
                      }
                    />

                    {/* Filter Bar with Matching 40px Heights */}
                    <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr',
                            md: 'repeat(3, 1fr)',
                            lg: '1.2fr 1.2fr 1.4fr 1fr 1fr 1.2fr 1fr',
                          },
                          gap: 1.5,
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          select
                          fullWidth
                          label="State / Region"
                          value={selectedState}
                          onChange={(e) => handleStateChange(e.target.value)}
                        >
                          {MALAYSIA_STATES.map((st) => (
                            <MenuItem key={st} value={st}>
                              {st}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          fullWidth
                          label="District / Station"
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                          {filteredStations.map((s) => (
                            <MenuItem key={s.district} value={s.district}>
                              {s.district} ({s.state})
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          fullWidth
                          label="School Name (Any School)"
                          placeholder="e.g. SK Sri Petaling"
                          value={customSchoolName}
                          onChange={(e) => setCustomSchoolName(e.target.value)}
                        />

                        <TextField
                          fullWidth
                          type="date"
                          label="Event Date"
                          InputLabelProps={{ shrink: true }}
                          value={eventDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                        />

                        <TextField
                          select
                          fullWidth
                          label="Start Hour"
                          value={startHour}
                          onChange={(e) => setStartHour(Number(e.target.value))}
                        >
                          {Array.from({ length: 14 }, (_, i) => i + 6).map((hr) => (
                            <MenuItem key={hr} value={hr}>
                              {String(hr).padStart(2, '0')}:00
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          fullWidth
                          label="Activity"
                          value={activityType}
                          onChange={(e) => setActivityType(e.target.value)}
                        >
                          {ACTIVITY_OPTIONS.map((act) => (
                            <MenuItem key={act} value={act}>
                              {act}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          fullWidth
                          label="Cohort"
                          value={cohort}
                          onChange={(e) => setCohort(e.target.value)}
                        >
                          <MenuItem value="general">General</MenuItem>
                          <MenuItem value="athletic">Athletic</MenuItem>
                          <MenuItem value="asthmatic">Asthmatic</MenuItem>
                        </TextField>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        📍 Selected District: <strong>{selectedDistrict}</strong> (
                        {stations.find((s) => s.district === selectedDistrict)?.corridor ||
                          'Monitoring Corridor'}
                        ) — Covers all primary and secondary schools in this district.
                      </Typography>
                    </Card>

                    {/* 4 KPI Summary Tiles */}
                    {assessment && (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                          gap: 2,
                        }}
                      >
                        <KpiCard
                          icon={<SpeedIcon />}
                          label="PREDICTED API"
                          value={assessment.prediction?.predicted_api}
                          sub={assessment.moe_safety?.tier_label}
                          color="#2563eb"
                          numeric
                        />
                        <KpiCard
                          icon={<CloudIcon />}
                          label="WEATHER OUTLOOK"
                          value={`${assessment.weather_outlook?.temperature}°C`}
                          sub={`${assessment.weather_outlook?.humidity}% RH • ${assessment.weather_outlook?.wind_speed} m/s`}
                          color="#0891b2"
                        />
                        <KpiCard
                          icon={<TrendingUpIcon />}
                          label="CLEANEST HOUR TODAY"
                          value={assessment.time_optimization?.safest_daytime_label || '—'}
                          sub={`${assessment.time_optimization?.safest_daytime_api} API`}
                          color="#16a34a"
                        />
                        <KpiCard
                          icon={<LocationIcon />}
                          label="MONITORING STATION"
                          value={assessment.station?.district || selectedDistrict}
                          sub={assessment.station?.corridor || 'State District'}
                          color="#7c3aed"
                        />
                      </Box>
                    )}

                    {/* Dual Visual Cards: Gauge + Tabbed Trend / SHAP */}
                    {assessment && (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
                          gap: 3,
                        }}
                      >
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="h6">Safety Dial Gauge</Typography>
                            <Chip
                              size="small"
                              label={`${assessment.prediction?.confidence_pct}% Confidence`}
                              variant="outlined"
                            />
                          </Stack>
                          <SafetyGaugeD3
                            predictedApi={assessment.prediction?.predicted_api}
                            peakWindowApi={assessment.prediction?.peak_window_api}
                            badgeColor={assessment.moe_safety?.badge_color}
                            thresholds={assessment.moe_safety?.thresholds}
                          />
                          <Alert
                            severity={
                              assessment.moe_safety?.risk_key === 'safe'
                                ? 'success'
                                : assessment.moe_safety?.risk_key === 'caution'
                                ? 'warning'
                                : 'error'
                            }
                            icon={getTierIcon(assessment.moe_safety?.risk_key)}
                            sx={{ mt: 2 }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {assessment.moe_safety?.headline}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {assessment.moe_safety?.advisories?.[0]}
                            </Typography>
                          </Alert>
                        </Card>

                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                          <Tabs
                            value={checkerChartTab}
                            onChange={(_, v) => setCheckerChartTab(v)}
                            sx={{ mb: 2 }}
                          >
                            <Tab label="24-Hour Curve" />
                            <Tab label="SHAP Drivers" />
                          </Tabs>
                          {checkerChartTab === 0 ? (
                            <DiurnalTrendD3
                              mode="diurnal24h"
                              diurnalSeries={assessment.diurnal_24h_series || []}
                              selectedStartHour={startHour}
                              durationHours={durationHours}
                              safestDaytimeHour={
                                assessment.time_optimization?.safest_daytime_hour || 7
                              }
                              thresholds={assessment.moe_safety?.thresholds}
                              onSelectHour={(hr) => setStartHour(hr)}
                            />
                          ) : (
                            <ShapAttributionD3
                              attributions={assessment.shap_attributions || []}
                            />
                          )}
                        </Card>
                      </Box>
                    )}
                  </Stack>
                }
              />

              {/* =========================== PLANNER =========================== */}
              <Route
                path="/planner"
                element={
                  <Stack spacing={2.5}>
                    {/* Minimal Title Header with Buttons */}
                    <PageHeader
                      title="12-Month Seasonal Event Planner"
                      subtitle="Identify the safest months across Malaysia and schedule events for upcoming years."
                      actions={
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto' },
                            gap: 1,
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => exportSeasonalPlannerToCsv(plannerData)}
                            sx={{ height: 40, px: 2 }}
                          >
                            Export CSV
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setAddEventDialogOpen(true)}
                            sx={{ height: 40, px: 2.5 }}
                          >
                            Add Event
                          </Button>
                        </Box>
                      }
                    />

                    {/* Dedicated Planner Filter Card (100% Mobile & iPhone Viewport Fixed) */}
                    <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr 1fr',
                            sm: '1fr 1.3fr 1.6fr',
                            md: '120px 180px 220px 1fr',
                          },
                          gap: 1.5,
                          alignItems: 'center',
                        }}
                      >
                        {/* Year Dropdown */}
                        <TextField
                          select
                          fullWidth
                          label="Academic Year"
                          value={selectedYear}
                          onChange={(e) => handleYearChange(e.target.value)}
                        >
                          {SUPPORTED_YEARS.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </TextField>

                        {/* State Dropdown */}
                        <TextField
                          select
                          fullWidth
                          label="State / Region"
                          value={selectedState}
                          onChange={(e) => handleStateChange(e.target.value)}
                        >
                          {MALAYSIA_STATES.map((st) => (
                            <MenuItem key={st} value={st}>
                              {st}
                            </MenuItem>
                          ))}
                        </TextField>

                        {/* District Dropdown (Spans full width on phone) */}
                        <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
                          <TextField
                            select
                            fullWidth
                            label="District / Monitoring Station"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                          >
                            {filteredStations.map((st) => (
                              <MenuItem key={st.district} value={st.district}>
                                {st.district} ({st.state})
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: { xs: 'none', md: 'block' },
                            textAlign: 'right',
                          }}
                        >
                          Showing forecast for <strong>{selectedDistrict}</strong> ({selectedYear})
                        </Typography>
                      </Box>
                    </Card>

                    {plannerData && (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' },
                          gap: 3,
                          width: '100%',
                        }}
                      >
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={1}
                            sx={{ mb: 2 }}
                          >
                            <Typography variant="h6">
                              {plannerData.district} — {selectedYear} Seasonal Calendar
                            </Typography>
                            <Chip
                              label={`★ Optimal Month: ${
                                plannerData.optimal_month?.month_name || 'April'
                              } ${selectedYear}`}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Stack>

                          {/* 12-Month Grid: 2 cols on mobile, 3 on tablet, 6 on desktop */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: 'repeat(2, 1fr)',
                                sm: 'repeat(3, 1fr)',
                                md: 'repeat(4, 1fr)',
                                lg: 'repeat(6, 1fr)',
                              },
                              gap: { xs: 1, sm: 1.5 },
                              width: '100%',
                            }}
                          >
                            {(plannerData.months || []).map((m) => {
                              const isOptimal =
                                plannerData.optimal_month &&
                                plannerData.optimal_month.month === m.month;
                              const isSelected = selectedMonth === m.month;
                              const chipStyle = getTierChipStyle(m.risk_key);
                              return (
                                <Card
                                  key={m.month}
                                  onClick={() => handleMonthChange(m.month)}
                                  sx={{
                                    p: { xs: 1.2, sm: 1.5 },
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid' : '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    position: 'relative',
                                    borderRadius: 3,
                                    transition: 'all 0.15s ease',
                                    '&:hover': { transform: 'translateY(-2px)' },
                                  }}
                                >
                                  {isOptimal && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -7,
                                        right: -7,
                                        fontSize: 16,
                                      }}
                                    >
                                      ⭐
                                    </Box>
                                  )}
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {m.month_short}
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 900, color: chipStyle.color, my: 0.3 }}
                                  >
                                    {m.effective_api}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={
                                      m.tier_label === 'TOTAL SUSPENSION'
                                        ? 'SUSPEND'
                                        : m.tier_label
                                    }
                                    sx={{
                                      ...chipStyle,
                                      height: 18,
                                      fontSize: '0.62rem',
                                    }}
                                  />
                                </Card>
                              );
                            })}
                          </Box>
                        </Card>

                        {/* Planning Recommendations */}
                        <Card sx={{ p: { xs: 2, sm: 3 } }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            {selectedYear} Recommendations
                          </Typography>
                          <Stack spacing={2}>
                            <Alert severity="success" sx={{ borderRadius: 2.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                SAFEST EVENT WINDOW
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {(plannerData.recommended_months || []).join(', ')} {selectedYear}
                              </Typography>
                            </Alert>
                            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                HIGH HAZE RISK (AVOID)
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {(plannerData.high_risk_months || []).join(' & ')} {selectedYear}
                              </Typography>
                            </Alert>
                            <Button
                              fullWidth
                              variant="contained"
                              endIcon={<ArrowForwardIcon />}
                              onClick={() => navigate('/checker')}
                              sx={{ height: 40 }}
                            >
                              Inspect {MONTH_NAMES[selectedMonth]} {selectedYear} in Checker
                            </Button>
                          </Stack>
                        </Card>
                      </Box>
                    )}

                    {/* Scheduled Events Table */}
                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="h6">
                          Scheduled Events ({scheduledEvents.length})
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => exportScheduledEventsToCsv(scheduledEvents)}
                        >
                          Export Schedule CSV
                        </Button>
                      </Stack>
                      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Event
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                School & District
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Date
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Predicted API
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                MOE Directive
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                              >
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {scheduledEvents.map((ev) => (
                              <TableRow key={ev.event_id} hover>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {ev.event_title}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="body2">{ev.school_name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {ev.district}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{ev.event_date}</TableCell>
                                <TableCell sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>
                                  {ev.predicted_api} API
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Chip
                                    size="small"
                                    label={ev.tier_label}
                                    sx={getTierChipStyle(ev.risk_key)}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    {ev.start_hour !== (ev.safest_hour || 7) && (
                                      <Tooltip title="Shift to cleanest morning hour">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleOptimizeEvent(ev, 'hour')}
                                        >
                                          <BoltIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteEvent(ev.event_id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                            {scheduledEvents.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                  No events scheduled yet.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Card>
                  </Stack>
                }
              />

              {/* =========================== ANALYTICS =========================== */}
              <Route
                path="/analytics"
                element={
                  <Stack spacing={2.5}>
                    <PageHeader
                      title="D3.js Environmental Analytics"
                      subtitle="Interactive visualizations across 26 monitoring stations and 4 corridors."
                      actions={
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '165px 155px' },
                            gap: 1.2,
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          <TextField
                            select
                            fullWidth
                            label="Corridor"
                            value={analyticsCorridor}
                            onChange={(e) => setAnalyticsCorridor(e.target.value)}
                          >
                            <MenuItem value="All Corridors">All Corridors</MenuItem>
                            {corridors.map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            fullWidth
                            label="Station"
                            value={analyticsDistrict}
                            onChange={(e) => setAnalyticsDistrict(e.target.value)}
                          >
                            {stations.map((st) => (
                              <MenuItem key={st.district} value={st.district}>
                                {st.district}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      }
                    />

                    <Card sx={{ p: { xs: 2, sm: 3 } }}>
                      <Tabs
                        value={analyticsTab}
                        onChange={(_, v) => setAnalyticsTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ mb: 3 }}
                      >
                        <Tab label="Multi-Day Brush-Zoom (D3.js)" />
                        <Tab label="12-Month & Correlation Heatmap (D3.js)" />
                        <Tab label="Gauge & SHAP Breakdown (D3.js)" />
                      </Tabs>

                      {analyticsTab === 0 && analyticsData && (
                        <DiurnalTrendD3
                          mode="multidayBrush"
                          multidaySeries={analyticsData.multiday_series || []}
                          thresholds={{ safe_max: 50, caution_max: 100, indoors_max: 200 }}
                        />
                      )}

                      {analyticsTab === 1 && analyticsData && (
                        <SeasonalHeatmapD3
                          seasonalCells={analyticsData.seasonal_heatmap || []}
                          correlationData={analyticsData.correlation_matrix}
                          onSelectStationMonth={(dist, mInt) => {
                            setSelectedDistrict(dist);
                            handleMonthChange(mInt);
                            navigate('/checker');
                          }}
                        />
                      )}

                      {analyticsTab === 2 && assessment && (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
                            gap: 3,
                          }}
                        >
                          <SafetyGaugeD3
                            predictedApi={assessment.prediction?.predicted_api}
                            peakWindowApi={assessment.prediction?.peak_window_api}
                            badgeColor={assessment.moe_safety?.badge_color}
                            thresholds={assessment.moe_safety?.thresholds}
                          />
                          <ShapAttributionD3
                            attributions={assessment.shap_attributions || []}
                          />
                        </Box>
                      )}
                    </Card>
                  </Stack>
                }
              />
            </Routes>
          </Box>
        </Container>

        {/* Dialog: Add Event */}
        <Dialog
          open={addEventDialogOpen}
          onClose={() => setAddEventDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Schedule School Event</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Event Title"
                fullWidth
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
              <TextField
                label="School Name"
                fullWidth
                value={customSchoolName}
                onChange={(e) => setCustomSchoolName(e.target.value)}
              />
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={eventDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <TextField
                label="Students (1–5000)"
                type="number"
                fullWidth
                value={newEventParticipants}
                onChange={(e) => setNewEventParticipants(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddEventDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateEvent}>
              Save Event
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: What-If Validation Tester */}
        <Dialog
          open={validationDialogOpen}
          onClose={() => setValidationDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>What-If Weather & Validation</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="API [0–1000]"
                type="number"
                fullWidth
                value={customApiInput}
                onChange={(e) => setCustomApiInput(e.target.value)}
              />
              <TextField
                label="Temp [15–45°C]"
                type="number"
                fullWidth
                value={customTempInput}
                onChange={(e) => setCustomTempInput(e.target.value)}
              />
              <TextField
                label="Humidity [10–100%]"
                type="number"
                fullWidth
                value={customHumInput}
                onChange={(e) => setCustomHumInput(e.target.value)}
              />
              <TextField
                label="Wind Speed [0–35 m/s]"
                type="number"
                fullWidth
                value={customWindInput}
                onChange={(e) => setCustomWindInput(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setValidationDialogOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => handleRunWhatIfTest(false)}>
              Run Test
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Box
          component="footer"
          sx={{
            py: 2.5,
            mt: 'auto',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="caption" color="text.secondary">
              SchoolAir • Malaysian School Air Quality & Event Decision Platform • COS30049 Group 7
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
