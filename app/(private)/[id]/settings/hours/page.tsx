'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Input, useToast, Toggle } from '@/components/ui';
import { getStoreHours, updateStoreHours } from '@/lib/serverActions/settings.actions';
import { Trash2 } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

interface TimeSlot {
  openTime: string;
  closeTime: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

export default function StoreHoursPage() {
  const params = useParams();
  const { showToast } = useToast();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState('America/New_York');
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day,
      isOpen: true,
      timeSlots: [{ openTime: '09:00', closeTime: '17:00' }],
    }))
  );

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const result = await getStoreHours(restaurantId);
      
      if (result.success && result.data) {
        if (result.data.timezone) setTimezone(result.data.timezone);
        if (result.data.schedule) setSchedule(result.data.schedule);
      }
    } catch (error) {
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateStoreHours(restaurantId, {
        timezone,
        schedule,
      });

      if (!result.success) {
        showToast('error', result.error || 'Failed to save settings');
        return;
      }

      showToast('success', 'Settings saved successfully!');
      await fetchSettings();
    } catch (error) {
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => 
      prev.map((day, i) => 
        i === dayIndex ? { ...day, isOpen: !day.isOpen } : day
      )
    );
  };

  const updateTimeSlot = (
    dayIndex: number,
    slotIndex: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setSchedule(prev => 
      prev.map((day, i) => 
        i === dayIndex
          ? {
              ...day,
              timeSlots: day.timeSlots.map((slot, j) =>
                j === slotIndex ? { ...slot, [field]: value } : slot
              ),
            }
          : day
      )
    );
  };

  const addTimeSlot = (dayIndex: number) => {
    setSchedule(prev => 
      prev.map((day, i) => 
        i === dayIndex
          ? {
              ...day,
              timeSlots: [...day.timeSlots, { openTime: '09:00', closeTime: '17:00' }],
            }
          : day
      )
    );
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule(prev => 
      prev.map((day, i) => 
        i === dayIndex
          ? {
              ...day,
              timeSlots: day.timeSlots.filter((_, j) => j !== slotIndex),
            }
          : day
      )
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Timezone
        </h3>
        <div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Weekly Schedule
        </h3>

        <div className="space-y-3">
          {schedule.map((daySchedule, dayIndex) => (
            <div
              key={daySchedule.day}
              className="bg-gray-50 border border-gray-200 rounded-md p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-900 font-medium">
                  {DAY_LABELS[daySchedule.day as keyof typeof DAY_LABELS]}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {daySchedule.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <Toggle
                    id={`day-${dayIndex}`}
                    checked={daySchedule.isOpen}
                    onChange={() => toggleDay(dayIndex)}
                    size="sm"
                  />
                </div>
              </div>

              {daySchedule.isOpen && (
                <div className="space-y-2">
                  {daySchedule.timeSlots.map((slot, slotIndex) => (
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
                            updateTimeSlot(dayIndex, slotIndex, 'openTime', e.target.value)
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
                            updateTimeSlot(dayIndex, slotIndex, 'closeTime', e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red"
                        />
                      </div>

                      {daySchedule.timeSlots.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                          className="text-red-600 hover:text-red-700 pt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addTimeSlot(dayIndex)}
                    className="w-full text-sm text-brand-red hover:text-brand-red/80 font-medium py-2 border border-dashed border-gray-300 rounded-md hover:border-brand-red transition-colors"
                  >
                    + Add Time Slot
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
