'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Toggle } from '@/components/ui';

interface TimeSlot {
  openTime: string;
  closeTime: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface StoreHoursSettings {
  timezone: string;
  schedule: DaySchedule[];
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
];

export default function StoreHoursPage() {
  const params = useParams();
  const t = useTranslations('settings.hours');
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<StoreHoursSettings>({
    timezone: 'America/New_York',
    schedule: DAYS.map((day) => ({
      day,
      isOpen: true,
      timeSlots: [{ openTime: '09:00', closeTime: '17:00' }],
    })),
  });

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/hours?restaurantId=${restaurantId}`);
      if (response.ok) {
        const settings = await response.json();
        if (settings.schedule && settings.schedule.length > 0) {
          setData({
            timezone: settings.timezone || 'America/New_York',
            schedule: settings.schedule,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          ...data,
        }),
      });

      if (response.ok) {
        alert('Store hours saved successfully!');
        await fetchSettings();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDay = (dayIndex: number, isOpen: boolean) => {
    const newSchedule = [...data.schedule];
    newSchedule[dayIndex].isOpen = isOpen;
    setData({ ...data, schedule: newSchedule });
  };

  const handleUpdateTimeSlot = (
    dayIndex: number,
    slotIndex: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    const newSchedule = [...data.schedule];
    newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setData({ ...data, schedule: newSchedule });
  };

  const handleAddTimeSlot = (dayIndex: number) => {
    const newSchedule = [...data.schedule];
    newSchedule[dayIndex].timeSlots.push({
      openTime: '09:00',
      closeTime: '17:00',
    });
    setData({ ...data, schedule: newSchedule });
  };

  const handleDeleteTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...data.schedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setData({ ...data, schedule: newSchedule });
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
      {/* Timezone */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-3">
          {t('timezone')}
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('selectTimezone')}
          </label>
          <select
            value={data.timezone}
            onChange={(e) => setData({ ...data, timezone: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 text-gray-900 focus:outline-none focus:border-brand-red"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Schedule */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-3">
          {t('schedule')}
        </h3>

        <div className="space-y-3">
          {data.schedule.map((daySchedule, dayIndex) => (
            <div
              key={daySchedule.day}
              className="bg-gray-50 border border-gray-200 rounded-sm p-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-900 font-light text-lg capitalize">
                  {t(daySchedule.day)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {daySchedule.isOpen ? t('open') : t('closed')}
                  </span>
                  <Toggle
                    checked={daySchedule.isOpen}
                    onChange={(checked) => handleToggleDay(dayIndex, checked)}
                  />
                </div>
              </div>

              {/* Time Slots */}
              {daySchedule.isOpen && (
                <div className="space-y-2">
                  {daySchedule.timeSlots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="flex items-center gap-3 bg-gray-50 p-3 rounded-sm"
                    >
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          {t('openTime')}
                        </label>
                        <input
                          type="time"
                          value={slot.openTime}
                          onChange={(e) =>
                            handleUpdateTimeSlot(
                              dayIndex,
                              slotIndex,
                              'openTime',
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-gray-900 focus:outline-none focus:border-brand-red"
                        />
                      </div>

                      <div className="text-gray-600 pt-5">-</div>

                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          {t('closeTime')}
                        </label>
                        <input
                          type="time"
                          value={slot.closeTime}
                          onChange={(e) =>
                            handleUpdateTimeSlot(
                              dayIndex,
                              slotIndex,
                              'closeTime',
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-gray-900 focus:outline-none focus:border-brand-red"
                        />
                      </div>

                      {daySchedule.timeSlots.length > 1 && (
                        <button
                          onClick={() => handleDeleteTimeSlot(dayIndex, slotIndex)}
                          className="text-red-600 hover:text-red-700 pt-5"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Time Slot Button */}
                  <button
                    onClick={() => handleAddTimeSlot(dayIndex)}
                    className="w-full text-sm text-brand-red hover:text-brand-red/90 py-2 border border-dashed border-gray-200 rounded-sm hover:border-brand-red/50 transition-colors"
                  >
                    + {t('addTimeSlot')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
