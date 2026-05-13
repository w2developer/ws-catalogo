const productSection = document.querySelector('.section.product');

const iphoneProducts = [
    {
        badge: "Novo",
        badgeColor: "#10b981",
        imgSrc: "./assets/images-catalogo/teste1.jpeg",
        title: "iPhone 15 Pro",
        desc: "Titânio natural, performance de última geração.",
        specs: { cor: "Titânio", lacrado: "Sim", condicao: "Novo", bateria: "100%" }
    },
    {
        badge: "Novo",
        badgeColor: "#10b981",
        imgSrc: "./assets/images-catalogo/teste2.jpeg",
        title: "iPhone 14",
        desc: "Excelente custo-benefício e câmeras incríveis.",
        specs: { cor: "Azul", lacrado: "Sim", condicao: "Novo", bateria: "100%" }
    },
    {
        badge: "Semi Novo",
        badgeColor: "#f59e0b",
        imgSrc: "./assets/images-catalogo/teste3.jpeg",
        title: "iPhone 13",
        desc: "Impecável, sem marcas de uso, com garantia.",
        specs: { cor: "Meia-noite", lacrado: "Não", condicao: "Semi Novo", bateria: "98%" }
    },
    {
        badge: "Novo",
        badgeColor: "#10b981",
        imgSrc: "./assets/images-catalogo/teste4.jpeg",
        title: "iPhone 15 Plus",
        desc: "A maior tela com a melhor duração de bateria.",
        specs: { cor: "Verde", lacrado: "Sim", condicao: "Novo", bateria: "100%" }
    }
];

function renderProducts(products) {
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div class="badge" style="background: ${product.badgeColor};">${product.badge}</div>
            <div class="card-image-wrapper" onclick="openModal('${product.imgSrc}')">
                <img src="${product.imgSrc}" alt="${product.title}">
            </div>
            <div class="card-body">
                <h2 class="product-title">${product.title}</h2>
                <p class="product-desc">${product.desc}</p>
                <div class="spec-grid">
                    <div class="spec-item"><span class="spec-label">Cor</span><span class="spec-value">${product.specs.cor}</span></div>
                    <div class="spec-item"><span class="spec-label">Lacrado</span><span class="spec-value">${product.specs.lacrado}</span></div>
                    <div class="spec-item"><span class="spec-label">Condição</span><span class="spec-value">${product.specs.condicao}</span></div>
                    <div class="spec-item"><span class="spec-label">Bateria</span><span class="spec-value">${product.specs.bateria}</span></div>
                </div>
                <button class="btn-order">Fazer Pedido</button>
            </div>
        `;
        
        productSection.appendChild(card);
    });
}

// Executa a função para inserir os 4 produtos
renderProducts(iphoneProducts);