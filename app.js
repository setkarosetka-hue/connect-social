
(() => {
  "use strict";

  if (window.__connectAppInitialized) return;
  window.__connectAppInitialized = true;

  const supabaseClient = window.connectSupabase;

  const REDIRECT_URL =
    "https://setkarosetka-hue.github.io/connect-social/";

  const $ = (id) => document.getElementById(id);

  const elements = {
    headerUser: $("headerUser"),
    authBox: $("authBox"),
    registerForm: $("registerForm"),
    registerEmail: $("registerEmail"),
    registerPassword: $("registerPassword"),
    loginForm: $("loginForm"),
    loginEmail: $("loginEmail"),
    loginPassword: $("loginPassword"),
    authMessage: $("authMessage"),
    profileBox: $("profileBox"),
    userEmail: $("userEmail"),
    logoutButton: $("logoutButton"),

    resetPasswordForm: $("resetPasswordForm"),
    resetPasswordEmail: $("resetPasswordEmail"),
    forgotPasswordButton: $("forgotPasswordButton"),
    cancelResetPassword: $("cancelResetPassword"),

    groupsBox: $("groupsBox"),
    createGroupForm: $("createGroupForm"),
    groupName: $("groupName"),
    groupDescription: $("groupDescription"),
    groupAvatar: $("groupAvatar"),
    groupMessage: $("groupMessage"),
    groupsList: $("groupsList"),
    createGroupButton: $("createGroupButton"),

    createPostBox: $("createPostBox"),
    postContent: $("postContent"),
    postCharCount: $("postCharCount"),
  };

  let currentUser = null;
  let profileEditor = null;

  // =========================
  // MESSAGE HELPERS
  // =========================

  function showMessage(element, message, type = "info") {
    if (!element) return;

    element.textContent = message;
    element.dataset.type = type;
    element.style.display = "block";
  }

  function clearMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.style.display = "none";
  }

  function setLoading(form, loading) {
    if (!form) return;

    form.querySelectorAll('button[type="submit"]').forEach((button) => {
      if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = "Подожди...";
      } else {
        button.textContent =
          button.dataset.originalText || button.textContent;
      }

      button.disabled = loading;
    });
  }

  function setButtonLoading(button, loading, text) {
    if (!button) return;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = text || "Подожди...";
    } else {
      button.textContent =
        button.dataset.originalText || button.textContent;
    }

    button.disabled = loading;
  }

  // =========================
  // AUTH UI
  // =========================

  function updateUI(user) {
    currentUser = user || null;

    const loggedIn = Boolean(user);

    if (elements.authBox) {
      elements.authBox.hidden = loggedIn;
    }

    if (elements.profileBox) {
      elements.profileBox.hidden = !loggedIn;
    }

    if (elements.groupsBox) {
      elements.groupsBox.hidden = !loggedIn;
    }

    if (elements.createPostBox) {
      elements.createPostBox.hidden = !loggedIn;
    }

    if (elements.headerUser) {
      elements.headerUser.textContent =
        loggedIn ? user.email : "👤 Гость";
    }

    if (elements.userEmail) {
      elements.userEmail.textContent =
        loggedIn ? user.email : "";
    }

    if (!loggedIn && profileEditor) {
      profileEditor.remove();
      profileEditor = null;
    }
  }

  // =========================
  // PROFILE
  // =========================

  function createProfileEditor() {
    if (!elements.profileBox) return null;
    if (profileEditor) return profileEditor;

    const editor = document.createElement("section");
    editor.id = "connectProfileEditor";

    editor.style.cssText = `
      margin-top:24px;
      padding:24px;
      border-radius:20px;
      background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.12);
      max-width:500px;
      box-sizing:border-box;
    `;

    const title = document.createElement("h2");
    title.textContent = "Мой профиль";

    const avatar = document.createElement("img");
    avatar.alt = "Аватар профиля";
    avatar.src =
      "https://placehold.co/200x200/27272a/ffffff?text=Connect";

    avatar.style.cssText = `
      width:90px;height:90px;border-radius:50%;
      object-fit:cover;display:block;margin:16px 0;
    `;

    const usernameLabel = document.createElement("label");
    usernameLabel.textContent = "Никнейм";

    const username = document.createElement("input");
    username.id = "connectUsername";
    username.maxLength = 24;
    username.placeholder = "connect_user";

    const avatarLabel = document.createElement("label");
    avatarLabel.textContent = "Ссылка на аватар";

    const avatarInput = document.createElement("input");
    avatarInput.id = "connectAvatar";
    avatarInput.type = "url";
    avatarInput.placeholder = "https://example.com/avatar.png";

    const bioLabel = document.createElement("label");
    bioLabel.textContent = "О себе";

    const bio = document.createElement("textarea");
    bio.id = "connectBio";
    bio.maxLength = 160;
    bio.rows = 4;
    bio.placeholder = "Расскажи немного о себе...";

    const save = document.createElement("button");
    save.type = "button";
    save.id = "connectSaveProfile";
    save.className = "primary-button";
    save.textContent = "Сохранить профиль";

    const status = document.createElement("p");
    status.id = "connectProfileStatus";
    status.setAttribute("role", "status");

    [username, avatarInput, bio].forEach((field) => {
      field.style.cssText = `
        display:block;width:100%;box-sizing:border-box;
        padding:12px;margin:8px 0 16px;border-radius:10px;
      `;
    });

    editor.append(
      title,
      avatar,
      usernameLabel,
      username,
      avatarLabel,
      avatarInput,
      bioLabel,
      bio,
      save,
      status
    );

    elements.profileBox.appendChild(editor);
    profileEditor = editor;

    avatarInput.addEventListener("input", () => {
      const url = avatarInput.value.trim();

      if (url.startsWith("https://")) {
        avatar.src = url;
      }
    });

    save.addEventListener("click", saveProfile);

    return editor;
  }

  async function loadProfile(user) {
    if (!supabaseClient || !user) return;

    const editor = createProfileEditor();
    if (!editor) return;

    const username = editor.querySelector("#connectUsername");
    const avatarInput = editor.querySelector("#connectAvatar");
    const bio = editor.querySelector("#connectBio");
    const avatar = editor.querySelector("img");
    const status = editor.querySelector("#connectProfileStatus");

    status.textContent = "Загрузка профиля...";

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, avatar_url, bio, global_role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        status.textContent = "Профиль пока не найден.";
        return;
      }

      username.value = data.username || "";
      avatarInput.value = data.avatar_url || "";
      bio.value = data.bio || "";

      avatar.src =
        data.avatar_url ||
        "https://placehold.co/200x200/27272a/ffffff?text=Connect";

      status.textContent =
        "Роль: " + (data.global_role || "user");
    } catch (error) {
      status.textContent =
        "Ошибка загрузки профиля: " + error.message;
    }
  }

  async function saveProfile() {
    if (!currentUser || !profileEditor) return;

    const username =
      profileEditor.querySelector("#connectUsername").value.trim();

    const avatarUrl =
      profileEditor.querySelector("#connectAvatar").value.trim();

    const bio =
      profileEditor.querySelector("#connectBio").value.trim();

    const button =
      profileEditor.querySelector("#connectSaveProfile");

    const status =
      profileEditor.querySelector("#connectProfileStatus");

    if (username.length < 3 || username.length > 24) {
      status.textContent =
        "Никнейм должен быть от 3 до 24 символов.";
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      status.textContent =
        "Используй латинские буквы, цифры и _.";
      return;
    }

    if (avatarUrl && !avatarUrl.startsWith("https://")) {
      status.textContent = "Ссылка на аватар должна быть HTTPS.";
      return;
    }

    setButtonLoading(button, true, "Сохраняем...");

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .upsert(
          {
            id: currentUser.id,
            username,
            avatar_url: avatarUrl || null,
            bio,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("username, avatar_url, bio, global_role")
        .single();

      if (error) throw error;

      profileEditor.querySelector("img").src =
        data.avatar_url ||
        "https://placehold.co/200x200/27272a/ffffff?text=Connect";

      status.textContent =
        "Профиль сохранён! Роль: " + (data.global_role || "user");

      if (elements.headerUser) {
        elements.headerUser.textContent = data.username;
      }
    } catch (error) {
      status.textContent =
        error.code === "23505"
          ? "Этот никнейм уже занят."
          : "Ошибка сохранения: " + error.message;
    } finally {
      setButtonLoading(button, false);
    }
  }

  // =========================
  // REGISTER
  // =========================

  if (elements.registerForm) {
    elements.registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      clearMessage(elements.authMessage);

      const email = elements.registerEmail.value.trim();
      const password = elements.registerPassword.value;

      if (password.length < 6) {
        showMessage(
          elements.authMessage,
          "Пароль должен быть минимум 6 символов.",
          "error"
        );
        return;
      }

      setLoading(elements.registerForm, true);

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: REDIRECT_URL,
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          showMessage(
            elements.authMessage,
            "Аккаунт создан! Подтверди Email через письмо.",
            "success"
          );
        } else if (data.session) {
          updateUI(data.user);
          await loadProfile(data.user);

          showMessage(
            elements.authMessage,
            "Добро пожаловать в Connect!",
            "success"
          );
        }

        elements.registerForm.reset();
      } catch (error) {
        showMessage(
          elements.authMessage,
          error.message || "Ошибка регистрации.",
          "error"
        );
      } finally {
        setLoading(elements.registerForm, false);
      }
    });
  }

  // =========================
  // LOGIN
  // =========================

  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      clearMessage(elements.authMessage);

      const email = elements.loginEmail.value.trim();
      const password = elements.loginPassword.value;

      setLoading(elements.loginForm, true);

      try {
        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        updateUI(data.user);
        await loadProfile(data.user);
        await loadGroups();

        showMessage(
          elements.authMessage,
          "С возвращением в Connect!",
          "success"
        );

        elements.loginForm.reset();
      } catch (error) {
        showMessage(
          elements.authMessage,
          error.message || "Ошибка входа.",
          "error"
        );
      } finally {
        setLoading(elements.loginForm, false);
      }
    });
  }

  // =========================
  // PASSWORD RECOVERY
  // =========================

  if (elements.forgotPasswordButton) {
    elements.forgotPasswordButton.addEventListener("click", () => {
      if (elements.resetPasswordForm) {
        elements.resetPasswordForm.hidden = false;
      }

      if (elements.loginForm) {
        elements.loginForm.hidden = true;
      }

      clearMessage(elements.authMessage);
    });
  }

  if (elements.cancelResetPassword) {
    elements.cancelResetPassword.addEventListener("click", () => {
      elements.resetPasswordForm.hidden = true;
      elements.loginForm.hidden = false;

      clearMessage(elements.authMessage);
    });
  }

  if (elements.resetPasswordForm) {
    elements.resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = elements.resetPasswordEmail.value.trim();

      setLoading(elements.resetPasswordForm, true);

      try {
        const { error } =
          await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: REDIRECT_URL,
          });

        if (error) throw error;

        showMessage(
          elements.authMessage,
          "Если аккаунт существует, письмо для восстановления отправлено. Проверь почту.",
          "success"
        );

        elements.resetPasswordForm.reset();
      } catch (error) {
        showMessage(
          elements.authMessage,
          error.message || "Не удалось отправить письмо.",
          "error"
        );
      } finally {
        setLoading(elements.resetPasswordForm, false);
      }
    });
  }

  // Форма установки нового пароля после перехода из письма
  function showNewPasswordForm() {
    if ($("connectNewPasswordForm")) return;

    const form = document.createElement("form");
    form.id = "connectNewPasswordForm";
    form.className = "auth-form";

    const heading = document.createElement("h3");
    heading.textContent = "Установить новый пароль";

    const label = document.createElement("label");
    label.textContent = "Новый пароль";
    label.htmlFor = "connectNewPassword";

    const input = document.createElement("input");
    input.id = "connectNewPassword";
    input.type = "password";
    input.minLength = 6;
    input.autocomplete = "new-password";
    input.required;
    input.placeholder = "Минимум 6 символов";

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "primary-button";
    button.textContent = "Сохранить новый пароль";

    form.append(heading, label, input, button);
    elements.authBox.appendChild(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const password = input.value;

      if (password.length < 6) {
        showMessage(
          elements.authMessage,
          "Пароль должен быть минимум 6 символов.",
          "error"
        );
        return;
      }

      setLoading(form, true);

      try {
        const { error } = await supabaseClient.auth.updateUser({
          password,
        });

        if (error) throw error;

        showMessage(
          elements.authMessage,
          "Пароль успешно изменён! Теперь можешь войти.",
          "success"
        );

        form.remove();

        await supabaseClient.auth.signOut();
        updateUI(null);
      } catch (error) {
        showMessage(
          elements.authMessage,
          error.message || "Ошибка изменения пароля.",
          "error"
        );
      } finally {
        setLoading(form, false);
      }
    });
  }

  // =========================
  // LOGOUT
  // =========================

  if (elements.logoutButton) {
    elements.logoutButton.addEventListener("click", async () => {
      elements.logoutButton.disabled = true;

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        updateUI(null);

        showMessage(
          elements.authMessage,
          "Ты вышел из аккаунта.",
          "success"
        );
      } catch (error) {
        showMessage(
          elements.authMessage,
          error.message || "Ошибка выхода.",
          "error"
        );
      } finally {
        elements.logoutButton.disabled = false;
      }
    });
  }

  // =========================
  // GROUPS
  // =========================

  function makeGroupCard(group, isMember, myRole) {
    const card = document.createElement("article");
    card.className = "post";
    card.style.cssText = `
      margin-bottom:16px;
      padding:20px;
      border-radius:16px;
    `;

    const avatar = document.createElement("img");
    avatar.alt = "Аватар группы";
    avatar.src =
      group.avatar_url ||
      "https://placehold.co/100x100/27272a/ffffff?text=Group";

    avatar.style.cssText = `
      width:64px;height:64px;border-radius:16px;
      object-fit:cover;margin-bottom:12px;
    `;

    const title = document.createElement("h3");
    title.textContent = group.name;

    const description = document.createElement("p");
    description.textContent =
      group.description || "Описание отсутствует.";

    const info = document.createElement("p");
    info.style.fontSize = "13px";
    info.style.opacity = "0.7";
    info.textContent =
      myRole === "owner"
        ? "👑 Ты создатель этой группы"
        : isMember
          ? "Ты участник группы"
          : "Открытая группа Connect";

    const button = document.createElement("button");
    button.className = isMember
      ? "secondary-button"
      : "primary-button";

    button.textContent = isMember
      ? myRole === "owner"
        ? "Создатель"
        : "Выйти из группы"
      : "Вступить";

    button.disabled = myRole === "owner";

    if (!button.disabled) {
      button.addEventListener("click", async () => {
        await toggleGroupMembership(group.id, isMember, button);
      });
    }

    card.append(avatar, title, description, info, button);

    return card;
  }

  async function loadGroups() {
    if (!currentUser || !supabaseClient || !elements.groupsList) {
      return;
    }

    elements.groupsList.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Загружаем группы...";
    elements.groupsList.appendChild(loading);

    try {
      const { data: groups, error } = await supabaseClient
        .from("groups")
        .select("id, name, description, avatar_url, created_by, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: memberships, error: membershipError } =
        await supabaseClient
          .from("group_members")
          .select("group_id, group_role")
          .eq("user_id", currentUser.id);

      if (membershipError) throw membershipError;

      const membershipMap = new Map(
        (memberships || []).map((membership) => [
          membership.group_id,
          membership.group_role,
        ])
      );

      elements.groupsList.replaceChildren();

      if (!groups || groups.length === 0) {
        const empty = document.createElement("p");
        empty.textContent =
          "Пока нет групп. Создай первую группу Connect!";
        elements.groupsList.appendChild(empty);
        return;
      }

      groups.forEach((group) => {
        const role = membershipMap.get(group.id);

        elements.groupsList.appendChild(
          makeGroupCard(group, Boolean(role), role)
        );
      });
    } catch (error) {
      elements.groupsList.replaceChildren();

      const message = document.createElement("p");
      message.textContent =
        "Ошибка загрузки групп: " + error.message;

      elements.groupsList.appendChild(message);
    }
  }

  async function toggleGroupMembership(groupId, isMember, button) {
    if (!currentUser) return;

    setButtonLoading(button, true, "Подожди...");

    try {
      if (isMember) {
        const { error } = await supabaseClient
          .from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        showMessage(
          elements.groupMessage,
          "Ты вышел из группы.",
          "success"
        );
      } else {
        const { error } = await supabaseClient
          .from("group_members")
          .insert({
            group_id: groupId,
            user_id: currentUser.id,
            group_role: "member",
          });

        if (error) throw error;

        showMessage(
          elements.groupMessage,
          "Ты вступил в группу!",
          "success"
        );
      }

      await loadGroups();
    } catch (error) {
      showMessage(
        elements.groupMessage,
        error.message || "Ошибка изменения участия.",
        "error"
      );
    } finally {
      setButtonLoading(button, false);
    }
  }

  if (elements.createGroupForm) {
    elements.createGroupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!currentUser) {
        showMessage(
          elements.groupMessage,
          "Войди в аккаунт, чтобы создавать группы.",
          "error"
        );
        return;
      }

      const name = elements.groupName.value.trim();
      const description =
        elements.groupDescription.value.trim();

      const avatarUrl =
        elements.groupAvatar.value.trim();

      if (name.length < 3 || name.length > 50) {
        showMessage(
          elements.groupMessage,
          "Название группы должно быть от 3 до 50 символов.",
          "error"
        );
        return;
      }

      if (description.length > 500) {
        showMessage(
          elements.groupMessage,
          "Описание не должно превышать 500 символов.",
          "error"
        );
        return;
      }

      if (avatarUrl && !avatarUrl.startsWith("https://")) {
        showMessage(
          elements.groupMessage,
          "Ссылка на аватар должна начинаться с https://",
          "error"
        );
        return;
      }

      setLoading(elements.createGroupForm, true);

      try {
        const { error } = await supabaseClient
          .from("groups")
          .insert({
            name,
            description,
            avatar_url: avatarUrl || null,
            created_by: currentUser.id,
          });

        if (error) throw error;

        elements.createGroupForm.reset();

        showMessage(
          elements.groupMessage,
          "Группа создана! Ты автоматически стал её владельцем.",
          "success"
        );

        await loadGroups();
      } catch (error) {
        showMessage(
          elements.groupMessage,
          "Ошибка создания группы: " + error.message,
          "error"
        );
      } finally {
        setLoading(elements.createGroupForm, false);
      }
    });
  }

  // =========================
  // POST CHARACTER COUNTER
  // =========================

  if (elements.postContent && elements.postCharCount) {
    elements.postContent.addEventListener("input", () => {
      elements.postCharCount.textContent =
        elements.postContent.value.length + " / 2000";
    });
  }

  // =========================
  // PASSWORD RECOVERY EVENT
  // =========================

  async function initializeAuth() {
    if (!supabaseClient) {
      showMessage(
        elements.authMessage,
        "Supabase не подключён. Проверь supabase.js.",
        "error"
      );
      return;
    }

    const { data, error } = await supabaseClient.auth.getUser();

    if (!error && data.user) {
      updateUI(data.user);
      await loadProfile(data.user);
      await loadGroups();
    }

    supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          showNewPasswordForm();
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          updateUI(session.user);

          // Избегаем повторного вызова auth API прямо внутри callback
          setTimeout(() => {
            loadProfile(session.user);
            loadGroups();
          }, 0);
        }

        if (event === "SIGNED_OUT") {
          updateUI(null);
        }
      }
    );
  }

  initializeAuth();
})();
