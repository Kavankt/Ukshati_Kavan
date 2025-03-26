import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from '../BackButton';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

test('renders BackButton and navigates on click', async () => {
  const push = jest.fn(); // Mock the push function
  useRouter.mockReturnValue({ push });

  render(<BackButton route="/home" label="Go Back" />);

  const button = screen.getByText(/Go Back/i);
  expect(button).toBeInTheDocument();

  await userEvent.click(button); // Ensure click is awaited

  expect(push).toHaveBeenCalledTimes(1); // Check if push was called
  expect(push).toHaveBeenCalledWith('/home'); // Check if correct route was used
});
