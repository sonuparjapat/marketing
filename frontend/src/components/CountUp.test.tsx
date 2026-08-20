import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountUp } from './CountUp';

// jsdom has no IntersectionObserver, so useInView never fires — these assertions cover the
// pre-animation render, which is exactly where the prefix/suffix parsing logic lives (parseValue
// splits "120+"/"₹4.2Cr"/"3.4x" into a numeric part that gets tweened and the surrounding
// characters that don't).
describe('CountUp', () => {
  it('renders a leading-prefix value ("+" before digits) as prefix + 0 + suffix', () => {
    render(<CountUp value="+120" />);
    expect(screen.getByText('+0')).toBeInTheDocument();
  });

  it('renders a trailing-suffix value ("%" after digits) as prefix + 0 + suffix', () => {
    render(<CountUp value="85%" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders a currency-and-unit value (₹4.2Cr) preserving both non-numeric parts', () => {
    render(<CountUp value="₹4.2Cr" />);
    expect(screen.getByText('₹0Cr')).toBeInTheDocument();
  });

  it('renders a value with no digits at all (an em dash) completely unchanged', () => {
    render(<CountUp value="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('applies the given className to the rendered span', () => {
    render(<CountUp value="10x" className="text-accent" />);
    expect(screen.getByText('0x')).toHaveClass('text-accent');
  });
});
