const clientId = '4f101e56287d4095af259be90a77b1b9';    
const redirectUri = 'https://epaul04.github.io/songGuess/login-success.html';
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');

async function getToken() {
    // stored in the previous step
    const codeVerifier = localStorage.getItem('code_verifier');

    const url = "https://accounts.spotify.com/api/token";
    const payload = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        }),
    }

    const response = await fetch(url, payload);

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("OK:", response.ok);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("Body:", data);

    alert("done");

    localStorage.setItem('access_token', data.access_token);
    alert("final token data.acc: " + localStorage.getItem(access_token));
    alert("final token localStorage: " + localStorage.getItem(access_token));
}
