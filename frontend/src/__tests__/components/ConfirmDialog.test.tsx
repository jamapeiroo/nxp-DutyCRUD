import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

function renderDialog(busy = false) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  render(
    <ConfirmDialog
      title="Delete duty?"
      message="This cannot be undone."
      confirmLabel="Delete"
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('shows the title and message and focuses Cancel', () => {
    renderDialog();

    expect(screen.getByRole('alertdialog', { name: 'Delete duty?' })).toHaveAccessibleDescription('This cannot be undone.');
    expect(screen.getByText('Cancel')).toHaveFocus();
  });

  it('calls onConfirm and onCancel from the buttons', () => {
    const { onConfirm, onCancel } = renderDialog();

    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes with the Escape key and when clicking the background', () => {
    const { onCancel } = renderDialog();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(document.querySelector('.dialog-backdrop')!);

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('cannot be closed or confirmed while the action is running', () => {
    const { onConfirm, onCancel } = renderDialog(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(document.querySelector('.dialog-backdrop')!);
    fireEvent.click(screen.getByText('Delete'));

    expect(screen.getByText('Delete')).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
