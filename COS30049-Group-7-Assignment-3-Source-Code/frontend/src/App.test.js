import { render, screen } from '@testing-library/react';
import { TextEncoder } from 'node:util';
import axios from 'axios';

jest.mock('axios');
jest.mock('d3', () => ({}));
// The in-memory router does not need React Router's browser-only entry point.
jest.mock('react-router-dom', () => jest.requireActual('react-router'));

global.TextEncoder ??= TextEncoder;
const { MemoryRouter } = require('react-router-dom');
const App = require('./App').default;

test('renders the SchoolAir home page with the monitoring station directory', async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith('/stations')) {
      return Promise.resolve({ data: { stations: [{ district: 'Petaling Jaya', state: 'Selangor' }] } });
    }
    if (url.endsWith('/events')) return Promise.resolve({ data: { events: [] } });
    return Promise.reject(new Error('No forecast fixture for the home page'));
  });

  render(<MemoryRouter><App /></MemoryRouter>);

  expect(screen.getByRole('heading', { name: 'Plan Safe Outdoor School Events' })).toBeInTheDocument();
  expect(await screen.findByText('Petaling Jaya (Selangor)')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Check Safety' })).toBeEnabled();
});
