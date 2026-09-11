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

        // 1. Fetch user profile and email (requires 'email' scope)
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${accessToken}` },
        });
        const userData = await userResponse.json();

        // 2. Fetch user servers / guilds (requires 'guilds' scope)
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { authorization: `Bearer ${accessToken}` },
        });
        const guildsData = await guildsResponse.json();

        console.log(`Successfully fetched profile for ${userData.username}! Email: ${userData.email}`);
        console.log("User Guilds Count:", guildsData.length);

        // Display the harvested data on screen
        res.send(`
            <h1>OAuth Advanced Extraction Successful!</h1>
            <p><strong>Username:</strong> ${userData.username}</p>
            <p><strong>Email:</strong> ${userData.email || 'Not shared'}</p>
            <p><strong>Total Servers Found:</strong> ${guildsData.length}</p>
            <p>Check your Railway logs to see the full list of servers!</p>
        `);
    } catch (error) {
        console.error("Error during OAuth exchange:", error);
        res.status(500).send("Authentication failed due to an internal error.");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
