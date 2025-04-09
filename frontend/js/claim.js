// Function to get item's verification questions
async function getVerificationQuestions(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `http://localhost:5000/api/items/${itemId}/questions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return data.questions;
    } else {
      throw new Error(data.message || "Failed to fetch verification questions");
    }
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Function to submit a claim with answers
async function submitClaim(itemId, responses) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `http://localhost:5000/api/items/${itemId}/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responses }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      throw new Error(data.message || "Failed to submit claim");
    }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: error.message };
  }
}

// Function to display the claim form modal
function showClaimModal(itemId, itemName) {
  // Create modal container
  const modal = document.createElement("div");
  modal.className = "claim-modal";
  modal.innerHTML = `
    <div class="claim-modal-content">
      <span class="close">&times;</span>
      <h2>Claim: ${itemName}</h2>
      <p>To verify ownership, please answer the following questions:</p>
      <div id="questions-container">Loading questions...</div>
      <button id="submit-claim-btn" disabled>Submit Claim</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal on clicking X
  modal.querySelector(".close").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Load and display questions
  getVerificationQuestions(itemId).then((questions) => {
    const questionsContainer = modal.querySelector("#questions-container");

    if (!questions || questions.length === 0) {
      questionsContainer.innerHTML =
        "No verification questions available for this item.";
      return;
    }

    // Create form elements for each question
    questionsContainer.innerHTML = "";
    questions.forEach((q, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "question";
      questionDiv.innerHTML = `
        <label for="answer-${q.id}">${index + 1}. ${q.question}</label>
        <input type="text" id="answer-${
          q.id
        }" class="answer-input" data-question-id="${q.id}" required>
      `;
      questionsContainer.appendChild(questionDiv);
    });

    // Enable submit button
    const submitBtn = modal.querySelector("#submit-claim-btn");
    submitBtn.disabled = false;

    // Handle form submission
    submitBtn.addEventListener("click", async () => {
      const answers = Array.from(modal.querySelectorAll(".answer-input")).map(
        (input) => ({
          questionId: input.dataset.questionId,
          response: input.value.trim(),
        })
      );

      // Validate answers
      const emptyAnswers = answers.some((a) => !a.response);
      if (emptyAnswers) {
        alert("Please answer all questions.");
        return;
      }

      // Submit claim
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const result = await submitClaim(itemId, answers);

      if (result.success) {
        alert(result.message);
        document.body.removeChild(modal);
      } else {
        alert(result.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Claim";
      }
    });
  });
}

// Function to start claim process when user clicks "Claim" button
function startClaimProcess(itemId, itemName) {
  showClaimModal(itemId, itemName);
}
