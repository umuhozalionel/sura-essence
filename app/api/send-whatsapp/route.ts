import { type NextRequest, NextResponse } from "next/server"

// WhatsApp notification endpoint (stub for Twilio)
// To enable: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

export async function POST(request: NextRequest) {
  try {
    const { bookingId, phone } = await request.json()

    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM

    if (!accountSid || !authToken || !fromNumber) {
      // Twilio not configured - log and return success
      console.log(`[WhatsApp Stub] Would send confirmation to ${phone} for booking ${bookingId}`)
      return NextResponse.json({
        success: true,
        message: "WhatsApp notification skipped (Twilio not configured)",
        stub: true,
      })
    }

    // Twilio is configured - send real message
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const message = `🚗 *SURA Essence - Booking Confirmed*\n\nYour booking ID: ${bookingId}\n\nWe've received your request and will confirm driver details shortly.\n\nThank you for choosing SURA Essence!`

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${phone}`,
        Body: message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Twilio error:", error)
      return NextResponse.json({ success: false, error: "Failed to send WhatsApp message" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "WhatsApp notification sent" })
  } catch (error) {
    console.error("WhatsApp API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
