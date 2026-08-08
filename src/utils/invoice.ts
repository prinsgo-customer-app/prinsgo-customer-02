import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export async function generateInvoicePDF(bodyHtml: string) {
  try {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            h1 { color: #f5b301; text-align: center; margin-bottom: 20px; }
            .card { border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fafafa; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; border-bottom: 1px dashed #ddd; padding-bottom: 8px;}
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; color: #000; text-align:right;}
          </style>
        </head>
        <body>
          <h1>PrinsGo Receipt</h1>
          ${bodyHtml}
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri);
  } catch (err) {
    console.log("PDF error:", err);
  }
}

function row(label: string, value: string, bold = false) {
  return `<div class="row" style="${bold ? 'font-weight:bold;' : ''}"><span>${label}</span><span>${value}</span></div>`;
}

export async function printRideInvoice(ride: any) {
  const html = `
    <div class="card">
      <h3 style="margin-top:0;">Ride Details</h3>
      ${row("Booking ID", ride._id?.slice(-6).toUpperCase() || "N/A")}
      ${row("Date", new Date(ride.createdAt).toLocaleString())}
      ${row("Status", ride.status)}
      ${row("Pickup", ride.pickupAddress)}
      ${row("Drop", ride.dropAddress)}
      ${row("Distance", ride.distanceKm ? ride.distanceKm.toFixed(2) + ' km' : 'N/A')}
      ${row("Duration", ride.durationMin ? ride.durationMin + ' min' : 'N/A')}
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Payment Summary</h3>
      ${row("Base Fare", "₹" + (ride.fare ? (ride.fare * 0.8).toFixed(2) : '0'))}
      ${row("Taxes", "₹" + (ride.fare ? (ride.fare * 0.2).toFixed(2) : '0'))}
      ${row("Total Paid", "₹" + (ride.fare || "0"), true)}
    </div>
  `;
  await generateInvoicePDF(html);
}

export async function printParcelInvoice(parcel: any) {
  const html = `
    <div class="card">
      <h3 style="margin-top:0;">Parcel Delivery Details</h3>
      ${row("Tracking ID", parcel._id?.slice(-6).toUpperCase() || "N/A")}
      ${row("Date", new Date(parcel.createdAt).toLocaleString())}
      ${row("Status", parcel.status)}
      ${row("Pickup", parcel.pickupAddress)}
      ${row("Drop", parcel.dropAddress)}
      ${row("Receiver Name", parcel.receiverName)}
      ${row("Receiver Phone", parcel.receiverPhone)}
      ${row("Category", parcel.category)}
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Payment Summary</h3>
      ${row("Delivery Charge", "₹" + (parcel.fare || "0"), true)}
    </div>
  `;
  await generateInvoicePDF(html);
}
