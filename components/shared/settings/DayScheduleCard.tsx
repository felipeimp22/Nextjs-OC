'use client';

import { Toggle } from '@/components/ui';
import { Trash2 } from 'lucide-react';

interface TimeSlot {
  openTime: string;
  closeTime: string;
}

interface DayScheduleCardProps {
  dayLabel: string;
  dayIndex: number;
  isOpen: boolean;
  timeSlots: TimeSlot[];
  onToggleDay: (dayIndex: number) => void;
  onUpdateTimeSlot: (dayIndex: number, slotIndex: number, field: 'openTime' | 'closeTime', value: string) => void;
  onAddTimeSlot: (dayIndex: number) => void;
  onRemoveTimeSlot: (dayIndex: number, slotIndex: number) => void;
}

export default function DayScheduleCard({
  dayLabel,
  dayIndex,
  isOpen,
  timeSlots,
  onToggleDay,
  onUpdateTimeSlot,
  onAddTimeSlot,
  onRemoveTimeSlot,
}: DayScheduleCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-900 font-medium">{dayLabel}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <Toggle
            id={`day-${dayIndex}`}
            checked={isOpen}
            onChange={() => onToggleDay(dayIndex)}
            size="sm"
          />
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2">
          {timeSlots.map((slot, slotIndex) => (
            <div
              key={slotIndex}
              className="flex items-center gap-3 bg-white p-3 rounded-md border border-gray-300"
            >
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Open
                </label>
                <input
                  type="time"
                  value={slot.openTime}
                  onChange={(e) =>
                    onUpdateTimeSlot(dayIndex, slotIndex, 'openTime', e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              <div className="text-gray-400 pt-5">-</div>

              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Close
                </label>
                <input
                  type="time"
                  value={slot.closeTime}
                  onChange={(e) =>
                    onUpdateTimeSlot(dayIndex, slotIndex, 'closeTime', e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>

              {timeSlots.length > 1 && (
                <button
                  onClick={() => onRemoveTimeSlot(dayIndex, slotIndex)}
                  className="text-red-600 hover:text-red-700 pt-5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => onAddTimeSlot(dayIndex)}
            className="w-full text-sm text-brand-red hover:text-brand-red/80 font-medium py-2 border border-dashed border-gray-300 rounded-md hover:border-brand-red transition-colors"
          >
            + Add Time Slot
          </button>
        </div>
      )}
    </div>
  );
}
