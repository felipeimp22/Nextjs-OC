'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { EmailFactory } from '@/lib/email';

export async function requestRestaurantAccess(data: {
  restaurantId: string;
  message?: string;
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

    const hasAccess = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: data.restaurantId
        }
      }
    });

    if (hasAccess) {
      return { success: false, error: 'You already have access to this restaurant', data: null };
    }

    const existing = await prisma.accessRequest.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: data.restaurantId
        }
      }
    });

    if (existing && existing.status === 'pending') {
      return { success: false, error: 'Request already pending', data: null };
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
      include: {
        users: {
          where: { role: { in: ['owner', 'manager'] } },
          include: { user: true }
        }
      }
    });

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found', data: null };
    }

    const request = await prisma.accessRequest.upsert({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: data.restaurantId
        }
      },
      create: {
        userId: user.id,
        restaurantId: data.restaurantId,
        message: data.message,
        status: 'pending'
      },
      update: {
        message: data.message,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null
      }
    });

    if (restaurant.users.length > 0) {
      const emailProvider = await EmailFactory.getProvider();

      for (const ur of restaurant.users) {
        await emailProvider.sendEmail({
          to: ur.user.email,
          subject: `New access request for ${restaurant.name}`,
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
                  <h1>🙋 New Access Request</h1>
                </div>
                <div class="content">
                  <h2>Access Request for ${restaurant.name}</h2>
                  <p><strong>${user.name}</strong> (${user.email}) has requested access to your restaurant.</p>
                  ${data.message ? `<p><strong>Message:</strong><br>${data.message}</p>` : ''}
                  <div style="text-align: center;">
                    <a href="${process.env.AUTH_URL}/${data.restaurantId}/settings/team" class="button">Review Request</a>
                  </div>
                </div>
                <div class="footer">
                  <p>OrderChop - Restaurant Management Platform</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }
    }

    revalidatePath('/setup');
    return { success: true, data: request, error: null };
  } catch (error) {
    console.error('Error creating access request:', error);
    return { success: false, error: 'Failed to create request', data: null };
  }
}

export async function getRestaurantAccessRequests(restaurantId: string) {
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

    const requests = await prisma.accessRequest.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: requests, error: null };
  } catch (error) {
    console.error('Error fetching access requests:', error);
    return { success: false, error: 'Failed to fetch requests', data: null };
  }
}

export async function approveAccessRequest(requestId: string) {
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

    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { user: true, restaurant: true }
    });

    if (!request) {
      return { success: false, error: 'Request not found', data: null };
    }

    const managerAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: request.restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!managerAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    await prisma.userRestaurant.create({
      data: {
        userId: request.userId,
        restaurantId: request.restaurantId,
        role: request.requestedRole
      }
    });

    await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedBy: user.id,
        reviewedAt: new Date()
      }
    });

    const emailProvider = await EmailFactory.getProvider();
    await emailProvider.sendEmail({
      to: request.user.email,
      subject: `Access approved for ${request.restaurant.name}`,
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
              <h1>✅ Access Approved</h1>
            </div>
            <div class="content">
              <h2>Welcome to ${request.restaurant.name}!</h2>
              <p>Your request to join <strong>${request.restaurant.name}</strong> has been approved.</p>
              <p>You can now access the restaurant dashboard with the role: <strong>${request.requestedRole}</strong></p>
              <div style="text-align: center;">
                <a href="${process.env.AUTH_URL}/${request.restaurantId}/dashboard" class="button">Go to Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>OrderChop - Restaurant Management Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    revalidatePath(`/${request.restaurantId}/settings`);
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error approving request:', error);
    return { success: false, error: 'Failed to approve request', data: null };
  }
}

export async function rejectAccessRequest(requestId: string) {
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

    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { restaurant: true }
    });

    if (!request) {
      return { success: false, error: 'Request not found', data: null };
    }

    const managerAccess = await prisma.userRestaurant.findFirst({
      where: {
        restaurantId: request.restaurantId,
        userId: user.id,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!managerAccess) {
      return { success: false, error: 'Access denied', data: null };
    }

    await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedBy: user.id,
        reviewedAt: new Date()
      }
    });

    revalidatePath(`/${request.restaurantId}/settings`);
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error rejecting request:', error);
    return { success: false, error: 'Failed to reject request', data: null };
  }
}
