
const supabase = window.connectSupabase;

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const authBox = document.getElementById("authBox");
const profileBox = document.getElementById("profileBox");

const authMessage = document.getElementById("authMessage");
const userEmail = document.getElementById("userEmail");
const headerUser = document.getElementById("headerUser");
const logoutButton = document.getElementById("logoutButton");

function showMessage(message, type = "") {
    authMessage.textContent = message;
    authMessage.className = "message " + type;
}

function updateUI(user) {
    if (user) {
        authBox.hidden = true;
        profileBox.hidden = false;
        userEmail.textContent = user.email || "Email не указан";
        headerUser.textContent = "👤 " + user.email;
    } else {
        authBox.hidden = false;
        profileBox.hidden = true;
        headerUser.textContent = "👤 Гость";
    }
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    showMessage("Создаём аккаунт...");

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    if (data.session) {
        updateUI(data.user);
        showMessage("Аккаунт создан! 🎉", "success");
    } else {
        showMessage("Проверь почту для подтверждения Email.", "success");
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    showMessage("Входим...");

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    updateUI(data.user);
    showMessage("Добро пожаловать в Connect! 🎉", "success");
});

logoutButton.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    updateUI(null);
    showMessage("Ты вышел из аккаунта.", "success");
});

async function checkUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        updateUI(null);
    } else {
        updateUI(data.user);
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user ?? null);
});

checkUser();
