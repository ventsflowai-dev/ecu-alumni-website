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
    const { reference, donation_id } = await req.json()

    if (!reference || !donation_id) {
      throw new Error('Missing reference or donation_id')
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured in Supabase.')
    }

    // Call Paystack verification API
    const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`
    const paystackResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text()
      console.error('Paystack API error:', errorText)
      throw new Error(`Failed to verify payment with Paystack API. Status: ${paystackResponse.status}`)
    }

    const paystackData = await paystackResponse.json()
    console.log('Paystack response data:', paystackData)

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return new Response(
        JSON.stringify({ success: false, error: paystackData.message || 'Transaction was not successful.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase Client with service role key to bypass RLS and update status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the pending donation to compare amounts (and join the campaign details for the email)
    const { data: donation, error: fetchError } = await supabaseClient
      .from('donations')
      .select('*, donation_campaigns(title)')
      .eq('id', donation_id)
      .single()

    if (fetchError || !donation) {
      console.error('Fetch donation error:', fetchError)
      throw new Error('Donation record not found in the database.')
    }

    if (donation.payment_status === 'successful') {
      return new Response(
        JSON.stringify({ success: true, message: 'Donation was already successfully processed.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Verify amount matches (Paystack amount is in kobo)
    const expectedAmountKobo = Math.round(Number(donation.amount) * 100)
    const paidAmountKobo = paystackData.data.amount

    // Ensure the paid amount is at least the expected amount (allowing for gateway fees added to the transaction)
    if (paidAmountKobo < expectedAmountKobo) { 
      throw new Error(`Amount mismatch. Expected at least: ${expectedAmountKobo} kobo, Paid: ${paidAmountKobo} kobo.`)
    }

    // Update donation status to successful and log reference
    const receiptNumber = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const { error: updateError } = await supabaseClient
      .from('donations')
      .update({
        payment_status: 'successful',
        payment_reference: reference,
        receipt_number: receiptNumber,
      })
      .eq('id', donation_id)

    if (updateError) {
      console.error('Update donation status error:', updateError)
      throw new Error('Failed to update donation status in database.')
    }

    // Increment amount_raised in the donation campaign
    if (donation.campaign_id) {
      const { data: campaign, error: campaignFetchError } = await supabaseClient
        .from('donation_campaigns')
        .select('amount_raised')
        .eq('id', donation.campaign_id)
        .single()

      if (!campaignFetchError && campaign) {
        const newRaisedAmount = Number(campaign.amount_raised) + Number(donation.amount)
        const { error: campaignUpdateError } = await supabaseClient
          .from('donation_campaigns')
          .update({ amount_raised: newRaisedAmount })
          .eq('id', donation.campaign_id)

        if (campaignUpdateError) {
          console.error('Failed to update campaign amount_raised:', campaignUpdateError)
        }
      }
    }

    // Send Confirmation Email via Resend if API key is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
        const appUrl = Deno.env.get('VITE_APP_URL') || 'https://ecu-alumni.org'
        const campaignTitle = donation.donation_campaigns?.title || 'General Donation'
        const subject = `Thank you for your donation to ${campaignTitle}`
        const formattedAmount = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: donation.currency || 'NGN',
          maximumFractionDigits: 0,
        }).format(donation.amount)

        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
            <h2 style="color: #8b0000; margin-bottom: 20px; border-bottom: 2px solid #8b0000; padding-bottom: 10px;">Thank You for Your Donation!</h2>
            <p>Dear ${donation.donor_name},</p>
            <p>We have successfully received your donation and want to express our deepest appreciation for your partnership in supporting our initiatives at ECU Alumni Fellowship.</p>
            
            <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">Donation Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #666;">Campaign:</td>
                  <td style="padding: 6px 0; text-align: right; color: #111;">${campaignTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #666;">Amount Paid:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #111;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #666;">Receipt Number:</td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #111;">${receiptNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #666;">Reference:</td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #111;">${reference}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #666;">Date:</td>
                  <td style="padding: 6px 0; text-align: right; color: #111;">${new Date(donation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
              </table>
            </div>

            <p>You can view your donation history and download full PDF receipts at any time by logging into your account or creating a new account using your email on our alumni dashboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/auth" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 11px; color: #888; text-align: center; line-height: 1.4;">
              This is an automated receipt for your donation. If you have any questions or did not authorize this payment, please contact our support team.
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
            to: [donation.donor_email],
            subject: subject,
            html: html,
          })
        })

        if (!resendResponse.ok) {
          const resendError = await resendResponse.text()
          console.error('Resend API error:', resendError)
        } else {
          console.log('Appreciation email sent successfully via Resend to:', donation.donor_email)
        }
      } catch (emailErr) {
        console.error('Failed to process and send Resend email:', emailErr)
      }
    } else {
      console.warn('RESEND_API_KEY is not configured in Supabase environment variables. Skipping email.')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Donation successfully verified and recorded.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const err = error as any;
    console.error('Payment verification system failure:', err.message || err)
    return new Response(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
