import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateDutyForm } from '../../components/duties/CreateDutyForm';

function typeName(value: string) {
  fireEvent.change(screen.getByLabelText('Duty name'), { target: { value } });
}

function clickAdd() {
  fireEvent.click(screen.getByText('Add duty'));
}

describe('CreateDutyForm', () => {
  it('does not submit an empty name', () => {
    const onCreate = jest.fn();
    render(<CreateDutyForm onCreate={onCreate} />);

    clickAdd();

    expect(screen.getByText('Enter a duty name')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('does not submit a name with only spaces', () => {
    const onCreate = jest.fn();
    render(<CreateDutyForm onCreate={onCreate} />);

    typeName('    ');
    clickAdd();

    expect(screen.getByText('Enter a duty name')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('sends the trimmed name and clears the input', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    render(<CreateDutyForm onCreate={onCreate} />);

    typeName('  Write report  ');
    clickAdd();

    expect(onCreate).toHaveBeenCalledWith('Write report');
    await waitFor(() => expect(screen.getByLabelText('Duty name')).toHaveValue(''));
  });

  it('shows the API error when creating fails', async () => {
    const onCreate = jest.fn().mockRejectedValue(new Error('The API is unavailable'));
    render(<CreateDutyForm onCreate={onCreate} />);

    typeName('Write report');
    clickAdd();

    expect(await screen.findByText('The API is unavailable')).toBeInTheDocument();
  });

  it('only submits once while the request is in progress', () => {
    // a promise that never resolves, so the form stays "saving"
    const onCreate = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<CreateDutyForm onCreate={onCreate} />);

    typeName('Write report');
    const addButton = screen.getByText('Add duty');
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.submit(screen.getByLabelText('Duty name'));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveTextContent('Adding...');
  });
});
