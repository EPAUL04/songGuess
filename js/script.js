// ================================= global variables (bad for security, workshop) ===================================
const clientId = '4f101e56287d4095af259be90a77b1b9';    
// const redirectUriFail = 'https://epaul04.github.io/songGuess/login-failure.html';
const redirectUri = 'https://epaul04.github.io/songGuess/login-success.html';
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');

// song data
let songGlobal = null;
let playlistsGlobal = null;
let genresGlobal = null;
let artistsGlobal = null;
let albumGlobal = null;
let addedGlobal = null;

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
  let code = urlParams.get('code');
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
  // get new access token
  let token = localStorage.getItem("access_token");

  // get playlist library using access token
  const library = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "GET", headers: { Authorization: "Bearer " + token }
  });  
  let playlists = await library.json();
  
  // get random number within range(0, number of playlists)
  const rand = Math.floor(Math.random() * playlists.total);
  const offset = Math.floor(rand / 20);
  const index = rand % 20;

  // now get actual playlist from library with offset included
  const playlist = await fetch(`https://api.spotify.com/v1/me/playlists?offset=${offset * 20}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const page = await playlist.json();
  const selected = page.items[index];

  // address for specific playlist 
  const playlistAddress = "https://api.spotify.com/v1/playlists/" + selected.id;
  
  // now get a song from playlist ==========================================
  // get random number within range(0, number of songs)
  const rand2 = Math.floor(Math.random() * selected.items.total);
  const offsetSong = Math.floor(rand2 / 20);
  const indexSong = rand2 % 20;

  // send request with offset
  const songRequest = await fetch(`${playlistAddress}?offset=${offsetSong * 20}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const songPage = await songRequest.json();
  // get the song from within their weird API stuff
  const selectedSong = songPage.items.items[indexSong].item;
  // set global var so we can do validation yayyyy
  songGlobal = selectedSong;

  // update other globals!  //TODO: this!!!!!!!!!!!!!!!!!!!
  const songRequestFinal = await fetch(`https://api.spotify.com/v1/tracks/${songGlobal.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const features = await songRequestFinal.json();

  // playlists is going to be hard, it's going to have to be either only the playlist it was pulled from or like. a crazy loop
  playlistsGlobal = selected.name; //currently playlist pulled from

  // // genresGlobal
  // // features.
  // they can't do genres, maybe instead do when it was added to library?
  addedGlobal = selectedSong.added_at;

  artistsGlobal = features.artists;

  albumGlobal = features.album.name;
}

function getSongFeatures(song) {
  //TODO: finish :)

  // get playlists the song is on
  let playlist = "";

  // get genres
  // let genres = "";

  // get when added
  let added = "";

  // get artist
  let artist = "";

  // get album
  let album = "";


  // now compare and update display ====================================================================
  // for (let i = 0; i < playlists.length; i++) {
  //   for (let j = 0; j < playlistsGlobal.length; j++) {
  //     if (playlists[i] == playlistsGlobal[j]) {
  //       document.getElementById("display-playlists").textContent += playlists[i];
  //     }
  //   }
  // }
  if (playlist == playlistsGlobal) {
    document.getElementById("display-playlist").textContent = playlist;
  }

  // for (let i = 0; i < genres.length; i++) {
  //   for (let j = 0; j < genresGlobal.length; j++) {
  //     if (genres[i] == genresGlobal[j]) {
  //       document.getElementById("display-genres").textContent += genres[i];
  //     }
  //   }
  // }

  if (added == addedGlobal) {
    document.getElementById("display-added").textContent = playlist;
  }

  for (let i = 0; i < artists.length; i++) {
    for (let j = 0; j < artistsGlobal.length; j++) {
      if (artists[i] == artistsGlobal[j].name) {
        document.getElementById("display-artists").textContent += artists[i];
      }
    }
  }
  
  if (album == albumGlobal) {
    document.getElementById("display-album-title").textContent = album.name;
    // document.getElementById("display-image"). = album.; //TODO: add album art
  }
}


// ================================================== gameplay! =======================================================


// picks song, gets data ready, calls submit(0)
async function start() {
  //pick song
  await grabSong();

  // start gameplay!
  submit(0);
}

function submit(num) {
  // exclude num = 0 bc that's start button; validate
  if (num != 0) {
    const input = document.getElementById("answer" + num);
    validate(input.value);
    // giveClue(num);
  }
  else {
    // disable start button
    document.getElementById("start").style.backgroundColor = "gray";
    document.getElementById("start").style.pointerEvents = "none";
  }
  
  // set (num + 1) group's elements to be clickable
  document.getElementById("answer" + (num + 1)).style.pointerEvents = "auto";
  document.getElementById("submit" + (num + 1)).style.pointerEvents = "auto";
}

function submitFinal() {
  // validate and call either win or lose
  if (validate(document.getElementById("answer7"))) {
    win();
  }
  else {
    lose();
  }
}

function giveClue(num) {
  //TODO: do a switch here i think
  alert("clue");
}

function validate(guess) {
  // check if anything matches and handle display!
  // getSongFeatures(guess);

  // validate it girl
  alert("submitting " + guess); //TODO: remove
  return songGlobal == guess;
}

function win() {
  // tell user they won, do something fun
  alert("you win!!!");
}

function lose() {
  // tell winner they lost
  alert("you lose :/");
}