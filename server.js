const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Discord OAuth2 Server is up and running!');
});

app.get('/callback', async (req, res) => {
    const authCode = req.query.code;

    if (!authCode) {
        return res.status(400).send('No authorization code provided!');
    }

    console.log("Caught code:", authCode);

    try {
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

        if (!accessToken) {
            console.log('Failed to get access token:', tokenData);
            return res.status(400).send('Authentication failed during token exchange.');
        }

        // Fetch the user profile using the access token
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${accessToken}` },
        });
        
        const userData = await userResponse.json();
        
        const userId = userData.id;
        const username = userData.username;
        const globalName = userData.global_name;
        const avatarHash = userData.avatar;

        console.log(`Successfully fetched user profile! ID: ${userId}, Username: ${username}`);

        // Send a detailed HTML response back to your browser
        res.send(`
            <h1>OAuth Successful!</h1>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Display Name:</strong> ${globalName || 'None'}</p>
            <p><strong>Discord ID (Snowflake):</strong> ${userId}</p>
            <p>Check your Railway logs to see the raw data exchange!</p>
        `);
    } catch (error) {
        console.error("Error during OAuth exchange:", error);
        res.status(500).send("Authentication failed due to an internal error.");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
