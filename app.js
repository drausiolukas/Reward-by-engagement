// ============================================
//  GLAM STARTS SEMANA - App Logic
//  Teachable Machine Image Classification
// ============================================

// ---- Configuration ----
const MODEL_URL = "./my_model/";

// Product metadata for each class (keys must match Teachable Machine class names exactly)
const PRODUCT_INFO = {
    "Escova Para Cabelo Térmica Lanossi Ceramic Yellow": {
        image: "./escova/escova-capelli-grande-1-300x300.jpg",
        name: "Escova Térmica Lanossi",
        description: "Escova para cabelo térmica Lanossi Ceramic Yellow. Ideal para modelar e dar volume aos cabelos."
    },
    "Pó Facial Retinol Payot Translúcido Iluminador 20g": {
        image: "./Paio/161979-800-450.png",
        name: "Pó Facial Payot",
        description: "Pó Facial Retinol Payot Translúcido Iluminador 20g. Perfeito para fixar a maquiagem com acabamento luminoso."
    },
    "Leave-in Tigi Bed Head Small Talk 240ml": {
        image: "./leavin/download.jpg",
        name: "Leave-in Tigi Bed Head",
        description: "Leave-in Tigi Bed Head Small Talk 240ml. Creme finalizador para hidratar, proteger e dar brilho aos cabelos."
    }
};

// Fallback for unknown classes
const DEFAULT_PRODUCT = {
    image: "",
    name: "Produto",
    description: "Aponte a câmera para um produto de beleza para identificá-lo."
};

// ---- State ----
let model, webcam, labelContainer, maxPredictions;
let isRunning = false;
let alertCooldown = false; // Prevents repeated alerts

// ---- UI Helpers ----
function setStatus(text, state = "") {
    const card = document.getElementById("status-card");
    const statusText = document.getElementById("status-text");
    const statusIcon = document.getElementById("status-icon");

    card.className = "status-card " + state;
    statusText.textContent = text;

    if (state === "loading") {
        statusIcon.innerHTML = '<div class="spinner"></div>';
    } else if (state === "active") {
        statusIcon.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>`;
    } else {
        statusIcon.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
            </svg>`;
    }
}

function showElement(id) {
    document.getElementById(id).style.display = "";
}

function hideElement(id) {
    document.getElementById(id).style.display = "none";
}

function getProductInfo(className) {
    // Try exact match first, then case-insensitive
    if (PRODUCT_INFO[className]) return PRODUCT_INFO[className];

    const key = Object.keys(PRODUCT_INFO).find(
        k => k.toLowerCase() === className.toLowerCase()
    );
    return key ? PRODUCT_INFO[key] : { ...DEFAULT_PRODUCT, name: className };
}

// ---- Background Particles ----
function createParticles() {
    const container = document.getElementById("bg-particles");
    const colors = ["#e879f9", "#a855f7", "#f59e0b", "#34d399", "#fb7185"];

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");
        const size = Math.random() * 4 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 15 + 10}s;
            animation-delay: ${Math.random() * 10}s;
        `;
        container.appendChild(particle);
    }
}

// ---- Core ML Functions ----

/**
 * Ensures the model is loaded
 */
async function loadModel() {
    if (model) return;
    
    setStatus("Carregando modelo de IA...", "loading");
    try {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        prepareUI();
    } catch (error) {
        console.error("Erro ao carregar modelo:", error);
        setStatus("Erro ao carregar modelo: " + error.message, "");
        throw error;
    }
}

/**
 * Prepares the predictions UI list
 */
function prepareUI() {
    labelContainer = document.getElementById("label-container");
    if (labelContainer.children.length > 0) return; // Already prepared
    
    labelContainer.innerHTML = "";
    const classLabels = model.getClassLabels();
    
    for (let i = 0; i < maxPredictions; i++) {
        const className = classLabels[i] || `Classe ${i + 1}`;
        const info = getProductInfo(className);

        const item = document.createElement("div");
        item.className = "prediction-item";
        item.dataset.index = i;

        const imgTag = info.image
            ? `<img src="${info.image}" alt="${info.name}" class="prediction-thumb">`
            : `<span style="font-size:1.2rem;">🔍</span>`;

        item.innerHTML = `
            <div class="prediction-icon">${imgTag}</div>
            <div class="prediction-info">
                <div class="prediction-name">${info.name}</div>
                <div class="prediction-bar-bg">
                    <div class="prediction-bar" style="width: 0%"></div>
                </div>
            </div>
            <span class="prediction-value">0%</span>
        `;
        labelContainer.appendChild(item);
    }
    showElement("predictions-wrapper");
    showElement("product-info-section");
}

/**
 * Initialize the webcam
 */
async function init() {
    if (isRunning) return;

    const btn = document.getElementById("start-btn");
    btn.disabled = true;
    btn.querySelector(".btn-text").textContent = "Iniciando...";
    setStatus("Ligando câmera...", "loading");

    try {
        await loadModel();

        // Setup webcam
        const flip = true;
        webcam = new tmImage.Webcam(280, 280, flip);
        await webcam.setup();
        await webcam.play();

        isRunning = true;
        hideElement("image-preview-wrapper");
        showElement("webcam-wrapper");
        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        btn.querySelector(".btn-text").textContent = "Câmera Ativa";
        setStatus("Analisando em tempo real...", "active");

        window.requestAnimationFrame(loop);
    } catch (error) {
        btn.disabled = false;
        btn.querySelector(".btn-text").textContent = "Câmera";
        setStatus("Erro: " + error.message, "");
    }
}

/**
 * Handles image file upload
 */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Loading UI
    setStatus("Processando foto...", "loading");
    
    try {
        await loadModel();
        
        // Stop webcam if running
        if (webcam && isRunning) {
            isRunning = false;
            webcam.stop();
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
            const img = document.getElementById("uploaded-image");
            img.src = e.target.result;
            
            // Wait for image to load to predict
            img.onload = async () => {
                hideElement("webcam-wrapper");
                showElement("image-preview-wrapper");
                await predict(img, true); // true for isPhoto
                setStatus("Foto analisada!", "active");
            };
        };
        reader.readAsDataURL(file);
    } catch (error) {
        setStatus("Erro no upload: " + error.message, "");
    }
}

/**
 * Main animation loop
 */
async function loop() {
    if (!isRunning) return;
    webcam.update();
    await predict(webcam.canvas, false); // false for isPhoto (real-time)
    window.requestAnimationFrame(loop);
}

/**
 * Run prediction on a source (canvas or image)
 */
async function predict(source, isPhoto) {
    const prediction = await model.predict(source);

    // Find top prediction
    let topIndex = 0;
    let topProb = 0;
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > topProb) {
            topProb = prediction[i].probability;
            topIndex = i;
        }
    }

    // Update each prediction row
    for (let i = 0; i < maxPredictions; i++) {
        const prob = prediction[i].probability;
        const percent = (prob * 100).toFixed(1);
        const className = prediction[i].className;
        const info = getProductInfo(className);

        const item = labelContainer.children[i];
        if (!item) continue;
        
        item.className = "prediction-item" + (i === topIndex ? " top-prediction" : "");

        const thumb = item.querySelector(".prediction-thumb");
        if (thumb && info.image) {
            thumb.src = info.image;
        }
        item.querySelector(".prediction-name").textContent = info.name;
        item.querySelector(".prediction-bar").style.width = percent + "%";
        item.querySelector(".prediction-value").textContent = percent + "%";
    }

    // Update product info card with top prediction
    const topInfo = getProductInfo(prediction[topIndex].className);
    const productEmojiEl = document.getElementById("product-emoji");
    if (topInfo.image) {
        productEmojiEl.innerHTML = `<img src="${topInfo.image}" alt="${topInfo.name}" class="product-thumb-lg">`;
    } else {
        productEmojiEl.textContent = "🔍";
    }
    document.getElementById("product-name").textContent = topInfo.name;
    document.getElementById("product-description").textContent = topInfo.description;
    document.getElementById("confidence-value").textContent = (topProb * 100).toFixed(1) + "%";

    // 🎉 Alert Logic
    // Threshold: 90% for photos, 99% for webcam (as per user's previous manual edit)
    const threshold = isPhoto ? 0.90 : 0.99;
    
    if (topProb >= threshold && !alertCooldown) {
        alertCooldown = true;
        alert(`🎉 Você ganhou 50 Glam Points por engajar com o produto ${topInfo.name}!`);
        // Cooldown of 10 seconds to avoid repeated alerts
        setTimeout(() => { alertCooldown = false; }, 10000);
    }
}

// ---- Initialize Particles on Load ----
document.addEventListener("DOMContentLoaded", () => {
    createParticles();
});
