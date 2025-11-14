import { BaseLayout, Header, Button, Footer } from './components';

export interface AccessRequestTemplateProps {
  restaurantName: string;
  userName: string;
  userEmail: string;
  requestedRole: string;
  message?: string;
  dashboardLink: string;
}

export function AccessRequestTemplate({
  restaurantName,
  userName,
  userEmail,
  requestedRole,
  message,
  dashboardLink,
}: AccessRequestTemplateProps): string {
  const header = Header({
    title: 'New Access Request',
    emoji: '👋',
  });

  const button = Button({
    url: dashboardLink,
    text: 'Review Request',
    color: '#282e59',
  });

  const footer = Footer();

  const content = `
    ${header}
    <div class="content">
      <h2>Someone wants to join ${restaurantName}</h2>
      <p>Hello!</p>
      <p>
        <strong>${userName}</strong> (${userEmail}) has requested to join your team at <strong>${restaurantName}</strong>.
      </p>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Requested Role:</strong></p>
        <p style="margin: 0; color: #282e59; font-size: 16px; font-weight: 600;">${requestedRole}</p>
        ${message ? `
          <p style="margin: 20px 0 10px 0; color: #666; font-size: 14px;"><strong>Message:</strong></p>
          <p style="margin: 0; color: #555; font-size: 15px; font-style: italic;">"${message}"</p>
        ` : ''}
      </div>

      <p>Click the button below to review and approve or reject this request:</p>
      ${button}

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        You can manage access requests from your restaurant settings page.
      </p>
    </div>
    ${footer}
  `;

  return BaseLayout({ content });
}
