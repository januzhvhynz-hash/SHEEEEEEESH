const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Root route to avoid the "Cannot GET /" error page
app.get('/', (req, res) => {
    res.send('Discord OAuth2 Server is up and running!');
});

app.get('/callback', async (req, res) => {
    const authCode = req.query.code;

    // 1. Safety check: Ensure the code exists before hitting Discord
    if (!authCode) {
        return res.status(400).send('No authorization code provided!');
    }

    console.log("Caught code:", authCode);

    try {
        // 2. Exchange code for an Access Token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: process.env.REDIRECT_URI, 
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 3. Safety check: Make sure token exchange actually succeeded
        if (!accessToken) {
            console.log('Failed to get access token:', tokenData);
            return res.status(400).send('Authentication failed during token exchange.');
        }

        // 4. Fetch the user profile using the access token
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${accessToken}` },
        });
        
        const userData = await userResponse.json();
        
        const username = userData.username;[cite: 1]
        const globalName = userData.global_name;

        console.log(`Successfully fetched user profile! Username: ${username}, Display Name: ${globalName}`);

        res.send(`Authentication complete! Welcome, ${globalName || username}. Check your logs.`);
    } catch (error) {
        console.error("Error during OAuth exchange:", error);
        res.status(500).send("Authentication failed due to an internal error.");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
