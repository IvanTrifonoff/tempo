import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: 'tempo@trfnv.ru',
    pass: 'KkM8SRgfFrp68W4uavl2'
  }
});

export async function sendVerificationEmail(email, token) {
  const domain = 'https://tempotest.trfnv.ru'; 
  const link = `${domain}/verify?token=${token}`;
  
  console.log(`Attempting to send email to ${email} via ${transporter.options.host}...`);
  
  try {
    const info = await transporter.sendMail({
      from: '"Tempo Support" <tempo@trfnv.ru>',
      to: email,
      subject: 'Подтверждение регистрации в Tempo.TRFNV',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5; padding: 40px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 20px; border: 1px solid #333;">
            <h2 style="color: #eab308; text-align: center; margin-top: 0;">Tempo.TRFNV</h2>
            <p style="font-size: 16px; line-height: 1.5;">Здравствуйте!</p>
            <p style="font-size: 16px; line-height: 1.5; color: #ccc;">Для завершения регистрации аккаунта тренера, пожалуйста, подтвердите ваш email адрес.</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${link}" style="background-color: #eab308; color: #000000; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Подтвердить аккаунт</a>
            </div>
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">Если вы не регистрировались, просто проигнорируйте это письмо.</p>
          </div>
        </div>
      `
    });
    console.log(`Email sent successfully to ${email}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`ERROR sending email to ${email}:`, error.message);
    console.error("Full error stack:", error);
    return false;
  }
}
