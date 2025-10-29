# 📧 Email Verification - Quick Reference

## 🚀 How to Use

### For Development (Default)
No setup needed! Just:
1. Register a new account
2. Check your **terminal/console** for the verification link
3. Copy and paste the link into your browser
4. Email verified! You can now log in.

Example console output:
```
📧 Email Verification Link (Copy this link):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: user@example.com
Link: http://localhost:3000/verify-email/abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### For Production (Real Emails)
Add to `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Grocery Inventory
FRONTEND_URL=https://your-domain.com
```

## 🔑 Key Points

✅ **All new users must verify their email before logging in**
✅ Google OAuth users are automatically verified
✅ Verification links expire after 24 hours
✅ Users can request a new verification email if expired
✅ In development, links appear in the backend console

## 📍 Important URLs

- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login  
- **Verify Email**: http://localhost:3000/verify-email/:token

## 🎯 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register user, send verification email |
| GET | `/api/auth/verify-email/:token` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/login` | Login (requires verified email) |

## 🐛 Troubleshooting

### "Please verify your email before logging in"
→ Check your email inbox (or console in dev mode) for verification link

### "Invalid or expired verification link"
→ Link expired (24 hours). Request a new one on the verification error page

### "No verification email received" (Production)
→ Check spam folder
→ Verify EMAIL_* environment variables are set correctly
→ For Gmail, ensure you're using an App Password, not your regular password

### Verification link in development?
→ Look at your backend terminal/console where you ran `npm run dev`
→ Copy the full URL and paste it into your browser

## ⚡ Quick Test

```bash
# 1. Start the application
npm run dev

# 2. Register at http://localhost:3000/register
# 3. Check the terminal for verification link
# 4. Copy and paste link into browser
# 5. Login at http://localhost:3000/login
```

## 💡 Tips

- **Development**: Verification links in console make testing easy
- **Email not configured?** That's okay! System works without it in dev mode
- **Google Login**: Skips email verification entirely (already verified by Google)
- **Expired link?** Just request a new one - no problem!

## 📞 Support

If you encounter issues:
1. Check backend console for verification links (dev mode)
2. Verify environment variables (production)
3. Check `EMAIL_VERIFICATION_GUIDE.md` for detailed setup
4. Review `EMAIL_VERIFICATION_IMPLEMENTATION.md` for technical details
