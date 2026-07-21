const clientId = "4f101e56287d4095af259be90a77b1b9";
const redirectUri = "https://epaul04.github.io/songGuess/login-success.html";

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
        alert("no code");
        return;
    };

    await getToken(code);
    await requestProfile();
}

async function getToken(code) {

    const codeVerifier = localStorage.getItem("code_verifier");

    const body = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        }
    );

    const response = await body.json();

    console.log(response);

    localStorage.setItem("acc_token", response.access_token);
}

async function requestProfile() {
    const token = localStorage.getItem("acc_token");

    const result = await fetch("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const profile = await result.json();

    console.log(profile);

    document.getElementById("name").textContent = profile.display_name;
}