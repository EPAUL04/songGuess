// ================================= global variables (bad for security, workshop) ===================================
const clientId = '4f101e56287d4095af259be90a77b1b9';    
// const redirectUriFail = 'https://epaul04.github.io/songGuess/login-failure.html';
const redirectUri = 'https://epaul04.github.io/songGuess/login-success.html';
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');

// ================================================== API stuff =======================================================
// take user to spotify API login page and navigate to redirect page
async function login() {
    // from spotify's API guide: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow 
    
    // step 1: code challenge
    const generateRandomString = (length) => {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const values = crypto.getRandomValues(new Uint8Array(length));
      return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }
    
    const codeVerifier  = generateRandomString(64);
    
    const sha256 = async (plain) => {
      const encoder = new TextEncoder()
      const data = encoder.encode(plain)
      return window.crypto.subtle.digest('SHA-256', data)
    }
    
    const base64encode = (input) => {
      return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    }
    
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);
    
    // step 2: user authentication
    
    const scope = 'user-read-private user-read-email';
    const authUrl = new URL("https://accounts.spotify.com/authorize")
    
    // generated in the previous step
    window.localStorage.setItem('code_verifier', codeVerifier);
    
    const params =  {
      response_type: 'code',
      client_id: clientId,
      scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    }
    
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
    
}

// get access token and store in local storage
async function getToken() {
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

  const response = await fetch(url, payload);
  const data = await response.json();   
  localStorage.setItem('access_token', data.access_token);
}

// requests user's profile from spotify using access token stored in local storage
async function requestProfile() {
  // get access token
  try {
    await getToken();
  } catch (error) {
    console.log("ERROR: " + error);
  }
  let token = localStorage.getItem("access_token");

  // get profile using access token
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET", headers: { Authorization: "Bearer " + token }
  });  
  const profile = await result.json();

  // set text to reflect display name
  document.getElementById("name").innerText = profile.display_name;
  //TODO: make start button visible here
}


// ================================================== gameplay! =======================================================


// picks song, gets data ready, calls submit(0)
function start() {
  //pick song

  //get data ready

  // start gameplay!
  submit(0);
}

function submit(num) {
  // should take num, add 1, and set the elements associated to be visible!
  const divis = document.getElementById(num + 1);
  divis.style.color = "red";
  const input = divis.getElementsByTagName("input");
  divis.getElementsByTagName("input").style.pointerEvents = "auto";
  divis.getElementsByTagName("label").style.pointerEvents = "auto";
  divis.getElementsByTagName("button").style.pointerEvents = "auto";
}

function submitFinal() {
  // validate and call either win or lose
}

function validate(guess) {
  // validate it girl
}

function win() {
  // tell user they won, do something fun
}

function lose() {
  // tell winner they lost
}