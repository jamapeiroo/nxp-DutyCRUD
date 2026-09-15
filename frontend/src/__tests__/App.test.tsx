import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { createDuty, deleteDuty, getDuties, updateDuty } from '../services/duty.service';

jest.mock('../services/duty.service');

describe('App', () => {
  it('shows an error when the duties cannot be loaded', async () => {
    jest.mocked(getDuties).mockRejectedValue(new Error('Could not connect to the server'));

    render(<App />);

    expect(await screen.findByText('Could not connect to the server')).toBeInTheDocument();
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

  it('removes a deleted duty from the list', async () => {
    jest.mocked(getDuties).mockResolvedValue([{ id: '1', name: 'Old duty' }]);
    jest.mocked(deleteDuty).mockResolvedValue(undefined);
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    fireEvent.click(await screen.findByLabelText('Delete Old duty'));

    await waitFor(() => expect(screen.queryByText('Old duty')).not.toBeInTheDocument());
    expect(screen.getByText('No duties yet')).toBeInTheDocument();
  });
});
