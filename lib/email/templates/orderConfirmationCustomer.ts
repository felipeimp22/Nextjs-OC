import { BaseLayout, Header, Footer } from './components';

export interface OrderConfirmationCustomerTemplateProps {
  customerName: string;
  orderNumber: string;
  restaurantName: string;
  restaurantPhone: string;
  orderType: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee?: number;
  tip?: number;
  total: number;
  currencySymbol: string;
  estimatedTime?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export function OrderConfirmationCustomerTemplate({
  customerName,
  orderNumber,
  restaurantName,
  restaurantPhone,
  orderType,
  items,
  subtotal,
  tax,
  deliveryFee = 0,
  tip = 0,
  total,
  currencySymbol,
  estimatedTime,
  deliveryAddress,
  specialInstructions,
}: OrderConfirmationCustomerTemplateProps): string {
  const header = Header({
    title: 'Order Confirmed!',
    emoji: '✅',
  });

  const footer = Footer();

  const orderTypeDisplay = orderType === 'pickup' ? 'Pickup' : orderType === 'delivery' ? 'Delivery' : 'Dine In';

  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">
        ${item.name} × ${item.quantity}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: right;">
        ${currencySymbol}${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const content = `
    ${header}
    <div class="content">
      <h2>Thank you for your order, ${customerName}!</h2>
      <p>Your order has been confirmed and is being prepared.</p>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #282e59;">Order Details</h3>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Restaurant:</strong> ${restaurantName}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${restaurantPhone}</p>
        <p style="margin: 5px 0;"><strong>Order Type:</strong> ${orderTypeDisplay}</p>
        ${estimatedTime ? `<p style="margin: 5px 0;"><strong>Estimated ${orderType === 'delivery' ? 'Delivery' : 'Pickup'} Time:</strong> ${estimatedTime}</p>` : ''}
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
            <strong>Special Instructions:</strong><br/>
            ${specialInstructions}
          </p>
        </div>
      ` : ''}

      <p style="margin-top: 30px;">
        If you have any questions about your order, please contact <strong>${restaurantName}</strong> at <a href="tel:${restaurantPhone}" style="color: #f03e42;">${restaurantPhone}</a>.
      </p>
    </div>
    ${footer}
  `;

  return BaseLayout({ content });
}
