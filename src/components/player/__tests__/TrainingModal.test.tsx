import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import TrainingModal from '../TrainingModal';
import { usePlayerContext } from '../../../context/PlayerContext';
import type { TrainingSettings } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../context/PlayerContext', () => ({
  usePlayerContext: vi.fn(),
}));

const defaultTraining: TrainingSettings = {
  isActive: false,
  trackDurationLimit: 90,
  pauseDuration: 15,
  metronomeEnabled: false,
  metronomeVolume: 0.9,
};

const mockSetTraining = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (usePlayerContext as ReturnType<typeof vi.fn>).mockReturnValue({
    training: { ...defaultTraining },
    setTraining: mockSetTraining,
  });
});

describe('TrainingModal', () => {
  it('не рендерит ничего когда show = false', () => {
    const { container } = render(<TrainingModal show={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('рендерит UI когда show = true', () => {
    render(<TrainingModal show={true} onClose={vi.fn()} />);
    expect(screen.getByText('coach.title')).toBeTruthy();
    expect(screen.getByText('coach.subtitle')).toBeTruthy();
    expect(screen.getByText('coach.autopilot')).toBeTruthy();
    expect(screen.getByText('coach.close')).toBeTruthy();
  });

  it('вызывает onClose при клике на крестик', async () => {
    const onClose = vi.fn();
    render(<TrainingModal show={true} onClose={onClose} />);
    await act(async () => { fireEvent.click(screen.getByText('×')); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('вызывает onClose при клике на кнопку Close', async () => {
    const onClose = vi.fn();
    render(<TrainingModal show={true} onClose={onClose} />);
    await act(async () => { fireEvent.click(screen.getByText('coach.close')); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('включает тренировку при клике на toggle', async () => {
    render(<TrainingModal show={true} onClose={vi.fn()} />);
    const toggleBtn = screen.getByTestId('training-toggle');
    await act(async () => { fireEvent.click(toggleBtn); });
    expect(mockSetTraining).toHaveBeenCalledTimes(1);
    // Verify updater toggles isActive
    const updater = mockSetTraining.mock.calls[0][0];
    const result = updater({ ...defaultTraining, isActive: false });
    expect(result.isActive).toBe(true);
  });

  it('показывает слайдеры когда тренировка активна', () => {
    (usePlayerContext as ReturnType<typeof vi.fn>).mockReturnValue({
      training: { ...defaultTraining, isActive: true },
      setTraining: mockSetTraining,
    });
    render(<TrainingModal show={true} onClose={vi.fn()} />);
    expect(screen.getByText('coach.danceDuration')).toBeTruthy();
    expect(screen.getByText('coach.feedbackPause')).toBeTruthy();
    expect(screen.getByText('90s')).toBeTruthy();
    expect(screen.getByText('15s')).toBeTruthy();
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('не показывает слайдеры когда тренировка выключена', () => {
    render(<TrainingModal show={true} onClose={vi.fn()} />);
    expect(screen.queryByText('coach.danceDuration')).toBeNull();
    expect(screen.queryByText('coach.feedbackPause')).toBeNull();
  });

  it('изменяет trackDurationLimit через слайдер', async () => {
    const state = { training: { ...defaultTraining, isActive: true } };
    const setTraining = vi.fn((updater: any) => {
      if (typeof updater === 'function') {
        state.training = updater(state.training);
      } else {
        state.training = updater;
      }
    });
    (usePlayerContext as ReturnType<typeof vi.fn>).mockReturnValue({
      training: { ...defaultTraining, isActive: true },
      setTraining,
    });
    render(<TrainingModal show={true} onClose={vi.fn()} />);
    const sliders = screen.getAllByRole('slider');
    await act(async () => {
      fireEvent.change(sliders[0], { target: { value: '120' } });
    });
    expect(setTraining).toHaveBeenCalledOnce();
    expect(state.training.trackDurationLimit).toBe(120);
  });

  it('изменяет pauseDuration через слайдер', async () => {
    const state = { training: { ...defaultTraining, isActive: true } };
    const setTraining = vi.fn((updater: any) => {
      if (typeof updater === 'function') {
        state.training = updater(state.training);
      } else {
        state.training = updater;
      }
    });
    (usePlayerContext as ReturnType<typeof vi.fn>).mockReturnValue({
      training: { ...defaultTraining, isActive: true },
      setTraining,
    });
    render(<TrainingModal show={true} onClose={vi.fn()} />);
    const sliders = screen.getAllByRole('slider');
    await act(async () => {
      fireEvent.change(sliders[1], { target: { value: '30' } });
    });
    expect(setTraining).toHaveBeenCalledOnce();
    expect(state.training.pauseDuration).toBe(30);
  });
});
