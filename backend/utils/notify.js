import nodemailer from "nodemailer";
import twilio from "twilio";

// Configure Nodemailer transport for Brevo
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configure Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Log environment variables for debugging
console.log("USER EMAIL:", process.env.EMAIL_USER);
console.log("BREVO_SMTP_KEY:", process.env.EMAIL_PASS ? "Set" : "Not set");
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);
console.log(
  "TWILIO_AUTH_TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "Set" : "Not set"
);
console.log("TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER);

// Send notification email
const sendNotificationEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ServiceSoko" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(
      `ServiceSoko: Notification email sent to ${to}, Message ID: ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      `ServiceSoko: Failed to send notification email to ${to}:`,
      error.message,
      error.stack
    );
    return { success: false, error: error.message, stack: error.stack };
  }
};

// Send notification SMS
const sendNotificationSMS = async ({ to, body }) => {
  try {
    // Normalize phone number (add country code if missing, e.g., +254 for Kenya)
    let normalizedPhone = to.replace(/[\s\-\(\)]/g, "");
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+254" + normalizedPhone; // Adjust country code as needed
    }
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    });
    console.log(
      `ServiceSoko: Notification SMS sent to ${normalizedPhone}, SID: ${message.sid}`
    );
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(
      `ServiceSoko: Failed to send notification SMS to ${to}:`,
      error.message,
      error.stack
    );
    return { success: false, error: error.message, stack: error.stack };
  }
};

// Notify user after registration
export const notifyUserRegistration = async ({ userEmail, userName }) => {
  if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
    console.warn(
      `ServiceSoko: Skipping registration email notification: Invalid or missing email (${userEmail})`
    );
    return { success: false, error: "No user email provided" };
  }

  const subject = `Welcome to ServiceSoko!`;
  const html = `
    <h2>Welcome, ${userName}!</h2>
    <p>Thank you for joining ServiceSoko, your platform for connecting with top professionals.</p>
    <p>You can now browse services, book professionals, or set up your seller profile to offer your own services.</p>
    <p>Visit your ServiceSoko dashboard to get started!</p>
    <p>Best regards,<br>The ServiceSoko Team</p>
  `;

  return await sendNotificationEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const notifyUserRegistrationSMS = async ({ userPhone, userName }) => {
  if (
    !userPhone ||
    typeof userPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(userPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping registration SMS notification: Invalid or missing phone (${userPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Welcome to ServiceSoko, ${userName}! Thank you for joining. Browse services or set up your seller profile in your dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: userPhone,
    body,
  });
};

// Notify user after becoming a seller
export const notifySellerApproval = async ({ userEmail, userName }) => {
  if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
    console.warn(
      `ServiceSoko: Skipping seller approval email notification: Invalid or missing email (${userEmail})`
    );
    return { success: false, error: "No user email provided" };
  }

  const subject = `You're Now a ServiceSoko Seller!`;
  const html = `
    <h2>Congratulations, ${userName}!</h2>
    <p>Your seller profile on ServiceSoko has been successfully set up.</p>
    <p>You can now start offering your services to our community of buyers.</p>
    <p>Visit your ServiceSoko seller dashboard to manage your services and orders.</p>
    <p>Thank you for joining our team of professionals!</p>
    <p>Best regards,<br>The ServiceSoko Team</p>
  `;

  return await sendNotificationEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const notifySellerApprovalSMS = async ({ userPhone, userName }) => {
  if (
    !userPhone ||
    typeof userPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(userPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping seller approval SMS notification: Invalid or missing phone (${userPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Congrats, ${userName}! You're now a ServiceSoko seller. Start offering services in your dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: userPhone,
    body,
  });
};

// Notify user after adding a service
export const notifyServiceAdded = async ({
  userEmail,
  userName,
  serviceTitle,
  category,
}) => {
  if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
    console.warn(
      `ServiceSoko: Skipping service added email notification: Invalid or missing email (${userEmail})`
    );
    return { success: false, error: "No user email provided" };
  }

  const subject = `New Service Added: ${serviceTitle}`;
  const html = `
    <h2>New Service Added!</h2>
    <p>Dear ${userName},</p>
    <p>You have successfully added a new service: <strong>${serviceTitle}</strong> in the <strong>${category}</strong> category.</p>
    <p>Your service is now live and visible to buyers on ServiceSoko.</p>
    <p>Visit your ServiceSoko seller dashboard to manage your services and orders.</p>
    <p>Thank you for being part of ServiceSoko!</p>
  `;

  console.log(
    `ServiceSoko: Attempting service added email notification to ${userEmail}`
  );
  const result = await sendNotificationEmail({
    to: userEmail,
    subject,
    html,
  });
  console.log(`ServiceSoko: Service added email notification result:`, result);
  return result;
};

export const notifyServiceAddedSMS = async ({
  userPhone,
  userName,
  serviceTitle,
  category,
}) => {
  if (
    !userPhone ||
    typeof userPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(userPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping service added SMS notification: Invalid or missing phone (${userPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${userName}, your service "${serviceTitle}" in ${category} is now live on ServiceSoko! Manage it in your dashboard. - ServiceSoko Team`;

  console.log(
    `ServiceSoko: Attempting service added SMS notification to ${userPhone}`
  );
  const result = await sendNotificationSMS({
    to: userPhone,
    body,
  });
  console.log(`ServiceSoko: Service added SMS notification result:`, result);
  return result;
};

// Notify buyer and seller about order confirmation
export const notifyOrderConfirmation = async ({
  buyerEmail,
  buyerName,
  buyerPhone,
  sellerEmail,
  sellerName,
  sellerPhone,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  const results = {
    buyerEmail: { success: false, error: "No buyer email provided" },
    sellerEmail: { success: false, error: "No seller email provided" },
    buyerSMS: { success: false, error: "No buyer phone provided" },
    sellerSMS: { success: false, error: "No seller phone provided" },
  };

  // Buyer email notification
  if (
    buyerEmail &&
    typeof buyerEmail === "string" &&
    buyerEmail.includes("@")
  ) {
    const buyerSubject = `Order Confirmation - Order #${orderId.slice(0, 8)}`;
    const buyerHtml = `
      <h2>Order Confirmed!</h2>
      <p>Dear ${buyerName},</p>
      <p>Your order for <strong>${serviceTitle}</strong> has been successfully placed.</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Order ID: ${orderId.slice(0, 8)}</li>
        <li>Service: ${serviceTitle}</li>
        <li>Booking Date: ${new Date(bookingDate).toLocaleDateString()}</li>
      </ul>
      <p>You can track your order in your ServiceSoko dashboard or contact the seller for more details.</p>
      <p>Thank you for choosing ServiceSoko!</p>
    `;

    results.buyerEmail = await sendNotificationEmail({
      to: buyerEmail,
      subject: buyerSubject,
      html: buyerHtml,
    });
  } else {
    console.warn(
      `ServiceSoko: Skipping buyer email notification: Invalid or missing email (${buyerEmail})`
    );
  }

  // Seller email notification
  if (
    sellerEmail &&
    typeof sellerEmail === "string" &&
    sellerEmail.includes("@")
  ) {
    const sellerSubject = `New Order Received - Order #${orderId.slice(0, 8)}`;
    const sellerHtml = `
      <h2>New Order!</h2>
      <p>Dear ${sellerName},</p>
      <p>You have received a new order for <strong>${serviceTitle}</strong>.</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Order ID: ${orderId.slice(0, 8)}</li>
        <li>Service: ${serviceTitle}</li>
        <li>Buyer: ${buyerName}</li>
        <li>Booking Date: ${new Date(bookingDate).toLocaleDateString()}</li>
      </ul>
      <p>Please review the order in your ServiceSoko dashboard and take appropriate action.</p>
      <p>Thank you for being part of ServiceSoko!</p>
    `;

    results.sellerEmail = await sendNotificationEmail({
      to: sellerEmail,
      subject: sellerSubject,
      html: sellerHtml,
    });
  } else {
    console.warn(
      `ServiceSoko: Skipping seller email notification: Invalid or missing email (${sellerEmail})`
    );
  }

  return results;
};

// Notify buyer and seller about order confirmation via SMS
export const notifyOrderConfirmationSMS = async ({
  buyerPhone,
  buyerName,
  sellerPhone,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  const results = {
    buyer: { success: false, error: "No buyer phone provided" },
    seller: { success: false, error: "No seller phone provided" },
  };

  // Buyer SMS notification
  if (
    buyerPhone &&
    typeof buyerPhone === "string" &&
    /^\+?\d{10,15}$/.test(buyerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    const body = `Hi ${buyerName}, your order for ${serviceTitle} (Order #${orderId.slice(
      0,
      8
    )}) is confirmed for ${new Date(
      bookingDate
    ).toLocaleDateString()}. Track it in your ServiceSoko dashboard. - ServiceSoko Team`;

    results.buyer = await sendNotificationSMS({
      to: buyerPhone,
      body,
    });
  } else {
    console.warn(
      `ServiceSoko: Skipping buyer SMS notification: Invalid or missing phone (${buyerPhone})`
    );
  }

  // Seller SMS notification
  if (
    sellerPhone &&
    typeof sellerPhone === "string" &&
    /^\+?\d{10,15}$/.test(sellerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    const body = `Hi ${sellerName}, you have a new order for ${serviceTitle} (Order #${orderId.slice(
      0,
      8
    )}) from ${buyerName} for ${new Date(
      bookingDate
    ).toLocaleDateString()}. Review it in your ServiceSoko dashboard. - ServiceSoko Team`;

    results.seller = await sendNotificationSMS({
      to: sellerPhone,
      body,
    });
  } else {
    console.warn(
      `ServiceSoko: Skipping seller SMS notification: Invalid or missing phone (${sellerPhone})`
    );
  }

  return results;
};

// Notify buyer when seller accepts an order
export const notifyOrderAccepted = async ({
  buyerEmail,
  buyerName,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !buyerEmail ||
    typeof buyerEmail !== "string" ||
    !buyerEmail.includes("@")
  ) {
    console.warn(
      `ServiceSoko: Skipping accepted email notification: Invalid or missing buyer email (${buyerEmail})`
    );
    return { success: false, error: "No buyer email provided" };
  }

  const subject = `Order Accepted - Order #${orderId.slice(0, 8)}`;
  const html = `
    <h2>Order Accepted!</h2>
    <p>Dear ${buyerName},</p>
    <p>Great news! <strong>${sellerName}</strong> has accepted your order for <strong>${serviceTitle}</strong>.</p>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order ID: ${orderId.slice(0, 8)}</li>
      <li>Service: ${serviceTitle}</li>
      <li>Booking Date: ${new Date(bookingDate).toLocaleDateString()}</li>
    </ul>
    <p>You can track your order in your ServiceSoko dashboard or contact the seller for further details.</p>
    <p>Thank you for choosing ServiceSoko!</p>
  `;

  return await sendNotificationEmail({
    to: buyerEmail,
    subject,
    html,
  });
};

export const notifyOrderAcceptedSMS = async ({
  buyerPhone,
  buyerName,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !buyerPhone ||
    typeof buyerPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(buyerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping accepted SMS notification: Invalid or missing buyer phone (${buyerPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${buyerName}, great news! ${sellerName} has accepted your order for ${serviceTitle} (Order #${orderId.slice(
    0,
    8
  )}) for ${new Date(
    bookingDate
  ).toLocaleDateString()}. Track it in your ServiceSoko dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: buyerPhone,
    body,
  });
};

// Notify buyer when seller rejects an order
export const notifyOrderRejected = async ({
  buyerEmail,
  buyerName,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !buyerEmail ||
    typeof buyerEmail !== "string" ||
    !buyerEmail.includes("@")
  ) {
    console.warn(
      `ServiceSoko: Skipping rejected email notification: Invalid or missing buyer email (${buyerEmail})`
    );
    return { success: false, error: "No buyer email provided" };
  }

  const subject = `Order Rejected - Order #${orderId.slice(0, 8)}`;
  const html = `
    <h2>Order Rejected</h2>
    <p>Dear ${buyerName},</p>
    <p>We regret to inform you that <strong>${sellerName}</strong> has rejected your order for <strong>${serviceTitle}</strong>.</p>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order ID: ${orderId.slice(0, 8)}</li>
      <li>Service: ${serviceTitle}</li>
      <li>Booking Date: ${new Date(bookingDate).toLocaleDateString()}</li>
    </ul>
    <p>Please explore other professionals in your ServiceSoko dashboard or contact support for assistance.</p>
    <p>Thank you for choosing ServiceSoko!</p>
  `;

  return await sendNotificationEmail({
    to: buyerEmail,
    subject,
    html,
  });
};

export const notifyOrderRejectedSMS = async ({
  buyerPhone,
  buyerName,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !buyerPhone ||
    typeof buyerPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(buyerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping rejected SMS notification: Invalid or missing buyer phone (${buyerPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${buyerName}, sorry, ${sellerName} rejected your order for ${serviceTitle} (Order #${orderId.slice(
    0,
    8
  )}) for ${new Date(
    bookingDate
  ).toLocaleDateString()}. Explore other professionals in your ServiceSoko dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: buyerPhone,
    body,
  });
};

// Notify buyer when seller completes an order
export const notifyOrderCompleted = async ({
  buyerEmail,
  buyerName,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !buyerEmail ||
    typeof buyerEmail !== "string" ||
    !buyerEmail.includes("@")
  ) {
    console.warn(
      `ServiceSoko: Skipping completed email notification: Invalid or missing buyer email (${buyerEmail})`
    );
    return { success: false, error: "No buyer email provided" };
  }

  const subject = `Order Completed - Order #${orderId.slice(0, 8)}`;
  const html = `
    <h2>Order Completed!</h2>
    <p>Dear ${buyerName},</p>
    <p>We're pleased to inform you that <strong>${sellerName}</strong> has completed your order for <strong>${serviceTitle}</strong>.</p>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order ID: ${orderId.slice(0, 8)}</li>
      <li>Service: ${serviceTitle}</li>
      <li>Booking Date: ${new Date(bookingDate).toLocaleDateString()}</li>
    </ul>
    <p>Please review the service in your ServiceSoko dashboard and share your feedback.</p>
    <p>Thank you for choosing ServiceSoko!</p>
  `;

  return await sendNotificationEmail({
    to: buyerEmail,
    subject,
    html,
  });
};

export const notifyOrderCompletedSMS = async ({
  buyerPhone,
  buyerName,
  sellerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !buyerPhone ||
    typeof buyerPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(buyerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping completed SMS notification: Invalid or missing buyer phone (${buyerPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${buyerName}, ${sellerName} has completed your order for ${serviceTitle} (Order #${orderId.slice(
    0,
    8
  )}) for ${new Date(
    bookingDate
  ).toLocaleDateString()}. Review it in your ServiceSoko dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: buyerPhone,
    body,
  });
};

// Notify seller when buyer cancels an order
export const notifyOrderCancelled = async ({
  sellerEmail,
  sellerName,
  buyerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !sellerEmail ||
    typeof sellerEmail !== "string" ||
    !sellerEmail.includes("@")
  ) {
    console.warn(
      `ServiceSoko: Skipping cancelled email notification: Invalid or missing seller email (${sellerEmail})`
    );
    return { success: false, error: "No seller email provided" };
  }

  const subject = `Order Cancelled - Order #${orderId.slice(0, 8)}`;
  const html = `
    <h2>Order Cancelled</h2>
    <p>Dear ${sellerName},</p>
    <p>The order for <strong>${serviceTitle}</strong> by <strong>${buyerName}</strong> has been cancelled.</p>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order ID: ${orderId.slice(0, 8)}</li>
      <li>Service: ${serviceTitle}</li>
      <li>Booking Date: ${new Date(bookingDate).toLocaleDateString()}</li>
    </ul>
    <p>You can view your active orders in your ServiceSoko dashboard.</p>
    <p>Thank you for being part of ServiceSoko!</p>
  `;

  return await sendNotificationEmail({
    to: sellerEmail,
    subject,
    html,
  });
};

export const notifyOrderCancelledSMS = async ({
  sellerPhone,
  sellerName,
  buyerName,
  serviceTitle,
  orderId,
  bookingDate,
}) => {
  if (
    !sellerPhone ||
    typeof sellerPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(sellerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping cancelled SMS notification: Invalid or missing seller phone (${sellerPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${sellerName}, the order for ${serviceTitle} (Order #${orderId.slice(
    0,
    8
  )}) by ${buyerName} for ${new Date(
    bookingDate
  ).toLocaleDateString()} was cancelled. Check your ServiceSoko dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: sellerPhone,
    body,
  });
};

// Notify seller when a review is submitted
export const notifyReviewSubmitted = async ({
  sellerEmail,
  sellerName,
  buyerName,
  serviceTitle,
  rating,
  comment,
  reviewId,
}) => {
  if (
    !sellerEmail ||
    typeof sellerEmail !== "string" ||
    !sellerEmail.includes("@")
  ) {
    console.warn(
      `ServiceSoko: Skipping review email notification: Invalid or missing seller email (${sellerEmail})`
    );
    return { success: false, error: "No seller email provided" };
  }

  const subject = `New Review Received for ${serviceTitle}`;
  const html = `
    <h2>New Review!</h2>
    <p>Dear ${sellerName},</p>
    <p><strong>${buyerName}</strong> has submitted a review for your service <strong>${serviceTitle}</strong>.</p>
    <p><strong>Review Details:</strong></p>
    <ul>
      <li>Rating: ${rating}/5</li>
      <li>Comment: ${comment || "No comment provided"}</li>
      <li>Review ID: ${reviewId.slice(0, 8)}</li>
    </ul>
    <p>View the review in your ServiceSoko dashboard to respond or improve your services.</p>
    <p>Thank you for being part of ServiceSoko!</p>
  `;

  return await sendNotificationEmail({
    to: sellerEmail,
    subject,
    html,
  });
};

export const notifyReviewSubmittedSMS = async ({
  sellerPhone,
  sellerName,
  buyerName,
  serviceTitle,
  rating,
  comment,
  reviewId,
}) => {
  if (
    !sellerPhone ||
    typeof sellerPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(sellerPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping review SMS notification: Invalid or missing seller phone (${sellerPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${sellerName}, ${buyerName} reviewed your service ${serviceTitle} (Rating: ${rating}/5, Review ID: ${reviewId.slice(
    0,
    8
  )}). View it in your ServiceSoko dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: sellerPhone,
    body,
  });
};

// Notify user when a message is received
export const notifyMessageReceived = async ({
  receiverEmail,
  receiverName,
  senderName,
  messageContent,
  messageId,
}) => {
  if (
    !receiverEmail ||
    typeof receiverEmail !== "string" ||
    !receiverEmail.includes("@")
  ) {
    console.warn(
      `ServiceSoko: Skipping message email notification: Invalid or missing receiver email (${receiverEmail})`
    );
    return { success: false, error: "No receiver email provided" };
  }

  const subject = `New Message from ${senderName}`;
  const html = `
    <h2>New Message!</h2>
    <p>Dear ${receiverName},</p>
    <p>You have received a new message from <strong>${senderName}</strong>.</p>
    <p><strong>Message:</strong></p>
    <p>${messageContent}</p>
    <p>Reply to this message in your ServiceSoko dashboard.</p>
    <p>Thank you for using ServiceSoko!</p>
  `;

  return await sendNotificationEmail({
    to: receiverEmail,
    subject,
    html,
  });
};

export const notifyMessageReceivedSMS = async ({
  receiverPhone,
  receiverName,
  senderName,
  messageContent,
  messageId,
}) => {
  if (
    !receiverPhone ||
    typeof receiverPhone !== "string" ||
    !/^\+?\d{10,15}$/.test(receiverPhone.replace(/[\s\-\(\)]/g, ""))
  ) {
    console.warn(
      `ServiceSoko: Skipping message SMS notification: Invalid or missing receiver phone (${receiverPhone})`
    );
    return { success: false, error: "No valid phone number provided" };
  }

  const body = `Hi ${receiverName}, you have a new message from ${senderName}: "${messageContent.substring(
    0,
    50
  )}..." Reply in your ServiceSoko dashboard. - ServiceSoko Team`;

  return await sendNotificationSMS({
    to: receiverPhone,
    body,
  });
};
