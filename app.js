
const SUPABASE_URL = "https://hnoihvskvrrsexmlelkb.supabase.co";

const SUPABASE_KEY = "sb_publishable_wHaB1q0aObePTLAo7yxwaQ_96IhnTm1";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const authBox = document.getElementById("authBox");
const profileBox = document.getElementById("profileBox");

const authMessage = document.getElementById("authMessage");
const userEmail = document.getElementById("userEmail");
const headerUser = document.getElementById("headerUser");

const logoutButton = document.getElementById("logoutButton");

// Сообщение
function showMessage(message) {
    authMessage.textContent = message;
}

// Обновление интерфейса
function updateUI(user) {
    if (user) {
        authBox.hidden = true;
        profileBox.hidden = false;

        userEmail.textContent = "Email: " + user.email;
        headerUser.textContent = "👤 " + user.email;
    } else {
        authBox.hidden = false;
        profileBox.hidden = true;

        headerUser.textContent = "👤";
    }
}

// Регистрация
registerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    showMessage("Создаём аккаунт...");

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        showMessage("Ошибка: " + error.message);
        return;
    }

    if (data.session) {
        updateUI(data.user);
        showMessage("Аккаунт успешно создан!");
    } else {
        showMessage(
            "Аккаунт создан! Проверь почту и подтверди Email."
        );
    }
});

// Вход
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    showMessage("Входим в аккаунт...");

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showMessage("Ошибка входа: " + error.message);
        return;
    }

    updateUI(data.user);
    showMessage("Добро пожаловать в Connect!");
});

// Выход
logoutButton.addEventListener("click", async function() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        showMessage("Ошибка выхода: " + error.message);
        return;
    }

    updateUI(null);
});

// Проверка текущего аккаунта
async function checkUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        updateUI(null);
    } else {
        updateUI(data.user);
    }
}

// Отслеживание авторизации
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user ?? null);
});

checkUser();
