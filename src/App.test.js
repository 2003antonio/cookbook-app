import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app without crashing', () => {
  render(<App />);
  // Verify the bottom nav renders, which is always present
  expect(screen.getByText(/Home/i)).toBeInTheDocument();
});