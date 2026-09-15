import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    it('calls onDelete when the user confirms', () => {
      // window.confirm opens a browser dialog, in tests we decide the answer
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const onDelete = jest.fn().mockResolvedValue(undefined);
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));

      expect(window.confirm).toHaveBeenCalledWith('Delete "Old name"?');
      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('does not delete when the user cancels', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const onDelete = jest.fn();
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('shows the API error when deleting fails', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const onDelete = jest.fn().mockRejectedValue(new Error('Duty not found'));
      render(<DutyItem duty={duty} onUpdate={jest.fn()} onDelete={onDelete} />);

      fireEvent.click(screen.getByLabelText('Delete Old name'));

      expect(await screen.findByText('Duty not found')).toBeInTheDocument();
    });
  });
});
