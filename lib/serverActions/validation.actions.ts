'use server';

import { validateEmail, validatePhone } from '@/lib/utils/validation';

export async function validateEmailAction(email: string) {
  try {
    const result = await validateEmail(email);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Email validation failed',
    };
  }
}

export async function validatePhoneAction(phone: string, countryCode: string = 'US') {
  try {
    const result = await validatePhone(phone, countryCode);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Phone validation failed',
    };
  }
}
