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
    
    const scope = 'user-read-private user-read-email playlist-read-private user-library-read';
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
  const songRequest = await fetch(`https://api.spotify.com/v1/playlists/${selected.id}/items?offset=${offsetSong}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(songRequest); //TODO: remove
  const songPage = await songRequest.json();
  console.log(songPage); //TODO: remove
  // get the song from within their weird API stuff
  const selectedSong = songPage.items[indexSong].item;
  // set global var so we can do validation yayyyy
  songGlobal = selectedSong;
  alert("song is " + songGlobal.name);

  // update other globals!
  const songRequestFinal = await fetch(`https://api.spotify.com/v1/tracks/${songGlobal.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const features = await songRequestFinal.json();

  // playlists is going to be hard, it's going to have to be either only the playlist it was pulled from or like. a crazy loop
  playlistsGlobal = selected.name; //currently playlist pulled from
  addedGlobal = songPage.items[indexSong].added_at;
  artistsGlobal = features.artists;
  albumGlobal = features.album;
}

async function getSongFeatures(songName) {
  // getToken();
  let token = localStorage.getItem("access_token");
  // turn songName into actual track object
  const findSong = await fetch(`https://api.spotify.com/v1/search?q=${songName}&type=track`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await findSong.json();
  console.log(result);
  const id = result.tracks.items[0].id;
  const songRequestFinal = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const features = await songRequestFinal.json();

  // get playlist the song is on
  // getToken();
  token = localStorage.getItem("access_token");
  const check = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const inPlaylist = await check.json();
  let playlist = inPlaylist[0];

  // get artist
  let artists = features.artists;

  // get album
  let album = features.album.name;


  // now compare and update display ====================================================================
  if (playlist == playlistsGlobal) {
    document.getElementById("display-playlist").textContent = playlist;
  }

  for (let i = 0; i < artists.length; i++) {
    for (let j = 0; j < artistsGlobal.length; j++) {
      if (artists[i].name == artistsGlobal[j].name) {
        if (document.getElementById("display-artists").textContent.includes("(artist)")) {
          document.getElementById("display-artists").textContent = "";
        }
        if (!document.getElementById("display-artists").textContent.includes(artists[i].name)) {
          document.getElementById("display-artists").textContent += artists[i].name;
          document.getElementById("display-artists").textContent.replace("(artist)", "");
        }
      }
    }
  }
  
  if (album == albumGlobal.name) {
    document.getElementById("display-album").textContent = albumGlobal.name;
    getAlbumCover(albumGlobal);
  }
}

async function getAlbumCover(album) {
  // send request for album art
  // getToken();
  const token = localStorage.getItem("access_token");
  const request = await fetch(`https://api.spotify.com/v1/albums/${albumGlobal.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const cover = await request.json();
  // set the element to the new src url
  document.getElementById("display-image").src = cover.images[0].url;
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
    if (validate(input.value) == true) {
      win();
    }
    else {
      giveClue(num);
    }
  }
  else {
    // disable start button
    document.getElementById("start").style.backgroundColor = "gray";
    document.getElementById("start").style.pointerEvents = "none";
  }
  
  // set (num + 1) group's elements to be clickable
  document.getElementById("answer" + (num + 1)).style.pointerEvents = "auto";
  document.getElementById("answer" + (num + 1)).style.backgroundColor = "whitesmoke";
  document.getElementById("submit" + (num + 1)).style.pointerEvents = "auto";
  document.getElementById("submit" + (num + 1)).style.backgroundColor = "whitesmoke";

  if (num > 0) {
    // set num group's elements to be non-clickable
    document.getElementById("answer" + num).style.pointerEvents = "none";
    document.getElementById("answer" + (num)).style.backgroundColor = "lightgray";
    document.getElementById("submit" + (num)).style.pointerEvents = "none";
    document.getElementById("submit" + (num)).style.backgroundColor = "lightgray";
  }
}

function submitFinal() {
  // validate and call either win or lose
  if (validate(document.getElementById("answer7").value) == true) {
    win();
  }
  else {
    lose();
  }
}

function giveClue(num) {
  switch(num) {
    case 1:
      // alert("playlist: " + playlistsGlobal);
      document.getElementById("display-playlist").style.transition = "2s ease";
      document.getElementById("display-playlist").textContent = playlistsGlobal;
      break;
    case 2:
      // alert("added: " + addedGlobal);
      document.getElementById("display-added").textContent = addedGlobal;
      break;
    case 3:
      // alert("artists: " + artistsGlobal);
      let text = "";
      for (let i = 0; i < artistsGlobal.length - 1; i++) {
        text += artistsGlobal[i].name + ", ";
      }
      text += artistsGlobal[artistsGlobal.length - 1].name;
      document.getElementById("display-artists").textContent = " ";
      document.getElementById("display-artists").textContent = text;
      break;
    case 4:
      // alert("album: " + albumGlobal);
      document.getElementById("display-album").textContent = albumGlobal.name;
      getAlbumCover();
      break;
    case 6:
      // alert("first letter: " + songGlobal.name[0]);
      document.getElementById("display-title").textContent = songGlobal.name[0] + "...";
      break;
  }
}

async function validate(guess) {
  // check if anything matches and handle display!
  getSongFeatures(guess);

  // validate it girl
  let token = localStorage.getItem("access_token");
  // turn songName into actual track object
  const findSong = await fetch(`https://api.spotify.com/v1/search?q=${guess}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const found = await findSong.json();
  // console.log(found);
  // alert("submitting " + found.tracks.items[0].name);
  let bool = (songGlobal == found.tracks.items[0]);
  alert("comparing " + found.tracks.items[0].name + " and " + songGlobal.name + " and getting " + bool);
  return songGlobal.name == found.tracks.items[0].name;
}

function win() {
  // tell user they won, do something fun
  alert("you win!!!");
  document.getElementById("reset-button").style.pointerEvents = "auto";
  document.getElementById("reset-button").style.backgroundColor = "whitesmoke";
  document.getElementById("display-title").textContent = songGlobal.name;
}

function lose() {
  // tell winner they lost
  alert("the song was " + songGlobal.name);
  document.getElementById("reset-button").style.backgroundColor = "whitesmoke";
  document.getElementById("reset-button").style.pointerEvents = "auto";
  document.getElementById("display-title").textContent = songGlobal.name;
}