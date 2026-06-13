// Inicia cliente Supabase
const { createClient } = supabase;
const supabaseUrl = 'https://qglslyrlxxevqeagghvd.supabase.co';
const supabaseAnonKey = 'sb_publishable_oeJQrZAL6anvLtFxu5S5tA_LtaIKrvc';
const client = createClient(supabaseUrl, supabaseAnonKey);

// Elementos da DOM
const productSection = document.querySelector('.product-list');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('imgFull');

// Monta os cards
function renderProducts(products) {
    productSection.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card';

        let specGridHTML = '';

        // Grid para eletrônicos
        if (product.tipo === 'eletronicos') {
            specGridHTML = `
                <div class="spec-item"><span class="spec-label">Cor</span><span class="spec-value">${product.cor || '-'}</span></div>
                <div class="spec-item"><span class="spec-label">Lacrado</span><span class="spec-value">${product.lacrado || '-'}</span></div>
                <div class="spec-item"><span class="spec-label">Condição</span><span class="spec-value">${product.condicao || '-'}</span></div>
                <div class="spec-item"><span class="spec-label">Bateria</span><span class="spec-value">${product.bateria_percent ? product.bateria_percent + '%' : '-'}</span></div>
            `;
        } 
        // Grid para roupas
        else if (product.tipo === 'roupas') {
            const marca = product.marcas?.nome || '-';
            const categoria = product.categorias?.nome || '-';
            
            specGridHTML = `
                <div class="spec-item"><span class="spec-label">Cor</span><span class="spec-value">${product.cor || '-'}</span></div>
                <div class="spec-item"><span class="spec-label">Categoria</span><span class="spec-value">${categoria}</span></div>
                <div class="spec-item"><span class="spec-label">Marca</span><span class="spec-value">${marca}</span></div>
                <div class="spec-item"><span class="spec-label">Tamanho</span><span class="spec-value">${product.tamanho || '-'}</span></div>
            `;
        }

        // Preenche card
        card.innerHTML = `
            <div class="badge">${product.disponibilidade}</div>
            <div class="card-image-wrapper" onclick="openModal('${product.url_imagem}')">
                <img src="${product.url_imagem}" alt="${product.nome}">
            </div>
            <div class="card-body">
                <h2 class="product-title">${product.nome}</h2>
                <p class="product-desc">${product.descricao}</p>
                <div class="spec-grid">
                    ${specGridHTML}
                </div>
                <button class="btn-order">Fazer Pedido</button>
            </div>
        `;
        
        productSection.appendChild(card);
    });
}

// Busca dados
async function carregarProdutos() {
    // Busca com JOIN para pegar nomes da marca e categoria
    const { data, error } = await client
        .from('produtos')
        .select('*, marcas(nome), categorias(nome)');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    if (data) {
        renderProducts(data);
    }
}

// Abre modal
function openModal(src) {
    modal.classList.add('active');
    modalImg.src = src;
}

// Fecha modal
function closeModal() {
    modal.classList.remove('active');
}

// Fecha com Esc
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

// Inicia app
carregarProdutos();