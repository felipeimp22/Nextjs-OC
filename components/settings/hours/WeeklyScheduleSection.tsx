'use client';

import { Toggle } from '@/components/ui';
import { Trash2 } from 'lucide-react';

interface TimeSlot {
  openTime: string;
  closeTime: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface WeeklyScheduleSectionProps {
  t: (key: string) => string;
  schedule: DaySchedule[];
  onToggleDay: (dayIndex: number) => void;
  onUpdateTimeSlot: (dayIndex: number, slotIndex: number, field: 'openTime' | 'closeTime', value: string) => void;
  onAddTimeSlot: (dayIndex: number) => void;
  onRemoveTimeSlot: (dayIndex: number, slotIndex: number) => void;
}

export default function WeeklyScheduleSection({
  t,
  schedule,
  onToggleDay,
  onUpdateTimeSlot,
  onAddTimeSlot,
  onRemoveTimeSlot,
}: WeeklyScheduleSectionProps) {
  const DAY_LABELS: Record<string, string> = {
    monday: t('monday'),
    tuesday: t('tuesday'),
    wednesday: t('wednesday'),
    thursday: t('thursday'),
    friday: t('friday'),
    saturday: t('saturday'),
    sunday: t('sunday'),
  };

  return (
    <section>
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        {t('weeklySchedule')}
      </h3>

      <div className="space-y-3">
        {schedule.map((daySchedule, dayIndex) => (
          <div
            key={daySchedule.day}
            className="bg-gray-50 border border-gray-200 rounded-md p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-900 font-medium">
                {DAY_LABELS[daySchedule.day] || daySchedule.day}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {daySchedule.isOpen ? t('open') : t('closed')}
                </span>
                <Toggle
                  id={`day-${dayIndex}`}
                  checked={daySchedule.isOpen}
                  onChange={() => onToggleDay(dayIndex)}
                  size="sm"
                />
              </div>
            </div>

            {daySchedule.isOpen && (
              <div className="space-y-2">
                {daySchedule.timeSlots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className="bg-white p-3 rounded-md border border-gray-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          {t('open')}
                        </label>
                        <input
                          type="time"
                          value={slot.openTime}
                          onChange={(e) =>
                            onUpdateTimeSlot(dayIndex, slotIndex, 'openTime', e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
                        />
                      </div>

                      <div className="hidden md:block text-gray-400 pt-5">-</div>

                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          {t('close')}
                        </label>
                        <input
                          type="time"
                          value={slot.closeTime}
                          onChange={(e) =>
                            onUpdateTimeSlot(dayIndex, slotIndex, 'closeTime', e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
                        />
                      </div>

                      {daySchedule.timeSlots.length > 1 && (
                        <button
                          onClick={() => onRemoveTimeSlot(dayIndex, slotIndex)}
                          className="text-red-600 hover:text-red-700 md:pt-5 self-end md:self-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => onAddTimeSlot(dayIndex)}
                  className="w-full text-sm text-brand-red hover:text-brand-red/80 font-medium py-2 border border-dashed border-gray-300 rounded-md hover:border-brand-red transition-colors"
                >
                  + {t('addTimeSlot')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
