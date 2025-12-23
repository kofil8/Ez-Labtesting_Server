import { NotificationType } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import logger from '../utils/logger';

interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

interface NotificationTemplateData {
  type: NotificationType;
  name: string;
  description: string;
  emailSubject: string;
  emailBody: string;
  pushTitle: string;
  pushBody: string;
  variables: TemplateVariable[];
}

const notificationTemplates: NotificationTemplateData[] = [
  {
    type: 'ORDER_CREATED',
    name: 'Order Created',
    description: 'Notification sent when a new order is created',
    emailSubject: 'Your Order #{orderId} Has Been Created',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Your order has been created successfully!</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Total Amount:</strong> {{amount}}</p>
        <p><strong>Status:</strong> Pending</p>
        <p>You will receive updates about your order status. Thank you for choosing Ez Lab Testing!</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Order Created',
    pushBody: 'Your order {{orderId}} has been created',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'amount', description: 'Total order amount', example: '1000 PKR' },
    ],
  },
  {
    type: 'ORDER_CONFIRMED',
    name: 'Order Confirmed',
    description: 'Notification sent when order is confirmed',
    emailSubject: 'Order #{orderId} Confirmed',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Great news! Your order has been confirmed.</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Tests:</strong> {{testCount}} tests included</p>
        <p><strong>Appointment Date:</strong> {{appointmentDate}}</p>
        <p>Please arrive 10 minutes before your scheduled time at the lab center.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Order Confirmed',
    pushBody: 'Order {{orderId}} confirmed for {{appointmentDate}}',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'testCount', description: 'Number of tests in order', example: '3' },
      { name: 'appointmentDate', description: 'Scheduled appointment date', example: '2025-12-20' },
    ],
  },
  {
    type: 'ORDER_CANCELLED',
    name: 'Order Cancelled',
    description: 'Notification sent when order is cancelled',
    emailSubject: 'Order #{orderId} Has Been Cancelled',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Your order has been cancelled.</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Reason:</strong> {{cancellationReason}}</p>
        <p>If you have any questions, please contact our support team.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Order Cancelled',
    pushBody: 'Order {{orderId}} has been cancelled',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      {
        name: 'cancellationReason',
        description: 'Reason for cancellation',
        example: 'Customer request',
      },
    ],
  },
  {
    type: 'ORDER_IN_PROGRESS',
    name: 'Order In Progress',
    description: 'Notification sent when order is being processed',
    emailSubject: 'Your Order #{orderId} is In Progress',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Your order is currently being processed at our lab.</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Status:</strong> In Progress</p>
        <p>We are running your tests and will have results ready soon.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Order In Progress',
    pushBody: 'Your tests for order {{orderId}} are being processed',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
    ],
  },
  {
    type: 'ORDER_COMPLETED',
    name: 'Order Completed',
    description: 'Notification sent when order is completed',
    emailSubject: 'Your Order #{orderId} is Complete',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Your order has been completed successfully!</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Completion Date:</strong> {{completionDate}}</p>
        <p>Your results are now ready for download.</p>
        <a href="{{resultLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Results</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Order Completed',
    pushBody: 'Order {{orderId}} completed - results ready',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'completionDate', description: 'Date of completion', example: '2025-12-22' },
      {
        name: 'resultLink',
        description: 'Link to view results',
        example: 'https://app.ezlabtesting.com/results/123',
      },
    ],
  },
  {
    type: 'RESULTS_READY',
    name: 'Results Ready',
    description: 'Notification sent when results are ready',
    emailSubject: 'Your Lab Results are Ready',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Your lab results are now available.</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Ready Since:</strong> {{readyDate}}</p>
        <p>View your detailed results in the app or download as PDF.</p>
        <a href="{{resultLink}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Results</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Results Ready',
    pushBody: 'Your lab results are ready to view',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'readyDate', description: 'Date results became available', example: '2025-12-22' },
      {
        name: 'resultLink',
        description: 'Link to view results',
        example: 'https://app.ezlabtesting.com/results/123',
      },
    ],
  },
  {
    type: 'RESULTS_ABNORMAL',
    name: 'Abnormal Results Alert',
    description: 'Notification sent when results show abnormal values',
    emailSubject: 'Important: Abnormal Values Detected in Your Results',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p><strong style="color: #dc3545;">Important Alert:</strong> Some of your test results show abnormal values.</p>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Abnormal Tests:</strong> {{abnormalTests}}</p>
        <p>We recommend consulting with a healthcare professional to discuss these results.</p>
        <a href="{{resultLink}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Results</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Abnormal Results',
    pushBody: 'Some test results show abnormal values - review recommended',
    variables: [
      { name: 'orderId', description: 'Unique order ID', example: 'ORD-12345' },
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      {
        name: 'abnormalTests',
        description: 'List of abnormal tests',
        example: 'Glucose, Cholesterol',
      },
      {
        name: 'resultLink',
        description: 'Link to view results',
        example: 'https://app.ezlabtesting.com/results/123',
      },
    ],
  },
  {
    type: 'APPOINTMENT_SCHEDULED',
    name: 'Appointment Scheduled',
    description: 'Notification sent when appointment is scheduled',
    emailSubject: 'Your Lab Appointment is Scheduled',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Your lab appointment has been scheduled successfully.</p>
        <p><strong>Date:</strong> {{appointmentDate}}</p>
        <p><strong>Time:</strong> {{appointmentTime}}</p>
        <p><strong>Lab Center:</strong> {{labCenterName}}</p>
        <p><strong>Location:</strong> {{labCenterAddress}}</p>
        <p>Please arrive 10 minutes early and bring a valid ID.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Appointment Scheduled',
    pushBody: 'Lab appointment on {{appointmentDate}} at {{appointmentTime}}',
    variables: [
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'appointmentDate', description: 'Scheduled date', example: '2025-12-25' },
      { name: 'appointmentTime', description: 'Scheduled time', example: '10:00 AM' },
      { name: 'labCenterName', description: 'Lab center name', example: 'Downtown Lab Center' },
      { name: 'labCenterAddress', description: 'Lab center address', example: '123 Main St, City' },
    ],
  },
  {
    type: 'APPOINTMENT_REMINDER',
    name: 'Appointment Reminder',
    description: 'Reminder notification before appointment',
    emailSubject: 'Reminder: Your Lab Appointment is Tomorrow',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>This is a reminder about your upcoming lab appointment.</p>
        <p><strong>Tomorrow at:</strong> {{appointmentTime}}</p>
        <p><strong>Lab Center:</strong> {{labCenterName}}</p>
        <p>Please prepare by:</p>
        <ul>
          <li>Bringing a valid ID</li>
          <li>Arriving 10 minutes early</li>
          <li>Following any pre-test instructions</li>
        </ul>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Appointment Reminder',
    pushBody: "Don't forget your appointment tomorrow at {{appointmentTime}}",
    variables: [
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'appointmentTime', description: 'Scheduled time', example: '10:00 AM' },
      { name: 'labCenterName', description: 'Lab center name', example: 'Downtown Lab Center' },
    ],
  },
  {
    type: 'NEW_DISCOUNT',
    name: 'New Discount Available',
    description: 'Notification for new discount offers',
    emailSubject: 'Exclusive Offer: {{discountPercentage}}% Off Lab Tests',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Exciting news! We have a special offer for you.</p>
        <p style="font-size: 24px; color: #28a745; font-weight: bold;">{{discountPercentage}}% OFF</p>
        <p><strong>Offer:</strong> {{discountName}}</p>
        <p><strong>Valid Until:</strong> {{expiryDate}}</p>
        <p>Use coupon code: <strong>{{couponCode}}</strong></p>
        <a href="{{offerLink}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Shop Now</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Special Offer: {{discountPercentage}}% Off',
    pushBody: 'Limited time: {{discountName}}',
    variables: [
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'discountPercentage', description: 'Discount percentage', example: '20' },
      { name: 'discountName', description: 'Name of discount offer', example: 'Winter Sale' },
      { name: 'expiryDate', description: 'Discount expiry date', example: '2025-12-31' },
      { name: 'couponCode', description: 'Coupon code', example: 'WINTER20' },
      {
        name: 'offerLink',
        description: 'Link to offer',
        example: 'https://app.ezlabtesting.com/offers/123',
      },
    ],
  },
  {
    type: 'DISCOUNT_EXPIRING',
    name: 'Discount Expiring Soon',
    description: 'Alert when discount is about to expire',
    emailSubject: 'Hurry: Your {{discountPercentage}}% Discount Expires Soon',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p>Don't miss out! Your special offer is expiring soon.</p>
        <p><strong>Discount:</strong> {{discountPercentage}}% OFF - {{discountName}}</p>
        <p><strong style="color: #dc3545;">Expires in:</strong> {{daysRemaining}} days</p>
        <p>Coupon Code: <strong>{{couponCode}}</strong></p>
        <a href="{{offerLink}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Claim Now</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Last Chance: {{discountPercentage}}% Off',
    pushBody: 'Discount expires in {{daysRemaining}} days',
    variables: [
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'discountPercentage', description: 'Discount percentage', example: '20' },
      { name: 'discountName', description: 'Name of discount offer', example: 'Winter Sale' },
      { name: 'daysRemaining', description: 'Days until expiry', example: '3' },
      { name: 'couponCode', description: 'Coupon code', example: 'WINTER20' },
      {
        name: 'offerLink',
        description: 'Link to offer',
        example: 'https://app.ezlabtesting.com/offers/123',
      },
    ],
  },
  {
    type: 'LAB_CENTER_UPDATED',
    name: 'Lab Center Updated',
    description: 'Notification when lab center information is updated',
    emailSubject: '{{labCenterName}} - Important Update',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p><strong>{{labCenterName}}</strong> has been updated.</p>
        <p><strong>Update:</strong> {{updateMessage}}</p>
        <p><strong>New Hours:</strong> {{newHours}}</p>
        <p>If you have an appointment, please verify the timing hasn't changed.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: '{{labCenterName}} Updated',
    pushBody: '{{updateMessage}}',
    variables: [
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'labCenterName', description: 'Lab center name', example: 'Downtown Lab Center' },
      { name: 'updateMessage', description: 'Update details', example: 'New equipment added' },
      { name: 'newHours', description: 'Updated operating hours', example: '8:00 AM - 8:00 PM' },
    ],
  },
  {
    type: 'LAB_CENTER_CLOSED',
    name: 'Lab Center Closed',
    description: 'Notification when lab center is closed',
    emailSubject: '{{labCenterName}} - Temporarily Closed',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Hi {{userName}},</h2>
        <p><strong style="color: #dc3545;">{{labCenterName}} is temporarily closed.</strong></p>
        <p><strong>Reason:</strong> {{closureReason}}</p>
        <p><strong>Expected to Reopen:</strong> {{reopeningDate}}</p>
        <p>If you have an appointment, please reschedule at another location.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: '{{labCenterName}} Closed',
    pushBody: 'Temporarily closed. Will reopen {{reopeningDate}}',
    variables: [
      { name: 'userName', description: 'Customer full name', example: 'John Doe' },
      { name: 'labCenterName', description: 'Lab center name', example: 'Downtown Lab Center' },
      { name: 'closureReason', description: 'Reason for closure', example: 'Maintenance' },
      { name: 'reopeningDate', description: 'Expected reopening date', example: '2025-12-25' },
    ],
  },
  {
    type: 'SYSTEM_ALERT',
    name: 'System Alert',
    description: 'Critical system alerts',
    emailSubject: 'System Alert - {{alertLevel}}',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #dc3545;">⚠️ System Alert</h2>
        <p><strong>Level:</strong> {{alertLevel}}</p>
        <p><strong>Message:</strong> {{alertMessage}}</p>
        <p><strong>Time:</strong> {{alertTime}}</p>
        <p>If this affects your services, our team is working to resolve it.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'System Alert',
    pushBody: '{{alertMessage}}',
    variables: [
      { name: 'alertLevel', description: 'Alert severity level', example: 'High' },
      { name: 'alertMessage', description: 'Alert message', example: 'Scheduled maintenance' },
      { name: 'alertTime', description: 'Time of alert', example: '2:00 PM' },
    ],
  },
  {
    type: 'ADMIN_ANNOUNCEMENT',
    name: 'Admin Announcement',
    description: 'Important announcements from admin',
    emailSubject: 'Announcement: {{announcementTitle}}',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>{{announcementTitle}}</h2>
        <p>{{announcementBody}}</p>
        <p><strong>From:</strong> Ez Lab Testing Admin</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: '{{announcementTitle}}',
    pushBody: '{{announcementPreview}}',
    variables: [
      {
        name: 'announcementTitle',
        description: 'Announcement title',
        example: 'New Lab Tests Available',
      },
      {
        name: 'announcementBody',
        description: 'Full announcement text',
        example: 'We are excited to announce...',
      },
      {
        name: 'announcementPreview',
        description: 'Short preview for notification',
        example: 'New tests added',
      },
    ],
  },
  {
    type: 'WELCOME',
    name: 'Welcome Message',
    description: 'Welcome notification for new users',
    emailSubject: 'Welcome to Ez Lab Testing, {{userName}}!',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Welcome to Ez Lab Testing, {{userName}}!</h2>
        <p>We're thrilled to have you on board.</p>
        <p>With Ez Lab Testing, you can:</p>
        <ul>
          <li>Book lab tests online</li>
          <li>Get appointments at your convenience</li>
          <li>View results digitally</li>
          <li>Track your health history</li>
        </ul>
        <p>Get started by exploring our available tests.</p>
        <a href="{{appLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Welcome to Ez Lab Testing',
    pushBody: 'Get started with online lab testing',
    variables: [
      { name: 'userName', description: 'User full name', example: 'John Doe' },
      {
        name: 'appLink',
        description: 'Link to app/website',
        example: 'https://app.ezlabtesting.com',
      },
    ],
  },
  {
    type: 'ACCOUNT_VERIFIED',
    name: 'Account Verified',
    description: 'Confirmation when account is verified',
    emailSubject: 'Your Account is Now Verified',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Account Verified!</h2>
        <p>Hi {{userName}},</p>
        <p>Your account has been successfully verified.</p>
        <p>You can now:</p>
        <ul>
          <li>Book lab tests</li>
          <li>Schedule appointments</li>
          <li>View test results</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <a href="{{appLink}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to App</a>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Account Verified',
    pushBody: 'Your account is ready to use',
    variables: [
      { name: 'userName', description: 'User full name', example: 'John Doe' },
      {
        name: 'appLink',
        description: 'Link to app/website',
        example: 'https://app.ezlabtesting.com',
      },
    ],
  },
  {
    type: 'PASSWORD_RESET',
    name: 'Password Reset',
    description: 'Password reset confirmation',
    emailSubject: 'Password Reset Request',
    emailBody: `<html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Hi {{userName}},</p>
        <p>We received a request to reset your password.</p>
        <p><strong>Reset Link Expires In:</strong> {{expiryTime}} minutes</p>
        <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
          <a href="{{resetLink}}" style="color: #007bff; text-decoration: none;">Reset Password</a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>`,
    pushTitle: 'Password Reset',
    pushBody: 'Click to reset your password',
    variables: [
      { name: 'userName', description: 'User full name', example: 'John Doe' },
      {
        name: 'resetLink',
        description: 'Password reset link',
        example: 'https://app.ezlabtesting.com/reset-password/token123',
      },
      { name: 'expiryTime', description: 'Link expiry time in minutes', example: '30' },
    ],
  },
];

/**
 * Seed notification templates into the database
 */
export const seedNotificationTemplates = async (): Promise<void> => {
  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const template of notificationTemplates) {
      const result = await prisma.notificationTemplate.upsert({
        where: { type: template.type },
        create: {
          type: template.type,
          name: template.name,
          description: template.description,
          emailSubject: template.emailSubject,
          emailBody: template.emailBody,
          pushTitle: template.pushTitle,
          pushBody: template.pushBody,
          variables: template.variables as any,
          isActive: true,
        },
        update: {
          name: template.name,
          description: template.description,
          emailSubject: template.emailSubject,
          emailBody: template.emailBody,
          pushTitle: template.pushTitle,
          pushBody: template.pushBody,
          variables: template.variables as any,
        },
      });

      if (result) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }

    logger.info(
      `✅ Notification templates seeded: ${createdCount} created, ${updatedCount} updated`,
    );
  } catch (error) {
    logger.error('❌ Error seeding notification templates:', error);
    throw error;
  }
};
