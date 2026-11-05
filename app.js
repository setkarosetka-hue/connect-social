
/* CONNECT SOCIAL NETWORK */

document.addEventListener("DOMContentLoaded", () => {

    // LIKE BUTTONS

    document.querySelectorAll(".like-btn").forEach(button => {

        button.addEventListener("click", () => {

            let count = button.querySelector("span");

            if (!count) {
                count = document.createElement("span");
                count.textContent = "0";
                button.appendChild(count);
            }

            let likes = Number(count.textContent);

            if (button.classList.contains("liked")) {
                likes--;
                button.classList.remove("liked");
                button.innerHTML = `♡ <span>${likes}</span> Лайков`;
            } else {
                likes++;
                button.classList.add("liked");
                button.innerHTML = `♥ <span>${likes}</span> Лайков`;
            }

        });

    });

    // CREATE POST

    const publishButton = document.getElementById("publishBtn");
    const postInput = document.getElementById("postInput");
    const postsContainer = document.getElementById("posts");

    if (publishButton && postInput && postsContainer) {

        publishButton.addEventListener("click", () => {

            const text = postInput.value.trim();

            if (text.length === 0) {
                alert("Напиши что-нибудь перед публикацией!");
                return;
            }

            if (text.length > 2000) {
                alert("Максимальная длина поста — 2000 символов.");
                return;
            }

            const post = document.createElement("article");
            post.className = "post";

            const title = document.createElement("h3");
            title.textContent = "Ты 👤";

            const paragraph = document.createElement("p");
            paragraph.textContent = text;

            const likeButton = document.createElement("button");
            likeButton.className = "like-btn";
            likeButton.innerHTML = "♡ <span>0</span> Лайков";

            likeButton.addEventListener("click", () => {

                let count = likeButton.querySelector("span");
                let likes = Number(count.textContent);

                if (likeButton.classList.contains("liked")) {
                    likes--;
                    likeButton.classList.remove("liked");
                    likeButton.innerHTML = `♡ <span>${likes}</span> Лайков`;
                } else {
                    likes++;
                    likeButton.classList.add("liked");
                    likeButton.innerHTML = `♥ <span>${likes}</span> Лайков`;
                }

            });

            post.appendChild(title);
            post.appendChild(paragraph);
            post.appendChild(likeButton);

            postsContainer.prepend(post);

            postInput.value = "";

        });

    }

});
