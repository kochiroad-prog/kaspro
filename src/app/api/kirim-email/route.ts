import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { toName, toEmail, fromName, fromEmail, subjek, pesan, attachment } = await req.json()

    if (!toEmail || !subjek) {
      return NextResponse.json({ ok: false, error: 'Email penerima dan subjek wajib diisi' }, { status: 400 })
    }

    // Konfigurasi SMTP dari environment variables
    // Tambahkan ke .env.local:
    //   SMTP_HOST=smtp.gmail.com
    //   SMTP_PORT=587
    //   SMTP_USER=email@gmail.com
    //   SMTP_PASS=app_password
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const attachments = attachment
      ? [{
          filename: attachment.filename,
          content: attachment.base64,
          encoding: 'base64' as const,
          contentType: attachment.mime,
        }]
      : []

    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: `"${toName}" <${toEmail}>`,
      replyTo: fromEmail,
      subject: subjek,
      text: pesan,
      html: `<p>${pesan.replace(/\n/g, '<br/>')}</p><br/><hr/><p style="color:#888;font-size:12px">Dikirim via Praecox</p>`,
      attachments,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[kirim-email]', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Gagal mengirim email. Periksa konfigurasi SMTP.' },
      { status: 500 }
    )
  }
}
