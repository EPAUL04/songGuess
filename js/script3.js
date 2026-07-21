const clientId = '4f101e56287d4095af259be90a77b1b9';    
const redirectUri = 'https://epaul04.github.io/songGuess/login-success.html';
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');

window.onload = async () => {
//step 3: request an access token
    const getToken = async code => {
    
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
        })
      }
    
      const body = await fetch(url, payload);
      const response = await body;

      alert("status " + response.status + ", text " + response.text);
    
      localStorage.setItem("acc_token", response.access_token);
    }
    getToken(code);
}

function alertme() {
    alert("token is " + localStorage.getItem("acc_token"));
}