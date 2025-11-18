/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Array to keep track of selected products */
let selectedProducts = [];

/* Array to store the conversation history for context */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful beauty consultant for L'Oréal products. Provide skincare, haircare, makeup, and beauty advice. Answer questions about routines, products, and beauty tips.",
  },
];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Show initial placeholder for selected products */
selectedProductsList.innerHTML = `
  <div class="placeholder-message">
    Drag products here to build your routine
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" draggable="true" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-tooltip">${product.description}</div>
    </div>
  `
    )
    .join("");

  // Add drag event listeners to each product card
  const productCards = document.querySelectorAll(
    "#productsContainer .product-card"
  );
  productCards.forEach((card) => {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);

    // Add click event to toggle tooltip visibility on mobile/touch devices
    card.addEventListener("click", (e) => {
      // Don't toggle if we're dragging
      if (e.target.classList.contains("dragging")) return;

      const tooltip = card.querySelector(".product-tooltip");
      tooltip.classList.toggle("show-tooltip");
    });
  });

  // Restore selected state - hide cards that are already selected
  updateSelectedProductsDisplay();
}

/* Handle when user starts dragging a product card */
function handleDragStart(e) {
  // Get the product ID from the card's data attribute
  const productId = e.target.getAttribute("data-product-id");

  // Log to help debug
  console.log("Dragging product ID:", productId);

  // Store the product ID being dragged
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", productId);

  // Add visual feedback - make the card semi-transparent
  e.target.classList.add("dragging");
}

/* Handle when user stops dragging */
function handleDragEnd(e) {
  // Remove visual feedback
  e.target.classList.remove("dragging");
}

/* Handle when dragged item is over the drop zone */
function handleDragOver(e) {
  // Prevent default to allow drop
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  // Add visual feedback to the drop zone
  e.currentTarget.classList.add("drag-over");
}

/* Handle when dragged item leaves the drop zone */
function handleDragLeave(e) {
  // Remove visual feedback
  e.currentTarget.classList.remove("drag-over");
}

/* Handle when item is dropped into selected products */
async function handleDrop(e) {
  e.preventDefault();

  // Remove visual feedback
  e.currentTarget.classList.remove("drag-over");

  // Get the product ID that was dropped from the drag data
  const productId = e.dataTransfer.getData("text/plain");

  // Log to help debug
  console.log("Dropped product ID:", productId);
  console.log("Current selected products:", selectedProducts);

  // Load all products to find the dropped product
  const allProducts = await loadProducts();
  console.log("All products loaded:", allProducts.length);

  // Find the product by matching the ID
  const product = allProducts.find((p) => String(p.id) === String(productId));

  console.log("Found product:", product);

  if (product) {
    // Check if product is already selected
    const isAlreadySelected = selectedProducts.some(
      (p) => String(p.id) === String(productId)
    );

    if (!isAlreadySelected) {
      // Add the product to selected products array
      selectedProducts.push(product);

      console.log("Product added. Selected products:", selectedProducts);

      // Update the display to show product in selected section and hide from main grid
      updateSelectedProductsDisplay();
    } else {
      console.log("Product already selected");
    }
  } else {
    console.log("Product not found in products list");
  }
}

/* Update the selected products list section */
function updateSelectedProductsDisplay() {
  console.log("Updating display. Selected products:", selectedProducts);

  // Hide selected products from the main grid
  const allCards = document.querySelectorAll(
    "#productsContainer .product-card"
  );

  console.log("Product cards in main grid:", allCards.length);

  allCards.forEach((card) => {
    const cardId = card.getAttribute("data-product-id");
    const isSelected = selectedProducts.some(
      (p) => String(p.id) === String(cardId)
    );

    // Hide the card if it's selected, show it if not
    if (isSelected) {
      card.style.display = "none";
      console.log("Hiding card:", cardId);
    } else {
      card.style.display = "flex";
    }
  });

  // Display selected products in the selected products section
  if (selectedProducts.length === 0) {
    // Show a message when no products are selected
    selectedProductsList.innerHTML =
      '<div class="placeholder-message">Drag products here to build your routine</div>';
  } else {
    console.log("Rendering selected products:", selectedProducts);

    // Display all selected products as cards with remove buttons and tooltips
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product) => `
        <div class="product-card selected" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
          <button class="remove-btn" aria-label="Remove ${product.name}">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="product-tooltip">${product.description}</div>
        </div>
      `
      )
      .join("");

    // Add click event to selected product cards
    const selectedCards =
      selectedProductsList.querySelectorAll(".product-card");
    selectedCards.forEach((card) => {
      // Add click handler for the card (but not when clicking remove button)
      card.addEventListener("click", (e) => {
        // If clicking the remove button, don't show tooltip - just remove
        if (e.target.closest(".remove-btn")) {
          return;
        }

        // Toggle tooltip visibility
        const tooltip = card.querySelector(".product-tooltip");
        tooltip.classList.toggle("show-tooltip");
      });
    });

    // Add specific click event to remove buttons
    const removeButtons = selectedProductsList.querySelectorAll(".remove-btn");
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Stop event bubbling so it doesn't trigger card click
        e.stopPropagation();

        // Get the product ID from the parent card
        const card = e.target.closest(".product-card");
        const productId = card.getAttribute("data-product-id");
        removeProduct(productId);
      });
    });
  }
}

/* Remove a product from the selected list */
function removeProduct(productId) {
  console.log("Removing product:", productId);

  // Remove the product from the selected products array
  selectedProducts = selectedProducts.filter(
    (p) => String(p.id) !== String(productId)
  );

  console.log("Selected products after removal:", selectedProducts);

  // Update the display - this will show the product back in the category list
  updateSelectedProductsDisplay();
}

/* Send message to OpenAI via Cloudflare Worker */
async function getAIResponse(userMessage) {
  try {
    // Add the user's message to conversation history
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // Send POST request to Cloudflare Worker with full conversation history
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory, // Send the entire conversation
      }),
    });

    // Parse the JSON response from the API
    const data = await response.json();

    // Extract the AI's message from the response
    const aiMessage = data.choices[0].message.content;

    // Add the AI's response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiMessage,
    });

    return aiMessage;
  } catch (error) {
    // If something goes wrong, return an error message
    console.error("Error calling OpenAI:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

/* Display the full conversation in the chat window with bubble styling */
function displayConversation() {
  // Filter out the system message and display user/assistant messages
  const messages = conversationHistory
    .filter((msg) => msg.role !== "system")
    .map((msg) => {
      const isUser = msg.role === "user";
      const label = isUser ? "You" : "AI Beauty Consultant";
      const messageClass = isUser ? "user" : "ai";

      // Format the message content for better readability
      const formattedContent = formatMessageContent(msg.content);

      return `
        <div class="chat-message ${messageClass}">
          <div>
            <div class="message-label">${label}</div>
            <div class="message-bubble">${formattedContent}</div>
          </div>
        </div>
      `;
    })
    .join("");

  chatWindow.innerHTML = messages;

  // Scroll to the bottom to show the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Format message content for better readability */
function formatMessageContent(content) {
  // Replace numbered lists with proper formatting
  content = content.replace(/(\d+)\.\s+/g, "<br><strong>$1.</strong> ");

  // Replace bullet points
  content = content.replace(/•\s+/g, "<br>• ");
  content = content.replace(/\*\s+/g, "<br>• ");

  // Add line breaks before common section headers
  content = content.replace(
    /(Morning Routine|Evening Routine|Step \d+|Application|Benefits|Tips|Important)/gi,
    "<br><br><strong>$1</strong>"
  );

  // Add line breaks after periods followed by capital letters (new sentences)
  content = content.replace(/\.\s+([A-Z])/g, ".<br><br>$1");

  // Replace double line breaks with proper spacing
  content = content.replace(/\n\n/g, "<br><br>");
  content = content.replace(/\n/g, "<br>");

  // Trim any leading/trailing breaks
  content = content.trim();

  return content;
}

/* Show typing indicator while waiting for AI response */
function showTypingIndicator() {
  const typingHTML = `
    <div class="chat-message ai">
      <div>
        <div class="message-label">AI Beauty Consultant</div>
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  chatWindow.innerHTML += typingHTML;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Chat form submission handler - now connected to OpenAI */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's input from the form
  const userInput = chatForm.querySelector("input").value;

  // Don't send empty messages
  if (!userInput.trim()) return;

  // Add user's message to the display immediately
  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  // Display the conversation
  displayConversation();

  // Show typing indicator
  showTypingIndicator();

  // Clear the input field
  chatForm.reset();

  // Remove the user message we just added (getAIResponse will add it back)
  conversationHistory.pop();

  // Get response from OpenAI (this will add both user and AI messages to history)
  await getAIResponse(userInput);

  // Display the updated conversation
  displayConversation();
});

/* Set up drop zone for selected products area */
selectedProductsList.addEventListener("dragover", handleDragOver);
selectedProductsList.addEventListener("dragleave", handleDragLeave);
selectedProductsList.addEventListener("drop", handleDrop);

/* Generate routine button handler */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      '<div class="placeholder-message">Please select some products first! 💄✨</div>';
    return;
  }

  // Create detailed product information for the AI
  const productDetails = selectedProducts
    .map((p) => {
      return `- ${p.brand} ${p.name} (${p.category}): ${p.description}`;
    })
    .join("\n");

  // Create a comprehensive prompt with all product details
  const promptMessage = `I've selected these L'Oréal products for my routine:

${productDetails}

Can you help me create a personalized skincare/beauty routine using these products? Please:
1. Explain the correct order to use them (morning and/or evening)
2. Describe how to apply each product
3. Mention any important tips or precautions
4. Explain the benefits of this routine

Please only use the products I've selected above.`;

  // Add the routine request to conversation history
  conversationHistory.push({
    role: "user",
    content: "✨ Generate my personalized routine",
  });

  // Display the conversation with typing indicator
  displayConversation();
  showTypingIndicator();

  // Remove the simple message and replace with detailed prompt
  conversationHistory.pop();

  // Get AI response with detailed product information
  await getAIResponse(promptMessage);

  // Display the full conversation including the routine
  displayConversation();
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});
