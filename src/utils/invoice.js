import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const wrapHtml = (bodyHtml, colors) => `
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 30px;
          color: #0A0F24;
          background-color: #FFFFFF;
        }
        .header-container {
          border-bottom: 3px solid #FFC72C;
          padding-bottom: 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-text {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .accent-text {
          color: #FFC72C;
        }
        .meta-info {
          text-align: right;
          font-size: 12px;
          color: #64748B;
          line-height: 1.6;
        }
        .invoice-title {
          font-size: 20px;
          font-weight: 800;
          color: #0A0F24;
          margin-top: 0;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .table-details {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .table-details td {
          padding: 8px 0;
          font-size: 13px;
          color: #334155;
        }
        .table-details td.label {
          font-weight: 600;
          color: #0A0F24;
          width: 35%;
        }
        .table-details td.value {
          text-align: right;
        }
        .breakdown-header {
          font-size: 14px;
          font-weight: 800;
          color: #0A0F24;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 6px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .breakdown-table {
          width: 100%;
          border-collapse: collapse;
        }
        .breakdown-table th {
          text-align: left;
          padding: 8px 0;
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          border-bottom: 1px solid #E2E8F0;
        }
        .breakdown-table th.right, .breakdown-table td.right {
          text-align: right;
        }
        .breakdown-table td {
          padding: 10px 0;
          font-size: 13px;
          border-bottom: 1px dashed #E2E8F0;
          color: #334155;
        }
        .total-row td {
          border-bottom: none;
          font-size: 15px;
          font-weight: 800;
          color: #0A0F24;
          padding-top: 16px;
        }
        .total-amount-box {
          background-color: #0A0F24;
          color: #FFFFFF;
          padding: 12px;
          border-radius: 8px;
          text-align: right;
          font-size: 16px;
          font-weight: 800;
          margin-top: 20px;
        }
        .total-amount-box span {
          color: #FFC72C;
        }
        .footer-note {
          text-align: center;
          color: #94A3B8;
          font-size: 11px;
          margin-top: 40px;
          border-top: 1px solid #E2E8F0;
          padding-top: 16px;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div>
          <span class="logo-text">Prins<span class="accent-text">Go</span></span>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Ride &bull; Parcel &bull; Premium Delivery</p>
        </div>
        <div class="meta-info">
          <strong>PrinsGo Technologies Pvt. Ltd.</strong><br>
          support@prinsgo.com<br>
          www.prinsgo.com
        </div>
      </div>
      ${bodyHtml}
      <div class="footer-note">
        This is a computer-generated invoice from PrinsGo and does not require a physical signature.<br>
        Thank you for choosing PrinsGo for your premium transport and logistic needs!
      </div>
    </body>
  </html>
`;

const shareFile = async (uri) => {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PrinsGo Premium Invoice' });
  }
};

export const generateRideInvoice = async (ride) => {
  const fare = ride.fare || {};
  const invoiceNum = 'INV-' + ride._id?.slice(-6)?.toUpperCase();
  const dateFormatted = new Date(ride.createdAt).toLocaleString();

  const html = wrapHtml(`
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h3 class="invoice-title">Ride Invoice</h3>
        <table class="table-details">
          <tr>
            <td class="label">Invoice No:</td>
            <td class="value"><strong>${invoiceNum}</strong></td>
          </tr>
          <tr>
            <td class="label">Booking ID:</td>
            <td class="value">${ride._id}</td>
          </tr>
          <tr>
            <td class="label">Date & Time:</td>
            <td class="value">${dateFormatted}</td>
          </tr>
          <tr>
            <td class="label">Vehicle Type:</td>
            <td class="value">${ride.vehicleType?.toUpperCase()}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="breakdown-header">Trip Route Details</div>
    <table class="table-details" style="margin-bottom: 20px;">
      <tr>
        <td class="label">Pickup Address:</td>
        <td class="value">${ride.pickup?.address}</td>
      </tr>
      <tr>
        <td class="label">Dropoff Address:</td>
        <td class="value">${ride.drop?.address}</td>
      </tr>
      <tr>
        <td class="label">Trip Distance:</td>
        <td class="value">${ride.distanceKm || 0} km</td>
      </tr>
      <tr>
        <td class="label">Payment Mode:</td>
        <td class="value">${ride.paymentMethod || 'Wallet'}</td>
      </tr>
    </table>

    <div class="breakdown-header">Fare Breakdown</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Base Fare</td>
          <td class="right">&nbsp;&nbsp;₹${Math.round(fare.baseFare || 0)}</td>
        </tr>
        <tr>
          <td>Distance Fare</td>
          <td class="right">&nbsp;&nbsp;₹${Math.round(fare.distanceFare || 0)}</td>
        </tr>
        <tr>
          <td>Time/Duration Fare</td>
          <td class="right">&nbsp;&nbsp;₹${Math.round(fare.timeFare || 0)}</td>
        </tr>
        <tr>
          <td>Platform/Service Fee</td>
          <td class="right">&nbsp;&nbsp;₹${Math.round(fare.platformFee || 0)}</td>
        </tr>
        ${fare.discount > 0 ? `
        <tr>
          <td>Promo Coupon Discount</td>
          <td class="right" style="color: #16A34A;">-₹${Math.round(fare.discount)}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <div class="total-amount-box">
      GRAND TOTAL PAID: <span>₹${Math.round(fare.totalFare || 0)}</span>
    </div>
  `);

  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri);
};

export const generateParcelInvoice = async (parcel) => {
  const charges = parcel.charges || {};
  const invoiceNum = 'INV-' + parcel._id?.slice(-6)?.toUpperCase();
  const dateFormatted = new Date(parcel.createdAt).toLocaleString();

  const html = wrapHtml(`
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h3 class="invoice-title">Parcel Invoice</h3>
        <table class="table-details">
          <tr>
            <td class="label">Invoice No:</td>
            <td class="value"><strong>${invoiceNum}</strong></td>
          </tr>
          <tr>
            <td class="label">Booking ID:</td>
            <td class="value">${parcel._id}</td>
          </tr>
          <tr>
            <td class="label">Date & Time:</td>
            <td class="value">${dateFormatted}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="breakdown-header">Recipient & Delivery Route</div>
    <table class="table-details" style="margin-bottom: 20px;">
      <tr>
        <td class="label">Sender Name:</td>
        <td class="value">${parcel.pickup?.contactName || 'PrinsGo Customer'}</td>
      </tr>
      <tr>
        <td class="label">Recipient Name:</td>
        <td class="value">${parcel.drop?.contactName}</td>
      </tr>
      <tr>
        <td class="label">Pickup Address:</td>
        <td class="value">${parcel.pickup?.address}</td>
      </tr>
      <tr>
        <td class="label">Dropoff Address:</td>
        <td class="value">${parcel.drop?.address}</td>
      </tr>
      <tr>
        <td class="label">Payment Mode:</td>
        <td class="value">${parcel.paymentMethod || 'Wallet'}</td>
      </tr>
    </table>

    <div class="breakdown-header">Charge Breakdown</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Base Courier Charge</td>
          <td class="right">&nbsp;&nbsp;₹${Math.round(charges.baseCharge || 0)}</td>
        </tr>
        <tr>
          <td>Distance Transport Fee</td>
          <td class="right">&nbsp;&nbsp;₹${Math.round(charges.distanceCharge || 0)}</td>
        </tr>
        ${charges.discount > 0 ? `
        <tr>
          <td>Promo Coupon Discount</td>
          <td class="right" style="color: #16A34A;">-₹${Math.round(charges.discount)}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <div class="total-amount-box">
      GRAND TOTAL PAID: <span>₹${Math.round(charges.totalCharge || 0)}</span>
    </div>
  `);

  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri);
};
