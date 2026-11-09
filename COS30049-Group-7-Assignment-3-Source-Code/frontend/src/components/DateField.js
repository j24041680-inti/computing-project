import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { formatDate, parseDisplayDate } from '../utils/dateFormat';

// A text field guarantees DD/MM/YYYY even when the browser uses US date settings.
export default function DateField({ label, value, onChange, onValidityChange }) {
  const [draft, setDraft] = useState(() => value ? formatDate(value) : '');
  const [touched, setTouched] = useState(false);
  const picker = useRef(null);
  useEffect(() => {
    setDraft(value ? formatDate(value) : '');
    setTouched(false);
    onValidityChange?.(Boolean(value));
  }, [value, onValidityChange]);

  const update = (text) => {
    setDraft(text);
    const iso = parseDisplayDate(text);
    onValidityChange?.(Boolean(iso));
    if (iso) onChange(iso);
  };
  return <Box sx={{ position: 'relative', width: '100%' }}>
    <TextField fullWidth label={label} placeholder="DD/MM/YYYY" value={draft}
      error={touched && !parseDisplayDate(draft)}
      helperText={touched && !parseDisplayDate(draft) ? 'Enter a valid date as DD/MM/YYYY.' : undefined}
      onChange={(event) => update(event.target.value)} onBlur={() => setTouched(true)}
      slotProps={{ htmlInput: { maxLength: 10, inputMode: 'text' }, input: { endAdornment: <InputAdornment position="end">
        <IconButton size="small" aria-label={`Choose ${label.toLowerCase()}`} onClick={() => {
          if (picker.current?.showPicker) picker.current.showPicker();
          else picker.current?.click();
        }}><CalendarMonthIcon fontSize="small" /></IconButton>
      </InputAdornment> } }} />
    <input ref={picker} type="date" value={value || ''} tabIndex={-1} aria-hidden="true"
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', bottom: 0, right: 0 }}
      onChange={(event) => { if (event.target.value) update(formatDate(event.target.value)); }} />
  </Box>;
}
