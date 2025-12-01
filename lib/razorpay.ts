import Razorpay from 'razorpay';
import crypto from 'crypto';

const { RZRPAY_CLIENT_ID, RZRPAY_CLIENT_SECRET } = process.env;

if (!RZRPAY_CLIENT_ID || !RZRPAY_CLIENT_SECRET) {
  console.warn("Razorpay credentials missing!");
}

export const razorpay = new Razorpay({
  key_id: RZRPAY_CLIENT_ID || '',
  key_secret: RZRPAY_CLIENT_SECRET || '',
});

export async function createRazorpayOrder(amount: number, currency: string = 'INR', receipt: string) {
  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
    currency,
    receipt,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const body = orderId + '|' + paymentId;

  const expectedSignature = crypto
    .createHmac('sha256', RZRPAY_CLIENT_SECRET!)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
}
