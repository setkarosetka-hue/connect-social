
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

  let currentUser = null;
  let profileEditor = null;

  // СООБЩЕНИЯ
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

  // ЗАГРУЗКА
  function setLoading(form, loading) {
    if (!form) return;

    form.querySelectorAll("button").forEach((button) => {
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

  // ИНТЕРФЕЙС
  function updateUI(user) {
    currentUser = user || null;

    const isLoggedIn = Boolean(user);

    if (elements.authBox) {
      elements.authBox.style.display =
        isLoggedIn ? "none" : "block";
    }

    if (elements.profileBox) {
      elements.profileBox.style.display =
        isLoggedIn ? "block" : "none";
    }

    if (elements.headerUser) {
      elements.headerUser.textContent =
        isLoggedIn ? user.email : "Добро пожаловать!";
    }

    if (elements.userEmail) {
      elements.userEmail.textContent =
        isLoggedIn ? user.email : "";
    }

    if (!isLoggedIn && profileEditor) {
      profileEditor.remove();
      profileEditor = null;
    }
  }

  // СОЗДАНИЕ РЕДАКТОРА ПРОФИЛЯ
  function createProfileEditor() {
    if (!elements.profileBox) return null;

    if (profileEditor) return profileEditor;

    const editor = document.createElement("section");

    editor.id = "connectProfileEditor";

    editor.style.cssText = `
      margin-top: 24px;
      padding: 24px;
      border-radius: 20px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      max-width: 500px;
      box-sizing: border-box;
    `;

    const title = document.createElement("h2");
    title.textContent = "Мой профиль";

    const avatarPreview = document.createElement("img");

    avatarPreview.alt = "Аватар профиля";
    avatarPreview.style.cssText = `
      width: 90px;
      height: 90px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      margin: 16px 0;
      background: #27272a;
    `;

    const usernameLabel = document.createElement("label");
    usernameLabel.textContent = "Никнейм";

    const usernameInput = document.createElement("input");
    usernameInput.id = "connectUsername";
    usernameInput.type = "text";
    usernameInput.maxLength = 24;
    usernameInput.placeholder = "Например, connect_user";

    const avatarLabel = document.createElement("label");
    avatarLabel.textContent = "Ссылка на аватар";

    const avatarInput = document.createElement("input");
    avatarInput.id = "connectAvatar";
    avatarInput.type = "url";
    avatarInput.placeholder = "https://example.com/avatar.png";

    const bioLabel = document.createElement("label");
    bioLabel.textContent = "О себе";

    const bioInput = document.createElement("textarea");
    bioInput.id = "connectBio";
    bioInput.maxLength = 160;
    bioInput.rows = 4;
    bioInput.placeholder = "Расскажи немного о себе...";

    const saveButton = document.createElement("button");
    saveButton.id = "connectSaveProfile";
    saveButton.type = "button";
    saveButton.textContent = "Сохранить профиль";

    const status = document.createElement("p");
    status.id = "connectProfileStatus";
    status.style.cssText = `
      margin-top: 12px;
      font-size: 14px;
    `;

    const fields = [
      usernameInput,
      avatarInput,
      bioInput,
    ];

    fields.forEach((field) => {
      field.style.cssText = `
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 12px;
        margin: 8px 0 16px;
        border-radius: 10px;
        border: 1px solid #444;
        background: #18181b;
        color: white;
        font: inherit;
      `;
    });

    [usernameLabel, avatarLabel, bioLabel].forEach((label) => {
      label.style.cssText = `
        display: block;
        font-weight: 600;
        margin-top: 12px;
      `;
    });

    saveButton.style.cssText = `
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      background: #6366f1;
      color: white;
      font-weight: bold;
      cursor: pointer;
    `;

    editor.append(
      title,
      avatarPreview,
      usernameLabel,
      usernameInput,
      avatarLabel,
      avatarInput,
      bioLabel,
      bioInput,
      saveButton,
      status
    );

    elements.profileBox.appendChild(editor);

    profileEditor = editor;

    avatarInput.addEventListener("input", () => {
      const url = avatarInput.value.trim();

      if (url.startsWith("https://")) {
        avatarPreview.src = url;
      }
    });

    saveButton.addEventListener("click", saveProfile);

    return editor;
  }

  // ЗАГРУЗКА ПРОФИЛЯ
  async function loadProfile(user) {
    if (!supabaseClient || !user) return;

    const editor = createProfileEditor();

    if (!editor) return;

    const usernameInput =
      editor.querySelector("#connectUsername");

    const avatarInput =
      editor.querySelector("#connectAvatar");

    const bioInput =
      editor.querySelector("#connectBio");

    const avatarPreview =
      editor.querySelector("img");

    const status =
      editor.querySelector("#connectProfileStatus");

    status.textContent = "Загружаем профиль...";

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        status.textContent =
          "Профиль не найден. Возможно, он ещё не создан.";

        usernameInput.value =
          "user_" + user.id.substring(0, 8);

        avatarInput.value = "";
        bioInput.value = "";

        return;
      }

      usernameInput.value = data.username || "";
      avatarInput.value = data.avatar_url || "";
      bioInput.value = data.bio || "";

      avatarPreview.src =
        data.avatar_url ||
        "https://placehold.co/200x200/27272a/ffffff?text=Connect";

      status.textContent = "Профиль загружен.";
    } catch (error) {
      status.textContent =
        "Ошибка загрузки: " + error.message;
    }
  }

  // СОХРАНЕНИЕ ПРОФИЛЯ
  async function saveProfile() {
    if (!currentUser || !supabaseClient) {
      showMessage("Сначала войди в аккаунт.", "error");
      return;
    }

    const editor = profileEditor;

    if (!editor) return;

    const usernameInput =
      editor.querySelector("#connectUsername");

    const avatarInput =
      editor.querySelector("#connectAvatar");

    const bioInput =
      editor.querySelector("#connectBio");

    const saveButton =
      editor.querySelector("#connectSaveProfile");

    const status =
      editor.querySelector("#connectProfileStatus");

    const username = usernameInput.value.trim();
    const avatarUrl = avatarInput.value.trim();
    const bio = bioInput.value.trim();

    if (username.length < 3 || username.length > 24) {
      status.textContent =
        "Никнейм должен быть от 3 до 24 символов.";
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      status.textContent =
        "Никнейм может содержать только латинские буквы, цифры и _.";
      return;
    }

    if (
      avatarUrl &&
      !avatarUrl.startsWith("https://")
    ) {
      status.textContent =
        "Ссылка на аватар должна начинаться с https://";
      return;
    }

    if (bio.length > 160) {
      status.textContent =
        "Описание не должно превышать 160 символов.";
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Сохраняем...";
    status.textContent = "";

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .upsert(
          {
            id: currentUser.id,
            username: username,
            avatar_url: avatarUrl || null,
            bio: bio,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single();

      if (error) throw error;

      const avatarPreview =
        editor.querySelector("img");

      avatarPreview.src =
        data.avatar_url ||
        "https://placehold.co/200x200/27272a/ffffff?text=Connect";

      status.textContent =
        "Профиль успешно сохранён!";

      if (elements.headerUser) {
        elements.headerUser.textContent =
          data.username;
      }
    } catch (error) {
      if (error.code === "23505") {
        status.textContent =
          "Этот никнейм уже занят. Выбери другой.";
      } else {
        status.textContent =
          "Ошибка сохранения: " + error.message;
      }
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Сохранить профиль";
    }
  }

  // ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ
  async function checkUser() {
    if (!supabaseClient) {
      showMessage(
        "Ошибка подключения к Supabase. Проверь supabase.js.",
        "error"
      );
      return;
    }

    const { data, error } =
      await supabaseClient.auth.getUser();

    if (error) {
      updateUI(null);
      return;
    }

    updateUI(data.user);

    if (data.user) {
      await loadProfile(data.user);
    }
  }

  // РЕГИСТРАЦИЯ
  if (elements.registerForm) {
    elements.registerForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();
        clearMessage();

        const email =
          elements.registerEmail?.value.trim();

        const password =
          elements.registerPassword?.value;

        if (!email || !password) {
          showMessage(
            "Заполни Email и пароль.",
            "error"
          );
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
            await loadProfile(data.user);

            showMessage(
              "Ты успешно зарегистрировался в Connect!",
              "success"
            );
          } else {
            showMessage(
              "Регистрация завершена. Проверь почту.",
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
      }
    );
  }

  // ВХОД
  if (elements.loginForm) {
    elements.loginForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();
        clearMessage();

        const email =
          elements.loginEmail?.value.trim();

        const password =
          elements.loginPassword?.value;

        if (!email || !password) {
          showMessage(
            "Введи Email и пароль.",
            "error"
          );
          return;
        }

        setLoading(elements.loginForm, true);

        try {
          const { data, error } =
            await supabaseClient.auth
              .signInWithPassword({
                email,
                password,
              });

          if (error) throw error;

          updateUI(data.user);
          await loadProfile(data.user);

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
      }
    );
  }

  // ВЫХОД
  if (elements.logoutButton) {
    elements.logoutButton.addEventListener(
      "click",
      async () => {
        clearMessage();

        elements.logoutButton.disabled = true;

        try {
          const { error } =
            await supabaseClient.auth.signOut();

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
      }
    );
  }

  // АВТОРИЗАЦИЯ
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
