<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Design Consultation Booking</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; margin: 0;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; border-collapse: collapse;">
        <!-- Header -->
        <tr>
            <td style="background-color: #6D28D9; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">VKS DESIGN STUDIO</h1>
                <p style="color: #ddd6fe; margin: 5px 0 0 0; font-size: 14px;">Coimbatore Experience Studio</p>
            </td>
        </tr>
        <!-- Body -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #1e293b; margin-top: 0; font-size: 18px; font-weight: bold;">New Design Consultation Request</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.5;">A client has requested a structural site measurement and design session from the website consultation form.</p>
                
                <table border="0" cellpadding="10" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: collapse; background-color: #f1f5f9; border-radius: 6px; overflow: hidden;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td width="35%" style="font-weight: bold; color: #334155; font-size: 14px;">Client Name:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->name }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Mobile Phone:</td>
                        <td style="color: #475569; font-size: 14px;"><a href="tel:{{ $consultation->mobile }}" style="color: #6D28D9; text-decoration: none;">{{ $consultation->mobile }}</a></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Email:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->email ?? 'N/A' }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">City Location:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->city }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Property Type:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->property_type }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Area Size (sq.ft):</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->area_sqft }} sq.ft</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Service Category:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->service_type }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Budget Range:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->budget }}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="font-weight: bold; color: #334155; font-size: 14px;">Preferred Date:</td>
                        <td style="color: #475569; font-size: 14px;">{{ $consultation->preferred_date ? date('d-M-Y', strtotime($consultation->preferred_date)) : 'N/A' }}</td>
                    </tr>
                    @if($consultation->message)
                    <tr>
                        <td style="font-weight: bold; color: #334155; font-size: 14px; vertical-align: top;">Message/Notes:</td>
                        <td style="color: #475569; font-size: 14px; line-height: 1.4;">{{ $consultation->message }}</td>
                    </tr>
                    @endif
                </table>
                
                <p style="margin-top: 30px; text-align: center;">
                    <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $consultation->mobile) }}" style="background-color: #25d366; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: bold; font-size: 14px; display: inline-block;">💬 Open Client WhatsApp Chat</a>
                </p>
            </td>
        </tr>
        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                This email was auto-generated by the VKS Design Website server.
            </td>
        </tr>
    </table>
</body>
</html>
