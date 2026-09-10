const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/callback', async (req, res) => {
    const authCode = req.query.code;
    console.log("Caught code:", authCode);

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: authCode,
                // This will use your Railway domain variable once deployed
                redirect_uri: process.env.REDIRECT_URI, 
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${accessToken}` },
        });
        
        const userData = await userResponse.json();
        console.log("Fetched User Profile Username:", userData.username);

        res.send("Authentication complete! Check your terminal.");
    } catch (error) {
        console.error("Error during OAuth exchange:", error);
        res.status(500).send("Authentication failed");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));