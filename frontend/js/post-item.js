import { createItem, isAuthenticated } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
    return;
  }

  const postForm = document.getElementById("post-form");

  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Determine if this is a lost or found item form
      const isLostForm = window.location.pathname.includes("lost");
      const type = isLostForm ? "lost" : "found";

      // Get form values
      const itemData = {
        name: document.getElementById("name").value,
        category: document.getElementById("category").value,
        description: document.getElementById("description").value,
        location: document.getElementById("location").value,
        type,
      };

      // Add date and time based on form type
      if (isLostForm) {
        itemData.date = document.getElementById("date-lost").value;
        itemData.time = document.getElementById("time-lost").value;
      } else {
        itemData.date = document.getElementById("date-found").value;
        itemData.time = document.getElementById("time-found").value;
      }

      // Add image if selected
      const imageInput = document.getElementById("image");
      if (imageInput.files.length > 0) {
        itemData.image = imageInput.files[0];
      }

      try {
        await createItem(itemData);
        alert(
          `Item ${type === "lost" ? "lost" : "found"} successfully posted!`
        );
        window.location.href = type === "lost" ? "/lost.html" : "/items.html";
      } catch (error) {
        alert(error.message || "Error posting item. Please try again.");
      }
    });
  }
});
