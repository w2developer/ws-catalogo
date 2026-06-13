const SETORES_PERMITIDOS = ['eletronicos'];

const { createClient } = supabase;
const supabaseUrl = 'https://qglslyrlxxevqeagghvd.supabase.co';
const supabaseAnonKey = 'sb_publishable_oeJQrZAL6anvLtFxu5S5tA_LtaIKrvc';
const client = createClient(supabaseUrl, supabaseAnonKey);

const swiperInstances = {};
const swiperOptions = {
    slidesPerView: "auto",
    spaceBetween: 24,
    grabCursor: true,
    freeMode: {
        enabled: true,
        sticky: true,
        momentumRatio: 0.5
    },
    watchSlidesProgress: true
};

const catalogContent = document.getElementById('catalog-content');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('imgFull');

function enviarPedido(nomeProduto) {
    const telefone = "559984028208";
    const mensagem = `Olá, gostaria de fazer o pedido do produto: *${nomeProduto}*`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
}

function buildSpecGrid(product) {
    const slugSetor = product.setores?.slug;

    if (slugSetor === 'eletronicos') {
        return `
            <div class="spec-item"><span class="spec-label">Cor</span><span class="spec-value">${product.cor || '-'}</span></div>
            <div class="spec-item"><span class="spec-label">Lacrado</span><span class="spec-value">${product.lacrado || '-'}</span></div>
            <div class="spec-item"><span class="spec-label">Condição</span><span class="spec-value">${product.condicao || '-'}</span></div>
            <div class="spec-item"><span class="spec-label">Bateria</span><span class="spec-value">${product.bateria_percent ? product.bateria_percent + '%' : '-'}</span></div>
        `;
    } else if (slugSetor === 'roupas') {
        const marca = product.marcas?.nome || '-';
        const categoria = product.categorias?.nome || '-';
        return `
            <div class="spec-item"><span class="spec-label">Cor</span><span class="spec-value">${product.cor || '-'}</span></div>
            <div class="spec-item"><span class="spec-label">Categoria</span><span class="spec-value">${categoria}</span></div>
            <div class="spec-item"><span class="spec-label">Marca</span><span class="spec-value">${marca}</span></div>
            <div class="spec-item"><span class="spec-label">Tamanho</span><span class="spec-value">${product.tamanho || '-'}</span></div>
        `;
    }
    return '';
}

function groupByCategory(products) {
    return products.reduce((acc, product) => {
        const catName = product.categorias?.nome || 'Sem Categoria';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(product);
        return acc;
    }, {});
}

function renderProducts(products) {
    catalogContent.innerHTML = '';
    const groupedData = groupByCategory(products);

    Object.keys(groupedData).forEach(categoryName => {
        const catProducts = groupedData[categoryName];
        const section = document.createElement('section');
        section.className = 'category-section';
        section.setAttribute('data-category', categoryName);

        section.innerHTML = `
            <div class="category-header">
                <h2 class="category-title">${categoryName}</h2>
                <button class="btn-toggle" onclick="toggleLayout('${categoryName}', this)">Expandir</button>
            </div>
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${catProducts.map(product => `
                        <div class="swiper-slide">
                            <div class="card">
                                <div class="badge" style="background: ${product.disponibilidade === 'Disponível' ? '#22c55e' : '#ef4444'};">${product.disponibilidade}</div>
                                <div class="card-image-wrapper" onclick="openModal('${product.url_imagem}')">
                                    <img src="${product.url_imagem}" alt="${product.nome}">
                                    <div class="zoom-overlay">
                                        <i class="ri-zoom-in-line"></i>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h2 class="product-title">${product.nome}</h2>
                                    <p class="product-desc" onclick="this.classList.toggle('show-full')" title="Clique para ler mais">${product.descricao || 'Sem descrição'}</p>
                                    <div class="spec-grid">
                                        ${buildSpecGrid(product)}
                                    </div>
                                    <button
                                        ${product.disponibilidade === 'Indisponível' ? 'disabled' : ''}
                                        class="btn-order ${product.disponibilidade === 'Indisponível' ? 'disabled' : ''}"
                                        onclick="enviarPedido('${product.nome.replace(/'/g, "\\'")}')"
                                        >
                                        ${product.disponibilidade === 'Disponível' ? 'Fazer Pedido' : 'Em Breve'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        catalogContent.appendChild(section);

        const swiperElement = section.querySelector('.swiper');
        swiperInstances[categoryName] = new Swiper(swiperElement, swiperOptions);
    });
}

function toggleLayout(category, button) {
    const section = document.querySelector(`.category-section[data-category="${category}"]`);
    const swiperElement = section.querySelector('.swiper');
    const isExpanded = section.classList.toggle('is-expanded');

    if (isExpanded) {
        button.innerText = 'Recolher';
        if (swiperInstances[category]) {
            swiperInstances[category].destroy(true, true);
            swiperInstances[category] = null;
        }
    } else {
        button.innerText = 'Expandir';
        swiperInstances[category] = new Swiper(swiperElement, swiperOptions);
    }
}

async function carregarProdutos() {
    let query = client
        .from('produtos')
        .select('*, marcas(nome), categorias(nome), setores(slug)');

    if (SETORES_PERMITIDOS && SETORES_PERMITIDOS.length > 0) {
        query = query.filter('setores.slug', 'in', `(${SETORES_PERMITIDOS.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro:', error);
        return;
    }

    if (data) {
        const dadosFiltrados = data.filter(product => product.setores !== null);
        renderProducts(dadosFiltrados);
    }
}

function openModal(src) {
    if (!modal || !modalImg) return;
    modal.classList.add('active');
    modalImg.src = src;
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
}

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

carregarProdutos();