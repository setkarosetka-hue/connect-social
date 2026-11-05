
(() => {
  "use strict";

  if (window.__connectAppInitialized) return;
  window.__connectAppInitialized = true;

  const supabaseClient = window.connectSupabase;

  const REDIRECT_URL =
    "https://setkarosetka-hue.github.io/connect-social/";

  const elements = {
    headerUser: document.getElementById("headerUser"),
    authBox: document.getElementById("authBox"),
    registerForm: document.getElementById("registerForm"),
    registerEmail: document.getElementById("registerEmail"),
    registerPassword: document.getElementById("registerPassword"),
    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    authMessage: document.getElementById("authMessage"),
    profileBox: document.getElementById("profileBox"),
    userEmail: document.getElementById("userEmail"),
    logoutButton: document.getElementById("logoutButton"),
  };

  function showMessage(message, type = "info") {
    if (!elements.authMessage) return;

    elements.authMessage.textContent = message;
    elements.authMessage.dataset.type = type;
    elements.authMessage.style.display = "block";
  }

  function clearMessage() {
    if (!elements.authMessage) return;

    elements.authMessage.textContent = "";
    elements.authMessage.style.display = "none";
  }

  function setLoading(form, loading) {
    if (!form) return;

    const buttons = form.querySelectorAll("button");

    buttons.forEach((button) => {
      button.disabled = loading;

      if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = "Подожди...";
      } else {
        button.textContent =
          button.dataset.originalText || button.textContent;
      }
    });
  }

  function updateUI(user) {
    const isLoggedIn = Boolean(user);

    if (elements.authBox) {
      elements.authBox.style.display = isLoggedIn ? "none" : "block";
    }

    if (elements.profileBox) {
      elements.profileBox.style.display = isLoggedIn ? "block" : "none";
    }

    if (elements.headerUser) {
      elements.headerUser.textContent = isLoggedIn
        ? user.email
        : "Добро пожаловать!";
    }

    if (elements.userEmail) {
      elements.userEmail.textContent = isLoggedIn
        ? user.email
        : "";
    }
  }

  async function checkUser() {
    if (!supabaseClient) {
      showMessage(
        "Ошибка подключения к Supabase. Проверь файл supabase.js.",
        "error"
      );
      return;
    }

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      updateUI(null);
      return;
    }

    updateUI(data.user);
  }

  // РЕГИСТРАЦИЯ
  if (elements.registerForm) {
    elements.registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearMessage();

      const email = elements.registerEmail?.value.trim();
      const password = elements.registerPassword?.value;

      if (!email || !password) {
        showMessage("Заполни Email и пароль.", "error");
        return;
      }

      if (password.length < 6) {
        showMessage(
          "Пароль должен содержать минимум 6 символов.",
          "error"
        );
        return;
      }

      setLoading(elements.registerForm, true);

      try {
        const { data, error } =
          await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: REDIRECT_URL,
            },
          });

        if (error) throw error;

        if (data.user && !data.session) {
          showMessage(
            "Аккаунт создан! Проверь почту и подтверди Email.",
            "success"
          );
        } else if (data.session) {
          updateUI(data.user);
          showMessage(
            "Ты успешно зарегистрировался в Connect!",
            "success"
          );
        } else {
          showMessage(
            "Регистрация завершена. Проверь свою почту.",
            "success"
          );
        }

        elements.registerForm.reset();
      } catch (error) {
        showMessage(
          error.message || "Ошибка регистрации.",
          "error"
        );
      } finally {
        setLoading(elements.registerForm, false);
      }
    });
  }

  // ВХОД
  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearMessage();

      const email = elements.loginEmail?.value.trim();
      const password = elements.loginPassword?.value;

      if (!email || !password) {
        showMessage("Введи Email и пароль.", "error");
        return;
      }

      setLoading(elements.loginForm, true);

      try {
        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        updateUI(data.user);

        showMessage(
          "С возвращением в Connect!",
          "success"
        );

        elements.loginForm.reset();
      } catch (error) {
        showMessage(
          error.message || "Ошибка входа.",
          "error"
        );
      } finally {
        setLoading(elements.loginForm, false);
      }
    });
  }

  // ВЫХОД
  if (elements.logoutButton) {
    elements.logoutButton.addEventListener("click", async () => {
      clearMessage();
      elements.logoutButton.disabled = true;

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        updateUI(null);

        showMessage(
          "Ты вышел из аккаунта.",
          "success"
        );
      } catch (error) {
        showMessage(
          error.message || "Ошибка выхода.",
          "error"
        );
      } finally {
        elements.logoutButton.disabled = false;
      }
    });
  }

  // ПРОВЕРКА АВТОРИЗАЦИИ
  if (supabaseClient) {
    checkUser();

    supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        updateUI(session?.user || null);
      }
    );
  } else {
    showMessage(
      "Supabase не подключён. Проверь supabase.js.",
      "error"
    );
  }
})();
