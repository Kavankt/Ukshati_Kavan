import { render } from '@testing-library/react';
import StarryBackground from '../StarryBackground';
import '@testing-library/jest-dom';

describe('StarryBackground Component', () => {
  beforeAll(() => {
    // Mock `HTMLCanvasElement.getContext` and include `ellipse`
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      ellipse: jest.fn(), // ✅ Mock ellipse to prevent the error
    }));
  });

  test('renders the canvas element', () => {
    const { container } = render(<StarryBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('canvas should have the correct class', () => {
    const { container } = render(<StarryBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('stars');
  });
});
