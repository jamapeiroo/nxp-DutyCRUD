import { render, screen } from '@testing-library/react';
import { DutiesList } from '../../components/duties/DutiesList';

describe('DutiesList', () => {
  it('renders the duties', () => {
    const duties = [
      { id: '1', name: 'Plan release' },
      { id: '2', name: 'Review PRs' }
    ];
    render(<DutiesList duties={duties} loading={false} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText('Plan release')).toBeInTheDocument();
    expect(screen.getByText('Review PRs')).toBeInTheDocument();
  });

  it('shows a message when there are no duties', () => {
    render(<DutiesList duties={[]} loading={false} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText('No duties yet')).toBeInTheDocument();
  });

  it('shows a loading message', () => {
    render(<DutiesList duties={[]} loading={true} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText('Loading duties...')).toBeInTheDocument();
  });
});
