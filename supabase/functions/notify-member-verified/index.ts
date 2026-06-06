// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Member profile update webhook payload:', payload)

    // Verify it is indeed an UPDATE on the profiles table
    if (payload.type !== 'UPDATE' || payload.table !== 'profiles') {
      return new Response(
        JSON.stringify({ success: true, message: 'Skipped: event is not a profile update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { record, old_record } = payload

    if (!record || !old_record) {
      throw new Error('Missing record or old_record in payload')
    }

    // Verify the status has transitioned from unapproved (e.g. pending/suspended) to approved
    const isNowApproved = record.status === 'approved'
    const wasAlreadyApproved = old_record.status === 'approved'

    if (!isNowApproved || wasAlreadyApproved) {
      console.log(`Skipped: user status transitioned from ${old_record.status} to ${record.status}. Notification not required.`)
      return new Response(
        JSON.stringify({ success: true, message: 'Skipped: no transition to approved status.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { full_name, email } = record

    if (!email) {
      console.log('Skipped: User profile has no email address.')
      return new Response(
        JSON.stringify({ success: true, message: 'Skipped: no email on profile.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Sending verification confirmation email to ${full_name} (${email})...`)

    // Send email via Resend if API key is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not configured in Supabase. Skipping email.')
      return new Response(
        JSON.stringify({ success: true, message: 'Warning: RESEND_API_KEY is not set. Email skipped.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const appUrl = Deno.env.get('VITE_APP_URL') || 'https://ecu-alumni.org'

    const subject = `Your ECU Alumni Fellowship Account is Verified! 🎉`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #8b0000; margin-bottom: 20px; border-bottom: 2px solid #8b0000; padding-bottom: 10px;">Account Approved & Verified!</h2>
        <p>Dear ${full_name || 'Alumnus'},</p>
        <p>We are excited to inform you that your registration for the <strong>ECU Alumni Fellowship</strong> has been reviewed and successfully approved by our administration team!</p>
        
        <p>You now have full access to your personalized dashboard where you can:</p>
        <ul style="padding-left: 20px; color: #555;">
          <li style="margin-bottom: 8px;">View active alumni announcements and news.</li>
          <li style="margin-bottom: 8px;">Explore and register for upcoming alumni events.</li>
          <li style="margin-bottom: 8px;">Make donations and download official PDF receipts.</li>
          <li style="margin-bottom: 8px;">Participate in our alumni directory to connect with other members.</li>
        </ul>

        <p>Click the link below to sign in to your dashboard and get started:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/auth" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Log In to Dashboard</a>
        </div>

        <p>Thank you for connecting with us. We look forward to your active fellowship and collaboration!</p>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #888; text-align: center; line-height: 1.4;">
          This is an automated notification from the ECU Alumni Fellowship administration portal.
        </p>
      </div>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: subject,
        html: html,
      })
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text()
      console.error('Resend API error:', resendError)
      throw new Error(`Resend failed with status ${resendResponse.status}: ${resendError}`)
    }

    const resendData = await resendResponse.json()
    console.log('Resend email response:', resendData)

    return new Response(
      JSON.stringify({ success: true, message: 'User notified successfully via Resend.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const err = error as any;
    console.error('Notify user approved system failure:', err.message || err)
    return new Response(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
