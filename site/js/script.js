function parseCookieJSON() {
    if (document.cookie) {
        c = document.cookie.split('; ');
        cookies = {};
        for (let i = c.length - 1; i >= 0; i--) {
            C = c[i].split('=');
            cookies[C[0]] = C[1];
        }
        var cookie = cookies['headbookcookies']
        if (cookie)
            return JSON.parse(decodeURIComponent(cookie));
    }
    return {}
}

function sendRequest(url = "/", type = "GET", data = {}) {
    return $.ajax({
            url: url,
            data: data,
            type: type,
            dataType: "json",
        }).fail(function (xhr, status, errorThrown) {
            console.log("Sorry, there was a problem!")
            console.log("Error: " + errorThrown);
            console.log("Status: " + status);
            console.dir(xhr);
        })
        .always(function (xhr, status) {
            console.log("The request is complete!");
        });
}

function signupData(name, email, password) {
    return {
        name: name,
        email: email,
        password: password
    }
}

function loginData(email, password, remeberme) {
    return {
        email: email,
        password: password,
        remeberme: remeberme
    }
}