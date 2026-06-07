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
    console.log('New member registration webhook payload:', payload)

    // Verify it is indeed an INSERT on the profiles table
    if (payload.type !== 'INSERT' || payload.table !== 'profiles') {
      return new Response(
        JSON.stringify({ success: true, message: 'Skipped: event is not a profile insert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const record = payload.record
    const { full_name, email, department, graduation_year, subgroups } = record

    // Initialize Supabase Client with service role key to bypass RLS and query admins
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch user_ids for all users who have the role 'admin'
    const { data: adminRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (roleError) {
      console.error('Error fetching admin roles:', roleError)
      throw new Error(`Failed to query admin roles: ${roleError.message}`)
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No user roles matching "admin" were found.')
      return new Response(
        JSON.stringify({ success: true, message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const adminUserIds = adminRoles.map((r) => r.user_id)

    // 2. Fetch emails of all admin profiles
    const { data: adminProfiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds)

    if (profileError) {
      console.error('Error fetching admin profiles:', profileError)
      throw new Error(`Failed to query admin profiles: ${profileError.message}`)
    }

    const adminEmails = adminProfiles
      ?.map((p) => p.email)
      .filter((email): email is string => typeof email === 'string' && email.trim().length > 0)

    if (!adminEmails || adminEmails.length === 0) {
      console.log('No admin email addresses found in profiles.')
      return new Response(
        JSON.stringify({ success: true, message: 'No admin emails to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Sending new member notification to admins: ${adminEmails.join(', ')}`)

    // 3. Send email via Resend if API key is configured
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

    const subject = `New Member Registration: ${full_name || 'Anonymous'}`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #8b0000; margin-bottom: 20px; border-bottom: 2px solid #8b0000; padding-bottom: 10px;">New Member Registration Pending Approval</h2>
        <p>Hello Admin,</p>
        <p>A new member has registered on the ECU Alumni Fellowship website and is currently pending review.</p>
        
        <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">Applicant Profile</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666; width: 130px;">Name:</td>
              <td style="padding: 6px 0; color: #111;">${full_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Email:</td>
              <td style="padding: 6px 0; color: #111;">${email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Department:</td>
              <td style="padding: 6px 0; color: #111;">${department || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Graduation Year:</td>
              <td style="padding: 6px 0; color: #111;">${graduation_year || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Subgroup(s):</td>
              <td style="padding: 6px 0; color: #111;">${subgroups || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <p>Please log in to the admin dashboard to review their details, verify their status, and approve or deny their registration request.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/admin" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review Application</a>
        </div>

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
        to: adminEmails,
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

    // 4. Send welcome confirmation email to the registering user
    if (email) {
      console.log(`Sending welcome confirmation email to user: ${email}`)
      const userSubject = `Your ECU Alumni Portal Account Registration 📥`
      const userHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
          <p>Dear ${full_name || 'Alumni Member'},</p>
          <p>Thank you for registering on the official ECU OAU Alumni Association Portal. We are thrilled to have you reconnect with the global family!</p>
          <p>To protect the integrity of our network and ensure our database remains a safe space exclusive to verified members of the Evangelical Christian Union alumni body, your account configuration has been placed in our verification queue.</p>
          
          <h3 style="color: #111; margin-top: 25px; margin-bottom: 10px; font-size: 16px;">What happens next?</h3>
          <p>The portal administrators are currently reviewing your registration framework. You will receive an automated confirmation email immediately your access profile is approved. This processing typically takes 3 to 4 working days.</p>
          <p>If any extra verification criteria are needed to clear your profile records, an executive team member will reach out directly to you via this email address.</p>
          
          <p style="margin-top: 30px;">In fellowship,</p>
          <p><strong>The Secretariat Team</strong><br>ECU OAU Alumni Association</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center; line-height: 1.4; font-weight: bold;">
            Building Legacy, Sustaining Fellowship.
          </p>
        </div>
      `

      try {
        const userResendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: userSubject,
            html: userHtml,
          })
        })

        if (!userResendResponse.ok) {
          const userResendError = await userResendResponse.text()
          console.error('Resend user email error:', userResendError)
        } else {
          const userResendData = await userResendResponse.json()
          console.log('Resend user email response:', userResendData)
        }
      } catch (err) {
        console.error('Failed to send user email:', err)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admins and user notified successfully via Resend.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const err = error as any;
    console.error('Notify admins system failure:', err.message || err)
    return new Response(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
