'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { EmailFactory } from '@/lib/email';
import crypto from 'crypto';

export async function sendRestaurantInvitation(data: {
  restaurantId: string;
  email: string;
  role: 'staff' | 'manager' | 'kitchen';
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found', data: null };
    }

    const userAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: data.restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!userAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found', data: null };
    }

    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        restaurantId: data.restaurantId,
        invitedEmail: data.email,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return { success: false, error: 'Invitation already sent to this email', data: null };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.userInvitation.create({
      data: {
        restaurantId: data.restaurantId,
        invitedEmail: data.email,
        role: data.role,
        token,
        tokenExpiresAt,
        invitedBy: user.id,
      }
    });

    const emailProvider = await EmailFactory.getProvider();
    const inviteLink = `${process.env.AUTH_URL}/invitations/${token}`;

    await emailProvider.sendEmail({
      to: data.email,
      subject: `You're invited to join ${restaurant.name} on OrderChop`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #282e59; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #f03e42; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
            </div>
            <div class="content">
              <h2>Join ${restaurant.name} on OrderChop</h2>
              <p>Hello!</p>
              <p><strong>${restaurant.name}</strong> has invited you to join their team as a <strong>${data.role}</strong>.</p>
              <p>Click the button below to accept this invitation:</p>
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
              <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${inviteLink}</p>
            </div>
            <div class="footer">
              <p>OrderChop - Restaurant Management Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    revalidatePath(`/${data.restaurantId}/settings`);
    return { success: true, data: invitation, error: null };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return { success: false, error: 'Failed to send invitation', data: null };
  }
}

export async function getInvitationDetails(token: string) {
  try {
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: { restaurant: true }
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found', data: null };
    }

    if (new Date() > invitation.tokenExpiresAt) {
      return { success: false, error: 'Invitation has expired', data: null };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already processed', data: null };
    }

    return {
      success: true,
      data: {
        restaurantName: invitation.restaurant.name,
        role: invitation.role,
        invitedEmail: invitation.invitedEmail,
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting invitation details:', error);
    return { success: false, error: 'Failed to get invitation details', data: null };
  }
}

export async function acceptInvitation(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: { restaurant: true }
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found', data: null };
    }

    if (new Date() > invitation.tokenExpiresAt) {
      return { success: false, error: 'Invitation has expired', data: null };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already processed', data: null };
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          status: 'active'
        }
      });
    }

    const existing = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: invitation.restaurantId
        }
      }
    });

    if (existing) {
      return { success: false, error: 'You already have access to this restaurant', data: null };
    }

    await prisma.userRestaurant.create({
      data: {
        userId: user.id,
        restaurantId: invitation.restaurantId,
        role: invitation.role
      }
    });

    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' }
    });

    revalidatePath('/setup');
    return { success: true, data: invitation.restaurant, error: null };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: 'Failed to accept invitation', data: null };
  }
}

export async function getRestaurantInvitations(restaurantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found', data: null };
    }

    const userAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!userAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    const invitations = await prisma.userInvitation.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: invitations, error: null };
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return { success: false, error: 'Failed to fetch invitations', data: null };
  }
}

export async function cancelInvitation(invitationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found', data: null };
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found', data: null };
    }

    const userAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: invitation.restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!userAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    await prisma.userInvitation.update({
      where: { id: invitationId },
      data: { status: 'cancelled' }
    });

    revalidatePath(`/${invitation.restaurantId}/settings`);
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return { success: false, error: 'Failed to cancel invitation', data: null };
  }
}
