document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const searchInput = document.getElementById('search-input');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const recipeGrid = document.getElementById('recipe-grid');
    const recipeCount = document.getElementById('recipe-count');
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const filterFavoritesBtn = document.getElementById('filter-favorites');
    const filterTriedBtn = document.getElementById('filter-tried');
    const logoutConfirmModal = document.getElementById('logout-confirm-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');


    const API_URL_RECIPES = 'https://dummyjson.com/recipes';
    let allRecipes = [];
    let debounceTimer;
    
    const currentUsername = localStorage.getItem('currentUsername');

    const getFromStorage = (key) => {
        if (!currentUsername) return [];
        const userSpecificKey = `${currentUsername}_${key}`;
        return JSON.parse(localStorage.getItem(userSpecificKey)) || [];
    };
    const saveToStorage = (key, data) => {
        if (!currentUsername) return;
        const userSpecificKey = `${currentUsername}_${key}`;
        localStorage.setItem(userSpecificKey, JSON.stringify(data));
    };

    let favoriteRecipeIds = getFromStorage('favoriteRecipes');
    let triedRecipeIds = getFromStorage('triedRecipes');
    
    function initialize() {
        setupDarkMode();
        initializeUser();
        fetchAllRecipes();
        setupEventListeners();
    }
    
    function setupDarkMode() {
        const theme = localStorage.getItem('theme') || 'light';
        const applyTheme = (newTheme) => {
            if (newTheme === 'dark') {
                document.body.classList.add('dark-mode');
                themeIcon.textContent = '🌙';
                darkModeToggle.checked = true;
            } else {
                document.body.classList.remove('dark-mode');
                themeIcon.textContent = '☀️';
                darkModeToggle.checked = false;
            }
            localStorage.setItem('theme', newTheme);
        };
        applyTheme(theme);
        darkModeToggle.addEventListener('change', () => {
            const newTheme = darkModeToggle.checked ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    function initializeUser() {
        const userFirstName = localStorage.getItem('userFirstName');
        welcomeMessage.textContent = `Welcome, ${userFirstName}!`;
    }

    async function fetchAllRecipes() {
        showLoading(true);
        try {
            const response = await fetch(`${API_URL_RECIPES}?limit=0`);
            if (!response.ok) throw new Error('Failed to retrieve cook book:(');
            const data = await response.json();
            allRecipes = data.recipes;
            populateCuisineFilter(allRecipes);
            filterAndDisplayRecipes();
        } catch (error) {
            console.error(error);
            recipeGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
        } finally {
            showLoading(false);
        }
    }

    function populateCuisineFilter(recipes) {
        const cuisines = [...new Set(recipes.map(recipe => recipe.cuisine))].sort();
        cuisineFilter.innerHTML = '<option value="">All Cuisines</option>';
        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        });
    }
    
    function displayRecipes(recipes) {
        recipeGrid.innerHTML = '';
        if (recipes.length === 0) {
            recipeGrid.innerHTML = '<p>No recipes match your criteria.</p>';
            recipeCount.textContent = 'Showing 0 recipes';
            return;
        }
        recipes.forEach(recipe => {
            const isFavorite = favoriteRecipeIds.includes(recipe.id);
            const isTried = triedRecipeIds.includes(recipe.id);
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
                    <div class="card-actions">
                        <button class="card-action-btn favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.id}" title="Favorite">
                            ${isFavorite ? '❤️' : '🤍'}
                        </button>
                        <button class="card-action-btn tried-btn ${isTried ? 'active' : ''}" data-id="${recipe.id}" title="Mark as Tried">
                            ${isTried ? '✅' : '☑️'}
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${recipe.name}</h3>
                    <p><b>Cuisine:</b> ${recipe.cuisine} | <b>Difficulty:</b> ${recipe.difficulty}</p>
                    <button class="view-recipe-btn" data-id="${recipe.id}">View Full Recipe</button>
                </div>
            `;
            recipeGrid.appendChild(card);
        });
        recipeCount.textContent = `Showing ${recipes.length} recipes`;
    }

    function filterAndDisplayRecipes() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCuisine = cuisineFilter.value;
        const showFavorites = filterFavoritesBtn.classList.contains('active');
        const showTried = filterTriedBtn.classList.contains('active');
        
        let filteredRecipes = allRecipes.filter(recipe => {
            const matchesSearch = searchTerm === '' || 
                                  recipe.name.toLowerCase().includes(searchTerm) ||
                                  recipe.ingredients.join(' ').toLowerCase().includes(searchTerm);
            const matchesCuisine = selectedCuisine === '' || recipe.cuisine === selectedCuisine;
            const matchesFavorites = !showFavorites || favoriteRecipeIds.includes(recipe.id);
            const matchesTried = !showTried || triedRecipeIds.includes(recipe.id);
            
            return matchesSearch && matchesCuisine && matchesFavorites && matchesTried;
        });
        
        displayRecipes(filteredRecipes);
    }
    
    function toggleFavorite(recipeId, button) {
        const id = Number(recipeId);
        const index = favoriteRecipeIds.indexOf(id);
        if (index > -1) {
            favoriteRecipeIds.splice(index, 1);
            button.classList.remove('active');
            button.innerHTML = '🤍';
        } else {
            favoriteRecipeIds.push(id);
            button.classList.add('active');
            button.innerHTML = '❤️';
        }
        saveToStorage('favoriteRecipes', favoriteRecipeIds);
        if (filterFavoritesBtn.classList.contains('active')) filterAndDisplayRecipes();
    }
    
    function toggleTried(recipeId, button) {
        const id = Number(recipeId);
        const index = triedRecipeIds.indexOf(id);
        if (index > -1) {
            triedRecipeIds.splice(index, 1);
            button.classList.remove('active');
            button.innerHTML = '☑️';
        } else {
            triedRecipeIds.push(id);
            button.classList.add('active');
            button.innerHTML = '✅';
        }
        saveToStorage('triedRecipes', triedRecipeIds);
        if (filterTriedBtn.classList.contains('active')) filterAndDisplayRecipes();
    }

    async function showRecipeDetail(recipeId) {
        showLoading(true);
        modalBody.innerHTML = '';
        try {
            const response = await fetch(`${API_URL_RECIPES}/${recipeId}`);
            if (!response.ok) throw new Error('Failed to load recipe details:(');
            const recipe = await response.json();
            modalBody.innerHTML = `
                <h2>${recipe.name}</h2>
                <img src="${recipe.image}" alt="${recipe.name}" class="modal-img">
                <div class="modal-meta">
                    <span><b>⭐ Rating:</b> ${recipe.rating} (${recipe.reviewCount} reviews)</span>
                    <span><b>🔪 Difficulty:</b> ${recipe.difficulty}</span>
                    <span><b>🌍 Cuisine:</b> ${recipe.cuisine}</span>
                </div>
                <div class="modal-times">
                    <span><b>Prep Time:</b> ${recipe.prepTimeMinutes} mins</span>
                    <span><b>Cook Time:</b> ${recipe.cookTimeMinutes} mins</span>
                </div>
                <h3>Ingredients</h3>
                <ul class="modal-list">${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                <h3>Instructions</h3>
                <ol class="modal-list">${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
            `;
            modal.classList.remove('hidden');
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            showLoading(false);
        }
    }
    
    function setupEventListeners() {
        logoutButton.addEventListener('click', () => {
            logoutConfirmModal.classList.remove('hidden');
        });

        confirmLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userFirstName');
            localStorage.removeItem('userToken');
            localStorage.removeItem('currentUsername');
            window.location.href = 'index.html';
        });

        cancelLogoutBtn.addEventListener('click', () => {
            logoutConfirmModal.classList.add('hidden');
        });


        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterAndDisplayRecipes, 300);
        });

        cuisineFilter.addEventListener('change', filterAndDisplayRecipes);

        filterFavoritesBtn.addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            filterAndDisplayRecipes();
        });
        filterTriedBtn.addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            filterAndDisplayRecipes();
        });

        recipeGrid.addEventListener('click', e => {
            const target = e.target.closest('button');
            if (!target) return;
            
            const recipeId = target.dataset.id;
            if (target.classList.contains('view-recipe-btn')) showRecipeDetail(recipeId);
            if (target.classList.contains('favorite-btn')) toggleFavorite(recipeId, target);
            if (target.classList.contains('tried-btn')) toggleTried(recipeId, target);
        });

        modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    function showLoading(isLoading) {
        loadingIndicator.classList.toggle('hidden', !isLoading);
    }
    
    initialize();
});