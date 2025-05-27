require('dotenv').config({ path: '.env.local' }); // Reads .env.local variables into process.env.

async function setupInfobip() {
    // Dynamically import node-fetch
    const fetch = (await import('node-fetch')).default;

    const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
    const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;

    if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
        console.error('Error: INFOBIP_API_KEY or INFOBIP_BASE_URL not found in environment variables.');
        console.error('Please ensure they are correctly set in your .env.local file and you have restarted your terminal or sourced the file if needed for local scripts.');
        process.exit(1);
    }

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `App ${INFOBIP_API_KEY}`);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");

    const raw = JSON.stringify({
        "name": "AeroNotes 2FA App", // You can customize this name
        "enabled": true,
        "configuration": {
            "pinAttempts": 10,
            "allowMultiplePinVerifications": true,
            "pinTimeToLive": "15m",
            "verifyPinLimit": "1/3s",
            "sendPinPerApplicationLimit": "10000/1d",
            "sendPinPerPhoneNumberLimit": "10/1d"
        }
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    console.log(`Attempting to create Infobip 2FA application on: ${INFOBIP_BASE_URL}/2fa/2/applications`);

    fetch(`${INFOBIP_BASE_URL}/2fa/2/applications`, requestOptions)
        .then(async (response) => {
            const textResult = await response.text();
            if (!response.ok) {
                console.error(`Error creating application: ${response.status} ${response.statusText}`);
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
            console.log("\nInfobip Application Creation Result:");
            console.log(JSON.stringify(result, null, 2)); // Pretty print JSON
            if (result.applicationId) {
                console.log("\nSUCCESS! Your 2FA Application ID is:", result.applicationId);
                console.log("Please copy this ID and update INFOBIP_2FA_APPLICATION_ID in your .env.local file.");
            } else {
                console.warn("\nApplication ID not found in the response. Please check the full result above.");
            }
        })
        .catch((error) => {
            // Error from fetch itself or from the !response.ok check
            if (!error.message.startsWith('HTTP error!')) { // Avoid double logging if it's already an HTTP error we threw
                console.error('\nFailed to create Infobip application (Network or other error):', error);
            } else {
                console.error('\nOperation failed. See details above.');
            }
        });
}

setupInfobip().catch(err => {
    console.error("Unhandled error in setupInfobip script:", err);
    process.exit(1);
}); 