import { BaseLayout, Header, Button, Footer } from './components';

export interface InvitationTemplateProps {
  restaurantName: string;
  role: string;
  inviteLink: string;
}

export function InvitationTemplate({
  restaurantName,
  role,
  inviteLink,
}: InvitationTemplateProps): string {
  const header = Header({
    title: "You're Invited!",
    emoji: '🎉',
  });

  const button = Button({
    url: inviteLink,
    text: 'Accept Invitation',
  });

  const footer = Footer();

  const content = `
    ${header}
    <div class="content">
      <h2>Join ${restaurantName} on OrderChop</h2>
      <p>Hello!</p>
      <p>
        <strong>${restaurantName}</strong> has invited you to join their team as a <strong>${role}</strong>.
      </p>
      <p>Click the button below to accept this invitation:</p>
      ${button}
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        ⏰ This invitation will expire in 7 days.
      </p>
      <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 6px; border-left: 4px solid #282e59;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Note:</strong> If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin: 10px 0 0 0; word-break: break-all;">
          <a href="${inviteLink}" style="color: #f03e42; font-size: 13px;">${inviteLink}</a>
        </p>
      </div>
    </div>
    ${footer}
  `;

  return BaseLayout({ content });
}
