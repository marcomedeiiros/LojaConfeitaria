document.addEventListener("DOMContentLoaded", () => {
  const securityBox = document.getElementById("securityBox");
  const closeBtn = document.getElementById("closeSecurityBox");

  setTimeout(() => securityBox.classList.add("show"), 200);
  setTimeout(() => {
    securityBox.classList.remove("show");
    securityBox.classList.add("hide");
  }, 4200);

  closeBtn.addEventListener("click", () => {
    securityBox.classList.remove("show");
    securityBox.classList.add("hide");
  });

  const form = document.querySelector(".register-form");
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm-password");
  const phone = document.getElementById("phone");
  const address = document.getElementById("address");
  const registerButton = document.querySelector(".register-button");

  function showMessage(message, type = "success") {
    const msg = document.createElement("div");
    msg.className = `message ${type}`;
    msg.textContent = message;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.classList.add("hide");
      setTimeout(() => msg.remove(), 500);
    }, 3000);
  }

  const strengthBar = document.createElement("div");
  strengthBar.classList.add("strength-bar");
  password.insertAdjacentElement("afterend", strengthBar);

  password.addEventListener("input", () => {
    const val = password.value;
    let strength = 0;
    if (val.length >= 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    strengthBar.style.width = `${strength * 25}%`;
    strengthBar.style.background = ["red", "orange", "yellow", "green"][strength - 1] || "transparent";
  });

  phone.addEventListener("input", () => {
    let val = phone.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);

    if (val.length > 6) val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    else if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    else if (val.length > 0) val = `(${val}`;

    phone.value = val;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!username.value.trim() || !email.value.trim() || !password.value.trim() || !confirmPassword.value.trim() || !phone.value.trim() || !address.value.trim()) {
      showMessage("Preencha todos os campos!", "error");
      return;
    }

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!emailPattern.test(email.value)) {
      showMessage("Digite um e-mail válido!", "error");
      return;
    }

    if (password.value !== confirmPassword.value) {
      showMessage("As senhas não coincidem!", "error");
      return;
    }

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!strong.test(password.value)) {
      showMessage("Senha fraca! Use letras maiúsculas, números e símbolos.", "error");
      return;
    }

    registerButton.textContent = "Registrando...";
    registerButton.disabled = true;

    setTimeout(() => {
      showMessage("Conta criada com sucesso!", "success");
      registerButton.textContent = "Registrar";
      registerButton.disabled = false;
      form.reset();
      strengthBar.style.width = "0";

      window.location.href = "login.html";
    }, 2000);
  });
});