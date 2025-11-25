import { BaseLayout, Header, Footer } from './components';

export interface OrderConfirmationRestaurantTemplateProps {
  orderNumber: string;
  restaurantName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    options?: Array<{ name: string; choice: string }>;
    specialInstructions?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee?: number;
  tip?: number;
  total: number;
  currencySymbol: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export function OrderConfirmationRestaurantTemplate({
  orderNumber,
  restaurantName,
  customerName,
  customerEmail,
  customerPhone,
  orderType,
  items,
  subtotal,
  tax,
  deliveryFee = 0,
  tip = 0,
  total,
  currencySymbol,
  paymentStatus,
  paymentMethod,
  deliveryAddress,
  specialInstructions,
}: OrderConfirmationRestaurantTemplateProps): string {
  const header = Header({
    title: 'New Order Received!',
    emoji: '🔔',
  });

  const footer = Footer();

  const orderTypeDisplay = orderType === 'pickup' ? 'Pickup' : orderType === 'delivery' ? 'Delivery' : 'Dine In';
  const paymentStatusDisplay = paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending';

  const itemsList = items.map(item => {
    const optionsText = item.options && item.options.length > 0
      ? `<br/><small style="color: #666;">Options: ${item.options.map(o => `${o.name}: ${o.choice}`).join(', ')}</small>`
      : '';
    const instructionsText = item.specialInstructions
      ? `<br/><small style="color: #f03e42;">Note: ${item.specialInstructions}</small>`
      : '';

    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">
          ${item.name} × ${item.quantity}
          ${optionsText}
          ${instructionsText}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top;">
          ${currencySymbol}${item.price.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const content = `
    ${header}
    <div class="content">
      <h2>New Order for ${restaurantName}</h2>
      <p style="font-size: 16px; color: #f03e42;"><strong>Action Required: Prepare this order</strong></p>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #282e59;">Order Information</h3>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> <span style="font-size: 18px; color: #f03e42;">${orderNumber}</span></p>
        <p style="margin: 5px 0;"><strong>Order Type:</strong> ${orderTypeDisplay}</p>
        <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${paymentStatusDisplay}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
      </div>

      <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #282e59;">Customer Information</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #282e59;">${customerEmail}</a></p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: #282e59;">${customerPhone}</a></p>
        ${deliveryAddress ? `<p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${deliveryAddress}</p>` : ''}
      </div>

      <h3 style="color: #282e59;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${itemsList}
        <tr>
          <td style="padding: 8px; padding-top: 15px;"><strong>Subtotal</strong></td>
          <td style="padding: 8px; padding-top: 15px; text-align: right;"><strong>${currencySymbol}${subtotal.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px;">Tax</td>
          <td style="padding: 8px; text-align: right;">${currencySymbol}${tax.toFixed(2)}</td>
        </tr>
        ${deliveryFee > 0 ? `
          <tr>
            <td style="padding: 8px;">Delivery Fee</td>
            <td style="padding: 8px; text-align: right;">${currencySymbol}${deliveryFee.toFixed(2)}</td>
          </tr>
        ` : ''}
        ${tip > 0 ? `
          <tr>
            <td style="padding: 8px;">Tip</td>
            <td style="padding: 8px; text-align: right;">${currencySymbol}${tip.toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr style="border-top: 2px solid #282e59;">
          <td style="padding: 8px; padding-top: 15px;"><strong style="font-size: 18px;">Total</strong></td>
          <td style="padding: 8px; padding-top: 15px; text-align: right;"><strong style="font-size: 18px; color: #f03e42;">${currencySymbol}${total.toFixed(2)}</strong></td>
        </tr>
      </table>

      ${specialInstructions ? `
        <div style="background-color: #fff9e6; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>⚠️ Special Instructions from Customer:</strong><br/>
            ${specialInstructions}
          </p>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding: 15px; background-color: #282e59; color: white; border-radius: 6px; text-align: center;">
        <p style="margin: 0; font-size: 16px;">
          <strong>Please prepare this order as soon as possible</strong>
        </p>
      </div>
    </div>
    ${footer}
  `;

  return BaseLayout({ content });
}
