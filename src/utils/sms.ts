import axios from 'axios';

// Kavenegar API Example
// You can get your API Key from Kavenegar.com panel
const KAVENEGAR_API_KEY = process.env.KAVENEGAR_API_KEY;

export async function sendSMSOTP(phone: string, code: string) {
  // If API key is not set, we simulate the SMS (useful for local development)
  if (!KAVENEGAR_API_KEY) {
    console.log(`[SMS SIMULATION] SMS to ${phone}: Your code is ${code}`);
    return true;
  }

  try {
    // In Iran, you must use "Lookup" or "Pattern" (پترن) endpoints for OTPs to bypass blacklists.
    // Replace "verify-template-name" with the template name you registered in your Kavenegar panel.
    const response = await axios.post(
      `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`,
      null,
      {
        params: {
          receptor: phone,
          token: code,
          template: "verify-template-name" // پترن ثبت شده در پنل کاوه نگار
        }
      }
    );
    
    console.log("SMS Provider Response:", response.data);
    return true;
  } catch (error: any) {
    console.error("SMS Provider Error:", error?.response?.data || error.message);
    // Depending on your logic, you might throw the error or return false
    return false;
  }
}
