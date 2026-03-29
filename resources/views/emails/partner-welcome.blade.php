<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ $hotel->name }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .wrapper {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .header {
            background-color: #1a56db;
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .body {
            padding: 40px;
        }
        .body p {
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 16px;
        }
        .hotel-name {
            font-weight: 700;
            color: #1a56db;
        }
        .cta-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #1a56db;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 600;
        }
        .note {
            font-size: 13px;
            color: #666666;
            background-color: #f9fafb;
            border-left: 4px solid #1a56db;
            padding: 12px 16px;
            border-radius: 0 4px 4px 0;
            margin-top: 24px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #999999;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>Welcome to {{ $hotel->name }}</h1>
        </div>

        <div class="body">
            <p>Hi <strong>{{ $partner->name }}</strong>,</p>

            <p>
                Your partner account has been created for
                <span class="hotel-name">{{ $hotel->name }}</span>.
                You can now manage your hotel and rooms through the partner portal.
            </p>

            <p>
                To get started, you need to set your password. Click the button below
                to activate your account:
            </p>

            <div class="cta-wrapper">
                <a href="{{ route('password.reset', ['token' => $resetToken, 'email' => $partner->email]) }}"
                   class="cta-button">
                    Set Your Password
                </a>
            </div>

            <p>
                Once your password is set, you can log in and start managing
                <span class="hotel-name">{{ $hotel->name }}</span>.
            </p>

            <div class="note">
                This link will expire in 60 minutes. If you did not expect this email,
                no action is required.
            </div>
        </div>

        <div class="footer">
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p>{{ route('password.reset', ['token' => $resetToken, 'email' => $partner->email]) }}</p>
        </div>
    </div>
</body>
</html>
