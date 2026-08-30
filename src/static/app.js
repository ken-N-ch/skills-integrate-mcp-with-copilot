document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  let allActivities = {};

  function populateActivityOptions(activities) {
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.keys(activities)
      .sort()
      .forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
  }

  function populateCategoryOptions(activities) {
    const categories = [
      ...new Set(Object.values(activities).map((details) => details.category)),
    ].sort();

    categoryFilter.innerHTML = '<option value="all">All categories</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  function getFilteredActivities() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    return Object.entries(allActivities).filter(([name, details]) => {
      const matchesCategory =
        selectedCategory === "all" || details.category === selectedCategory;

      const searchTerms = [
        name,
        details.description,
        details.schedule,
        details.organizer,
        ...(details.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchTerms.includes(query);

      return matchesCategory && matchesSearch;
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();

      populateCategoryOptions(allActivities);
      populateActivityOptions(allActivities);
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities() {
    const filteredActivities = getFilteredActivities();
    activitiesList.innerHTML = "";

    if (filteredActivities.length === 0) {
      activitiesList.innerHTML =
        "<p>No activities match your search. Try a different keyword or category.</p>";
      return;
    }

    filteredActivities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft =
        details.max_participants - details.participants.length;
      const tagsHTML = (details.tags || [])
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("");

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <div class="card-header">
          <h4>${name}</h4>
          <span class="category-pill">${details.category}</span>
        </div>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Organizer:</strong> ${details.organizer}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="tag-list">${tagsHTML}</div>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  searchInput.addEventListener("input", renderActivities);
  categoryFilter.addEventListener("change", renderActivities);

  fetchActivities();
});
