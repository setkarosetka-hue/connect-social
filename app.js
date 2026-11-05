
const supabase = window.connectSupabase;

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const authBox = document.getElementById("authBox");
const profileBox = document.getElementById("profileBox");

const authMessage = document.getElementById("authMessage");
const userEmail = document.getElementById("userEmail");
const headerUser = document.getElementById("headerUser");

const logoutButton = document.getElementById("logoutButton");

// Показать сообщение
function showMessage(message, type = "") {
    authMessage.textContent = message;
    authMessage.className = "message " + type;
}

// Обновить интерфейс
function updateUI(user) {
    if (user) {
        authBox.hidden = true;
        profileBox.hidden = false;

        userEmail.textContent = user.email || "Email не указан";
        headerUser.textContent = "👤 " + (user.email || "Пользователь");
    } else {
        authBox.hidden = false;
        profileBox.hidden = true;

        headerUser.textContent = "👤 Гость";
    }
}

// Регистрация
registerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    const button = registerForm.querySelector("button");

    button.disabled = true;
    button.textContent = "Создаём аккаунт...";

    showMessage("");

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            showMessage("Ошибка регистрации: " + error.message, "error");
            return;
        }

        if (data.session && data.user) {
            updateUI(data.user);
            showMessage("Аккаунт успешно создан! 🎉", "success");
        } else {
            showMessage(
                "Аккаунт создан! Проверь почту и подтверди Email.",
                "success"
            );
        }

        registerForm.reset();

    } catch (error) {
        showMessage("Не удалось подключиться к серверу.", "error");
    } finally {
        button.disabled = false;
        button.textContent = "Зарегистрироваться";
    }
});

// Вход
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const button = loginForm.querySelector("button");

    button.disabled = true;
    button.textContent = "Входим...";

    showMessage("");

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showMessage("Ошибка входа: " + error.message, "error");
            return;
        }

        updateUI(data.user);
        showMessage("Добро пожаловать в Connect! 🎉", "success");

        loginForm.reset();

    } catch (error) {
        showMessage("Не удалось подключиться к серверу.", "error");
    } finally {
        button.disabled = false;
        button.textContent = "Войти в Connect";
    }
});

// Выход
logoutButton.addEventListener("click", async function() {
    logoutButton.disabled = true;
    logoutButton.textContent = "Выходим...";

    const { error } = await supabase.auth.signOut();

    if (error) {
        showMessage("Ошибка выхода: " + error.message, "error");
    } else {
        updateUI(null);
        showMessage("Ты вышел из аккаунта.", "success");
    }

    logoutButton.disabled = false;
    logoutButton.textContent = "Выйти из аккаунта";
});

// Проверить аккаунт при загрузке сайта
async function checkUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        updateUI(null);
    } else {
        updateUI(data.user);
    }
}

// Автоматически обновлять интерфейс при изменении входа
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user ?? null);
});

checkUser();
