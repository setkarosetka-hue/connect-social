
(function () {
    if (window.__connectAppInitialized) return;
    window.__connectAppInitialized = true;

    const supabaseClient = window.connectSupabase;

    if (!supabaseClient) {
        console.error("Connect: Supabase клиент не найден!");
        return;
    }

    const REDIRECT_URL = "https://setkarosetka-hue.github.io/connect-social/";

    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    const authBox = document.getElementById("authBox");
    const profileBox = document.getElementById("profileBox");

    const authMessage = document.getElementById("authMessage");
    const userEmail = document.getElementById("userEmail");
    const headerUser = document.getElementById("headerUser");
    const logoutButton = document.getElementById("logoutButton");

    function showMessage(message, type = "") {
        if (!authMessage) return;

        authMessage.textContent = message;
        authMessage.className = "message " + type;
    }

    function updateUI(user) {
        if (!authBox || !profileBox || !headerUser) return;

        if (user) {
            authBox.hidden = true;
            profileBox.hidden = false;

            if (userEmail) {
                userEmail.textContent = user.email || "Email не указан";
            }

            headerUser.textContent = "👤 " + (user.email || "Пользователь");
        } else {
            authBox.hidden = false;
            profileBox.hidden = true;
            headerUser.textContent = "👤 Гость";
        }
    }

    // Регистрация
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value;

            showMessage("Создаём аккаунт...");

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        emailRedirectTo: REDIRECT_URL
                    }
                });

                if (error) {
                    showMessage(error.message, "error");
                    console.error("Ошибка регистрации:", error);
                    return;
                }

                if (data.session && data.user) {
                    updateUI(data.user);
                    showMessage("Аккаунт создан! 🎉", "success");
                } else {
                    showMessage(
                        "Аккаунт создан! Проверь почту и подтверди Email.",
                        "success"
                    );
                }
            } catch (error) {
                showMessage("Ошибка регистрации: " + error.message, "error");
                console.error(error);
            }
        });
    }

    // Вход
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;

            showMessage("Входим...");

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    showMessage(error.message, "error");
                    console.error("Ошибка входа:", error);
                    return;
                }

                updateUI(data.user);
                showMessage("Добро пожаловать в Connect! 🎉", "success");
            } catch (error) {
                showMessage("Ошибка входа: " + error.message, "error");
                console.error(error);
            }
        });
    }

    // Выход
    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            try {
                const { error } = await supabaseClient.auth.signOut();

                if (error) {
                    showMessage(error.message, "error");
                    return;
                }

                updateUI(null);
                showMessage("Ты вышел из аккаунта.", "success");
            } catch (error) {
                showMessage("Ошибка выхода: " + error.message, "error");
                console.error(error);
            }
        });
    }

    // Проверка пользователя при загрузке
    async function checkUser() {
        try {
            const { data, error } = await supabaseClient.auth.getUser();

            if (error || !data.user) {
                updateUI(null);
            } else {
                updateUI(data.user);
            }
        } catch (error) {
            console.error("Ошибка проверки пользователя:", error);
            updateUI(null);
        }
    }

    // Слежение за авторизацией
    supabaseClient.auth.onAuthStateChange(function (event, session) {
        updateUI(session?.user ?? null);
    });

    checkUser();

    console.log("Connect: приложение успешно запущено!");
})();
