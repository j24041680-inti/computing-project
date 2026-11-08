import React from 'react';
import { Fade, Paper, Popper, Typography } from '@mui/material';

const READOUT_MODIFIERS = [
  { name: 'offset', options: { offset: [0, 8] } },
  { name: 'preventOverflow', options: { padding: 8 } },
];

export default function ChartPointReadout({ anchor, open = false, reducedMotion, children }) {
  if (!anchor) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchor}
      placement="top"
      modifiers={READOUT_MODIFIERS}
      transition
      aria-hidden="true"
      sx={{
        pointerEvents: 'none',
        zIndex: (theme) => theme.zIndex.tooltip,
        '&[data-popper-reference-hidden]': { visibility: 'hidden' },
      }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={reducedMotion ? 0 : 150}>
          <Paper elevation={4} sx={{
            maxWidth: 'min(320px, calc(100vw - 16px))', px: 1.25, py: 0.75,
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
          }}>
            <Typography variant="caption" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {children}
            </Typography>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
}
