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

    // Fetch the pending donation to compare amounts
    const { data: donation, error: fetchError } = await supabaseClient
      .from('donations')
      .select('*')
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

    // Tolerance range check to avoid floating point issues (allows 50 kobo difference max)
    if (Math.abs(expectedAmountKobo - paidAmountKobo) > 50) { 
      throw new Error(`Amount mismatch. Expected: ${expectedAmountKobo} kobo, Paid: ${paidAmountKobo} kobo.`)
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
