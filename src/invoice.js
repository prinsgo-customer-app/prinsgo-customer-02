import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const wrapHtml = (bodyHtml) => `
  <html>
    <body style="font-family: -apple-system, Helvetica, Arial; padding: 24px; color: #0A0F24;">
      <div style="text-align:center; margin-bottom: 24px;">
        <span style="font-size: 26px; font-weight: 800;">Prins<span style="color:#1877F2;">Go</span></span>
        <p style="color:#888; font-size: 13px; margin-top: 4px;">Ride • Parcel • Delivered</p>
      </div>
      ${bodyHtml}
      <p style="text-align:center; color:#aaa; font-size: 11px; margin-top: 32px;">
        This is a computer-generated invoice from PrinsGo.
      </p>
    </body>
  </html>
`;

const row = (label, value, bold) => `
  <tr>
    <td style="padding:6px 0; color:${bold ? '#0A0F24' : '#666'}; font-weight:${bold ? '700' : '400'};">${label}</td>
    <td style="padding:6px 0; text-align:right; color:${bold ? '#0A0F24' : '#333'}; font-weight:${bold ? '700' : '400'};">${value}</td>
  </tr>
`;

const shareFile = async (uri) => {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PrinsGo Invoice' });
  }
};

export const generateRideInvoice = async (ride) => {
  const fare = ride.fare || {};
  const html = wrapHtml(`
    <h3 style="border-bottom:1px solid #eee; padding-bottom:8px;">Ride Invoice</h3>
    <table width="100%">
      ${row('Booking ID', ride._id?.slice(-8)?.toUpperCase())}
      ${row('Date', new Date(ride.createdAt).toLocaleString())}
      ${row('Vehicle', ride.vehicleType)}
      ${row('Pickup', ride.pickup?.address)}
      ${row('Drop', ride.drop?.address)}
      ${row('Distance', `${ride.distanceKm || 0} km`)}
      ${row('Status', ride.status)}
      ${row('Payment Method', ride.paymentMethod)}
    </table>
    <h4 style="margin-top:20px; border-bottom:1px solid #eee; padding-bottom:8px;">Fare Breakdown</h4>
    <table width="100%">
      ${row('Base Fare', `₹${Math.round(fare.baseFare || 0)}`)}
      ${row('Distance Fare', `₹${Math.round(fare.distanceFare || 0)}`)}
      ${row('Time Fare', `₹${Math.round(fare.timeFare || 0)}`)}
      ${row('Platform Fee', `₹${Math.round(fare.platformFee || 0)}`)}
      ${row('Total Fare', `₹${Math.round(fare.totalFare || 0)}`, true)}
    </table>
  `);
  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri);
};

export const generateParcelInvoice = async (parcel) => {
  const charges = parcel.charges || {};
  const html = wrapHtml(`
    <h3 style="border-bottom:1px solid #eee; padding-bottom:8px;">Parcel Invoice</h3>
    <table width="100%">
      ${row('Booking ID', parcel._id?.slice(-8)?.toUpperCase())}
      ${row('Date', new Date(parcel.createdAt).toLocaleString())}
      ${row('Sender', parcel.pickup?.contactName)}
      ${row('Receiver', parcel.drop?.contactName)}
      ${row('Pickup', parcel.pickup?.address)}
      ${row('Drop', parcel.drop?.address)}
      ${row('Status', parcel.status)}
      ${row('Payment Method', parcel.paymentMethod)}
    </table>
    <h4 style="margin-top:20px; border-bottom:1px solid #eee; padding-bottom:8px;">Charge Breakdown</h4>
    <table width="100%">
      ${row('Base Charge', `₹${Math.round(charges.baseCharge || 0)}`)}
      ${row('Distance Charge', `₹${Math.round(charges.distanceCharge || 0)}`)}
      ${row('Total Charge', `₹${Math.round(charges.totalCharge || 0)}`, true)}
    </table>
  `);
  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri);
};
