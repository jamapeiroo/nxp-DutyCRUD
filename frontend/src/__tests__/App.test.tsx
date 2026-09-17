import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../App';
import { createDuty, deleteDuty, getDuties, updateDuty } from '../services/duty.service';

jest.mock('../services/duty.service');

describe('App', () => {
  it('shows the error without the empty message when the duties cannot be loaded', async () => {
    jest.mocked(getDuties).mockRejectedValue(new Error('Could not connect to the server'));

    render(<App />);

    expect(await screen.findByText('Could not connect to the server')).toBeInTheDocument();
    expect(screen.queryByText('No duties yet')).not.toBeInTheDocument();
  });

  it('loads the duties again when clicking "Try again"', async () => {
    jest
      .mocked(getDuties)
      .mockRejectedValueOnce(new Error('Could not connect to the server'))
      .mockResolvedValueOnce([{ id: '1', name: 'Plan release' }]);

    render(<App />);
    fireEvent.click(await screen.findByText('Try again'));

    expect(await screen.findByText('Plan release')).toBeInTheDocument();
    expect(screen.queryByText('Could not connect to the server')).not.toBeInTheDocument();
    expect(getDuties).toHaveBeenCalledTimes(2);
  });

  it('adds a new duty to the list', async () => {
    jest.mocked(getDuties).mockResolvedValue([]);
    jest.mocked(createDuty).mockResolvedValue({ id: '1', name: 'Write report' });

    render(<App />);
    await screen.findByText('No duties yet');

    fireEvent.change(screen.getByLabelText('Duty name'), { target: { value: 'Write report' } });
    fireEvent.click(screen.getByText('Add duty'));

    expect(await screen.findByText('Write report')).toBeInTheDocument();
  });

  it('shows the edited name without reloading the page', async () => {
    jest.mocked(getDuties).mockResolvedValue([{ id: '1', name: 'Old name' }]);
    jest.mocked(updateDuty).mockResolvedValue({ id: '1', name: 'New name' });

    render(<App />);

    fireEvent.click(await screen.findByLabelText('Edit Old name'));
    fireEvent.change(screen.getByLabelText('New duty name'), { target: { value: 'New name' } });
    fireEvent.click(screen.getByText('Save'));

    expect(await screen.findByText('New name')).toBeInTheDocument();
    expect(screen.queryByText('Old name')).not.toBeInTheDocument();
    expect(getDuties).toHaveBeenCalledTimes(1);
  });

  it('removes a deleted duty from the list after confirming', async () => {
    jest.mocked(getDuties).mockResolvedValue([{ id: '1', name: 'Old duty' }]);
    jest.mocked(deleteDuty).mockResolvedValue(undefined);

    render(<App />);

    fireEvent.click(await screen.findByLabelText('Delete Old duty'));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Delete'));

    await waitFor(() => expect(screen.queryByText('Old duty')).not.toBeInTheDocument());
    expect(screen.getByText('No duties yet')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
