import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DutyItem } from '../../components/duties/DutyItem';

const duty = { id: '1', name: 'Old name' };

describe('DutyItem', () => {
  describe('editing', () => {
    it('calls onUpdate with the new trimmed name', async () => {
      const onUpdate = jest.fn().mockResolvedValue(undefined);
      render(<DutyItem duty={duty} onUpdate={onUpdate} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByLabelText('Edit Old name'));
      fireEvent.change(screen.getByLabelText('New duty name'), { target: { value: ' New name ' } });
      fireEvent.click(screen.getByText('Save'));

      expect(onUpdate).toHaveBeenCalledWith('1', 'New name');
      // leaves edit mode once the update has finished
      await waitFor(() => expect(screen.queryByLabelText('New duty name')).not.toBeInTheDocument());
    });

    it('does not save an empty name', () => {
      const onUpdate = jest.fn();
      render(<DutyItem duty={duty} onUpdate={onUpdate} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByLabelText('Edit Old name'));
      fireEvent.change(screen.getByLabelText('New duty name'), { target: { value: '   ' } });
      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText('Enter a duty name')).toBeInTheDocument();
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('shows the API error when saving fails', async () => {
      const onUpdate = jest.fn().mockRejectedValue(new Error('Duty not found'));
      render(<DutyItem duty={duty} onUpdate={onUpdate} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByLabelText('Edit Old name'));
      fireEvent.click(screen.getByText('Save'));

      expect(await screen.findByText('Duty not found')).toBeInTheDocument();
    });

    it('goes back to the name when cancelling', () => {
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByLabelText('Edit Old name'));
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.getByText('Old name')).toBeInTheDocument();
      expect(screen.queryByLabelText('New duty name')).not.toBeInTheDocument();
    });
  });

  describe('deleting', () => {
    it('asks for confirmation before deleting', () => {
      const onDelete = jest.fn();
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));

      const dialog = screen.getByRole('alertdialog', { name: 'Delete duty?' });
      expect(within(dialog).getByText('"Old name" will be deleted permanently.')).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls onDelete when the user confirms', () => {
      // a promise that never resolves, so the dialog stays in "Deleting..."
      const onDelete = jest.fn().mockReturnValue(new Promise(() => {}));
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));
      fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Delete'));

      expect(onDelete).toHaveBeenCalledWith('1');
      expect(within(screen.getByRole('alertdialog')).getByText('Deleting...')).toBeDisabled();
    });

    it('does not delete when the user cancels', () => {
      const onDelete = jest.fn();
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));
      fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Cancel'));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('closes the dialog and shows the API error when deleting fails', async () => {
      const onDelete = jest.fn().mockRejectedValue(new Error('Duty not found'));
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));
      fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Delete'));

      expect(await screen.findByText('Duty not found')).toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
