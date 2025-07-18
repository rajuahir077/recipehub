document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const ingredients = document.getElementById("ingredients").value;
    const instructions = document.getElementById("instructions").value;

    const recipe = { title, ingredients, instructions };

    try {
      const response = await fetch("http://localhost:3000/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipe),
      });

      const result = await response.json();
      alert("Recipe added successfully!");
      form.reset();
    } catch (error) {
      console.error("Error adding recipe:", error);
      alert("Failed to add recipe.");
    }

    /**Added Part */
    function getCategoryTag(category) {
  const categoryClasses = {
    breakfast: "category-breakfast",
    lunch: "category-lunch",
    dinner: "category-dinner",
    dessert: "category-dessert",
    snacks: "category-snacks",
    drinks: "category-drinks"
  };

  const tagClass = categoryClasses[category.toLowerCase()] || "category-default";
  const capitalized = category.charAt(0).toUpperCase() + category.slice(1);

  return `<span class="category-tag ${tagClass}">${capitalized}</span>`;
}


  });
});
