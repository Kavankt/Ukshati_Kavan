import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScrollToTopButton from '../scrollup';

describe('ScrollToTopButton Component', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  test('does not show the button initially', () => {
    render(<ScrollToTopButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows button when scrolling down', async () => {
    render(<ScrollToTopButton />);

    // Use act() to handle state updates
    await act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('clicking the button scrolls to top', async () => {
    render(<ScrollToTopButton />);

    // Scroll down first
    await act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event('scroll'));
    });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Click button
    await act(() => userEvent.click(button));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
