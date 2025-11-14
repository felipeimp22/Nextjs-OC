import { BaseLayout, Header, Button, Footer } from './components';

export interface AccessApprovedTemplateProps {
  restaurantName: string;
  requestedRole: string;
  dashboardLink: string;
}

export function AccessApprovedTemplate({
  restaurantName,
  requestedRole,
  dashboardLink,
}: AccessApprovedTemplateProps): string {
  const header = Header({
    title: 'Access Approved',
    emoji: '✅',
  });

  const button = Button({
    url: dashboardLink,
    text: 'Go to Dashboard',
    color: '#282e59',
  });

  const footer = Footer();

  const content = `
    ${header}
    <div class="content">
      <h2>Welcome to ${restaurantName}!</h2>
      <p>Good news!</p>
      <p>
        Your request to join <strong>${restaurantName}</strong> has been approved.
      </p>
      <p>
        You can now access the restaurant dashboard with the role: <strong>${requestedRole}</strong>
      </p>
      ${button}
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        We're excited to have you on the team! 🎉
      </p>
    </div>
    ${footer}
  `;

  return BaseLayout({ content });
}
