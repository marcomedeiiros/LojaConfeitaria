document.addEventListener("DOMContentLoaded", () => {
  const securityBox = document.getElementById("securityBox");
  const closeBtn = document.getElementById("closeSecurityBox");
  const loginForm = document.querySelector(".login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember");
  const googleBtn = document.querySelector(".social-button.google");
  const facebookBtn = document.querySelector(".social-button.facebook");

  setTimeout(() => securityBox.classList.add("show"), 200);
  setTimeout(() => {
    securityBox.classList.remove("show");
    securityBox.classList.add("hide");
  }, 4200);

  closeBtn.addEventListener("click", () => {
    securityBox.classList.remove("show");
    securityBox.classList.add("hide");
  });

  if (localStorage.getItem("savedLogin")) {
    usernameInput.value = localStorage.getItem("savedLogin");
    rememberCheckbox.checked = true;
  }

  function showMessage(text, type) {
    const msg = document.createElement("div");
    msg.className = `message ${type}`;
    msg.textContent = text;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.classList.add("hide");
      setTimeout(() => msg.remove(), 500);
    }, 3000);
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === "adm" && password === "123") {
      if (rememberCheckbox.checked) localStorage.setItem("savedLogin", username);
      else localStorage.removeItem("savedLogin");

      showMessage("Login realizado com sucesso!", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      showMessage("Usuário ou senha incorretos.", "error");
    }
  });

  function socialLogin(provider) {
    showMessage(`Login com ${provider} realizado!`, "success");
    setTimeout(() => window.location.href = "index.html", 1000);
  }

  googleBtn.addEventListener("click", () => socialLogin("Google"));
  facebookBtn.addEventListener("click", () => socialLogin("Facebook"));
});