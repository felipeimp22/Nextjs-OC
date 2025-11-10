export interface EmailValidationResult {
  valid: boolean;
  email: string;
  status: string;
  reason?: string;
  disposable?: boolean;
  free_email?: boolean;
  role?: boolean;
}

export interface PhoneValidationResult {
  valid: boolean;
  phone: string;
  country: string;
  carrier?: string;
  line_type?: string;
  status: string;
  reason?: string;
}

export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const apiUrl = process.env.CLEAROUT_URL;
  const apiToken = process.env.CLEAROUT_EMAIL_API_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error('Clearout email validation not configured');
  }

  try {
    const url = new URL(`${apiUrl}/v2/email_verify/instant`);
    url.searchParams.set('email', email);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer:${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Email validation failed');
    }

    const data = await response.json();

    return {
      valid: data.status === 'valid',
      email: data.email || email,
      status: data.status,
      reason: data.reason,
      disposable: data.disposable,
      free_email: data.free_email,
      role: data.role,
    };
  } catch (error: any) {
    throw new Error(`Email validation error: ${error.message}`);
  }
}

export async function validatePhone(phone: string, countryCode: string = 'US'): Promise<PhoneValidationResult> {
  const apiUrl = process.env.CLEAROUT_PHONE_URL;
  const apiToken = process.env.CLEAROUT_PHONE_API_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error('Clearout phone validation not configured');
  }

  try {
    const url = new URL(`${apiUrl}/v1/phonenumber/validate`);
    url.searchParams.set('phone', phone);
    url.searchParams.set('country_code', countryCode);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer:${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Phone validation failed');
    }

    const data = await response.json();

    return {
      valid: data.status === 'valid',
      phone: data.phone || phone,
      country: data.country || countryCode,
      carrier: data.carrier,
      line_type: data.line_type,
      status: data.status,
      reason: data.reason,
    };
  } catch (error: any) {
    throw new Error(`Phone validation error: ${error.message}`);
  }
}

export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneFormat(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(cleanPhone);
}
