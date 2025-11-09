'use client';

import { useState, useEffect } from 'react';
import { Button, Select, useToast } from '@/components/ui';
import { WeeklyScheduleSection } from '@/components/settings/hours';
import { getStoreHours, updateStoreHours } from '@/lib/serverActions/settings.actions';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface TimeSlot {
  openTime: string;
  closeTime: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface StoreHoursSettingsProps {
  restaurantId: string;
}

export function StoreHoursSettings({ restaurantId }: StoreHoursSettingsProps) {
  const { showToast } = useToast();

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
      <div className="p-3 md:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 md:p-6 space-y-6 md:space-y-8">
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Timezone
        </h3>
        <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </section>

      <WeeklyScheduleSection
        schedule={schedule}
        onToggleDay={toggleDay}
        onUpdateTimeSlot={updateTimeSlot}
        onAddTimeSlot={addTimeSlot}
        onRemoveTimeSlot={removeTimeSlot}
      />

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6 md:px-8 w-full md:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
