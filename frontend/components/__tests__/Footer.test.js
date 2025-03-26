import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  test('renders social media links', () => {
    render(<Footer />);

    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
  });

  test('renders contact details', () => {
    render(<Footer />);

    expect(screen.getByText(/Contact: \+91 7259439998/i)).toBeInTheDocument();
    expect(screen.getByText(/Email: ukshati365@gmail.com/i)).toBeInTheDocument();
  });
});
