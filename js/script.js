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
    
    const scope = 'user-read-private user-read-email playlist-read-private';
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
}

//
async function grabSong() {
  // first choose a playlist ============================================
  // get access token
  let token = localStorage.getItem("access_token");

  // get playlist library using access token
  const result = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "GET", headers: { Authorization: "Bearer " + token }
  });  
  const playlists = await result.json();
  
  // get random number within range(0, number of playlists)
  alert("total playlists returned: " + playlists.total);
  const rand = Math.floor(Math.random() * playlists.total);
  alert("selected playlist: " + rand);
  
  // now get that playlist ===============================================
  // get playlist data using access token
  const playlistAddress = "https://api.spotify.com/v1/me/playlist/" + playlists.items[rand].id;
  const result2 = await fetch(playlistAddress, {
    method: "GET", headers: { Authorization: "Bearer " + token, 'offset': rand }
  });  
  const playlist = await result.json();
  alert("got playlist " + playlist.name);

  // now get a song from it
  alert("playlist has " + playlist.items.total + " songs");
  const rand2 = Math.floor(Math.random() * playlist.items.total);
  alert("selected song: " + rand2);

  const songAddress = "https://api.spotify.com/v1/me/playlist/" + playlists.items[rand].id + "/items";
  const song = await fetch(songAddress, {
    method: "GET", headers: { Authorization: "Bearer " + token, 'offset': rand2 }
  });  
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
  alert("answer" + num);

  // validate input
  if (num != 0) {
    const input = document.getElementById("answer" + num);
    validate(input.value);
  }
  else {
    // these are all for the actual start button!!!
    // get a song
    grabSong();

    // disable start button
    document.getElementById("start").style.backgroundColor = "gray";
    document.getElementById("start").style.pointerEvents = "none";
  }
  
  // set (num + 1) group's elements to be clickable
  const divis = document.getElementById(num + 1);
  document.getElementById("answer" + (num + 1)).style.pointerEvents = "auto";
  document.getElementById("submit" + (num + 1)).style.pointerEvents = "auto";
}

function submitFinal() {
  // validate and call either win or lose
}

function validate(guess) {
  // validate it girl
  alert("submitting " + guess);
}

function win() {
  // tell user they won, do something fun
}

function lose() {
  // tell winner they lost
}