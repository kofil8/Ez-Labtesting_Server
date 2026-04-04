import { emailTemplate } from '../emailtempForOTP';
import { resetPasswordEmailTemplate } from '../emailtempletForLInk';

describe('email templates', () => {
  const originalLogoUrl = process.env.OTP_IMAGE_URL;

  afterEach(() => {
    if (typeof originalLogoUrl === 'undefined') {
      delete process.env.OTP_IMAGE_URL;
      return;
    }

    process.env.OTP_IMAGE_URL = originalLogoUrl;
  });

  it('renders OTP template with code and security content', () => {
    delete process.env.OTP_IMAGE_URL;

    const html = emailTemplate('123456', 'Use this code to continue your sign in.');

    expect(html).toContain('123456');
    expect(html).toContain('Use this code to continue your sign in.');
    expect(html).toContain('Your Verification Code');
    expect(html).toContain('Security Notice');
    expect(html).toContain('>EZ</div>');
    expect(html).toContain('support@ezlabtesting.com');
  });

  it('renders logo image when OTP_IMAGE_URL is set', () => {
    process.env.OTP_IMAGE_URL = 'https://cdn.ezlabtesting.com/logo.png';

    const html = emailTemplate('654321', 'Verification message');

    expect(html).toContain('src="https://cdn.ezlabtesting.com/logo.png"');
    expect(html).toContain('Ez Lab Testing Logo');
  });

  it('renders reset password template with secure action link', () => {
    const resetLink = 'https://ezlabtesting.com/reset?token=abc123';

    const html = resetPasswordEmailTemplate(resetLink);

    expect(html).toContain('Reset Your Password');
    expect(html).toContain('Reset Password');
    expect(html).toContain(resetLink);
    expect(html).toContain('Password Support');
  });
});
