const NEWS_API_URL = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';
const PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,cardano,polkadot&vs_currencies=usd&include_24hr_change=true';

const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const newsContainer = document.getElementById('news-container');
const categoriesNav = document.getElementById('categories');
const tickerElement = document.querySelector('.ticker');

let allNews = [];

const categoryIcons = {
    'Blockchain': 'fas fa-link',
    'Bitcoin': 'fab fa-bitcoin',
    'Ethereum': 'fab fa-ethereum',
    'Altcoin': 'fas fa-coins',
    'Trading': 'fas fa-chart-line',
    'Mining': 'fas fa-microchip',
    'ICO': 'fas fa-rocket',
    'Regulation': 'fas fa-gavel',
    'Exchange': 'fas fa-exchange-alt',
    'Wallet': 'fas fa-wallet',
    'ICP': 'fas fa-infinity',
    'Default': 'fas fa-newspaper'
};

async function fetchNews() {
    try {
        const response = await fetch(NEWS_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.Data;
    } catch (error) {
        console.error('Error fetching news:', error);
        throw error;
    }
}

async function fetchPrices() {
    try {
        const response = await fetch(PRICE_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching prices:', error);
        throw error;
    }
}

function updatePriceTicker(prices) {
    let tickerContent = '';
    for (const [coin, data] of Object.entries(prices)) {
        const priceChange = data.usd_24h_change;
        const changeClass = priceChange >= 0 ? 'price-up' : 'price-down';
        const changeIcon = priceChange >= 0 ? '▲' : '▼';
        tickerContent += `<span class="ticker__item ${changeClass}">${coin.toUpperCase()}: $${data.usd.toFixed(2)} ${changeIcon} ${Math.abs(priceChange).toFixed(2)}%</span>`;
    }
    tickerElement.innerHTML = tickerContent;
}

function categorizeNews(news) {
    const categories = {};
    news.forEach(article => {
        article.categories.split('|').forEach(category => {
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(article);
        });
    });
    return categories;
}

function displayCategories(categories) {
    categoriesNav.innerHTML = '<a href="#" data-category="all"><i class="fas fa-globe"></i> All</a>';
    
    // Add ICP category if it exists
    if (categories['ICP']) {
        const icon = categoryIcons['ICP'];
        categoriesNav.innerHTML += `<a href="#" data-category="ICP"><i class="${icon}"></i> ICP</a>`;
    }
    
    // Add other categories
    Object.keys(categories).forEach(category => {
        if (category !== 'ICP') {
            const icon = categoryIcons[category] || categoryIcons['Default'];
            categoriesNav.innerHTML += `<a href="#" data-category="${category}"><i class="${icon}"></i> ${category}</a>`;
        }
    });
}

function displayNews(articles) {
    newsContainer.innerHTML = '';
    articles.forEach(article => {
        const articleElement = document.createElement('article');
        articleElement.innerHTML = `
            <div class="article-image" style="background-image: url('${article.imageurl}')"></div>
            <div class="article-content">
                <h2>${article.title}</h2>
                <p>${article.body.substring(0, 150)}...</p>
                <div class="article-meta">
                    <span class="article-author"><i class="fas fa-user"></i> ${article.source}</span>
                    <span class="article-date"><i class="far fa-clock"></i> ${new Date(article.published_on * 1000).toLocaleString()}</span>
                </div>
                <div class="article-tags">
                    ${article.categories.split('|').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                </div>
                <a href="${article.url}" target="_blank" class="read-more">Read more</a>
            </div>
        `;
        newsContainer.appendChild(articleElement);
    });
}

function filterTodayNews(news) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return news.filter(article => {
        const articleDate = new Date(article.published_on * 1000);
        articleDate.setHours(0, 0, 0, 0);
        return articleDate.getTime() === today.getTime();
    });
}

async function init() {
    try {
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';

        let fetchedNews = await fetchNews();
        allNews = filterTodayNews(fetchedNews);
        
        if (allNews.length === 0) {
            errorElement.textContent = 'No news available for today. Please check back later.';
            errorElement.style.display = 'block';
            loadingElement.style.display = 'none';
            return;
        }

        const categorizedNews = categorizeNews(allNews);
        
        displayCategories(categorizedNews);
        displayNews(allNews);

        categoriesNav.addEventListener('click', (event) => {
            if (event.target.tagName === 'A' || event.target.parentElement.tagName === 'A') {
                event.preventDefault();
                const categoryElement = event.target.tagName === 'A' ? event.target : event.target.parentElement;
                const category = categoryElement.dataset.category;
                
                if (category === 'all') {
                    displayNews(allNews);
                } else {
                    displayNews(categorizedNews[category] || []);
                }
            }
        });

        // Initialize and update price ticker
        const prices = await fetchPrices();
        updatePriceTicker(prices);

        // Update prices every 5 minutes
        setInterval(async () => {
            const updatedPrices = await fetchPrices();
            updatePriceTicker(updatedPrices);
        }, 300000);

        loadingElement.style.display = 'none';
    } catch (error) {
        console.error('Initialization error:', error);
        loadingElement.style.display = 'none';
        errorElement.textContent = 'Failed to load news. Please try again later.';
        errorElement.style.display = 'block';
    }
}

init();
