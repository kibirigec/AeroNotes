require('dotenv').config({ path: '.env.local' });

async function setupMessageTemplate() {
    const fetch = (await import('node-fetch')).default;

    const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
    const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;
    const INFOBIP_2FA_APPLICATION_ID = process.env.INFOBIP_2FA_APPLICATION_ID;
    const INFOBIP_SENDER_ID = process.env.INFOBIP_SENDER_ID || "ServiceSMS"; // Default if not set in .env

    if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL || !INFOBIP_2FA_APPLICATION_ID) {
        console.error('Error: INFOBIP_API_KEY, INFOBIP_BASE_URL, or INFOBIP_2FA_APPLICATION_ID not found in environment variables.');
        console.error('Please ensure they are correctly set in your .env.local file.');
        process.exit(1);
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `App ${INFOBIP_API_KEY}`);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");

    const raw = JSON.stringify({
        "pinType": "NUMERIC",
        "messageText": "Your AeroNotes verification code is {{pin}}", // Customized message
        "pinLength": 4, // We'll ensure our OTP generation matches this
        "senderId": INFOBIP_SENDER_ID 
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    console.log(`Attempting to create Infobip 2FA message template for app ${INFOBIP_2FA_APPLICATION_ID} on: ${INFOBIP_BASE_URL}`);

    fetch(`${INFOBIP_BASE_URL}/2fa/2/applications/${INFOBIP_2FA_APPLICATION_ID}/messages`, requestOptions)
        .then(async (response) => {
            const textResult = await response.text();
            if (!response.ok) {
                console.error(`Error creating message template: ${response.status} ${response.statusText}`);
                console.error("Response body:", textResult);
                throw new Error(`HTTP error! status: ${response.status}, body: ${textResult}`);
            }
            try {
                return JSON.parse(textResult);
            } catch (e) {
                console.error("Failed to parse JSON response:", textResult);
                throw e;
            }
        })
        .then((result) => {
            console.log("\nInfobip Message Template Creation Result:");
            console.log(JSON.stringify(result, null, 2));
            if (result.id) { // Infobip seems to return the messageId as 'id' in this response
                console.log("\nSUCCESS! Your 2FA Message ID is:", result.id);
                console.log("Please copy this ID and update INFOBIP_2FA_MESSAGE_ID in your .env.local file.");
            } else {
                console.warn("\nMessage ID not found in the response (expected 'id' field). Please check the full result above.");
            }
        })
        .catch((error) => {
            if (!error.message.startsWith('HTTP error!')) {
                console.error('\nFailed to create Infobip message template (Network or other error):', error);
            } else {
                console.error('\nOperation failed. See details above.');
            }
        });
}

setupMessageTemplate().catch(err => {
    console.error("Unhandled error in setupMessageTemplate script:", err);
    process.exit(1); 
}); 