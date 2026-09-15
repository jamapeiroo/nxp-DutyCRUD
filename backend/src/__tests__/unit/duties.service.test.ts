import * as dutiesRepository from '../../duties/duties.repository';
import * as dutiesService from '../../duties/duties.service';
import { AppError } from '../../errors/app-error';

jest.mock('../../duties/duties.repository');

const repository = jest.mocked(dutiesRepository);
const duty = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Plan release' };

describe('duties service', () => {
  it('returns all duties', async () => {
    repository.findAll.mockResolvedValue([duty]);

    await expect(dutiesService.getAllDuties()).resolves.toEqual([duty]);
  });

  it('creates a duty', async () => {
    repository.create.mockResolvedValue(duty);

    await expect(dutiesService.createDuty('Plan release')).resolves.toEqual(duty);
    expect(repository.create).toHaveBeenCalledWith('Plan release');
  });

  it('updates a duty', async () => {
    repository.update.mockResolvedValue({ ...duty, name: 'New name' });

    await expect(dutiesService.updateDuty(duty.id, 'New name')).resolves.toEqual({ ...duty, name: 'New name' });
  });

  it('throws a 404 error when updating a duty that does not exist', async () => {
    repository.update.mockResolvedValue(null);

    await expect(dutiesService.updateDuty(duty.id, 'New name')).rejects.toEqual(new AppError(404, 'Duty not found'));
  });

  it('deletes a duty', async () => {
    repository.remove.mockResolvedValue(true);

    await expect(dutiesService.deleteDuty(duty.id)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(duty.id);
  });

  it('throws a 404 error when deleting a duty that does not exist', async () => {
    repository.remove.mockResolvedValue(false);

    await expect(dutiesService.deleteDuty(duty.id)).rejects.toEqual(new AppError(404, 'Duty not found'));
  });
});
