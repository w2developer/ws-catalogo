// Configurações Globais
const SETORES_PERMITIDOS = ['eletronicos', 'roupas'];
let listaSetores = [];

// Inicialização do Supabase
const supabaseUrl = 'https://qglslyrlxxevqeagghvd.supabase.co';
const supabaseAnonKey = 'sb_publishable_oeJQrZAL6anvLtFxu5S5tA_LtaIKrvc';
const client = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Configurações do Swiper
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

// Elementos do DOM
const catalogContent = document.getElementById('catalog-content');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('imgFull');

// --- FUNÇÕES DO CATÁLOGO ---

// Abre link do WhatsApp para pedidos
function enviarPedido(nomeProduto) {
    const telefone = "559984028208";
    const message = `Olá, gostaria de fazer o pedido do produto: *${nomeProduto}*`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Constrói especificações técnicas por setor
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

// Agrupa produtos por categoria
function groupByCategory(products) {
    return products.reduce((acc, product) => {
        const catName = product.categorias?.nome || 'Sem Categoria';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(product);
        return acc;
    }, {});
}

// Renderiza os cards no catálogo
function renderProducts(products) {
    if (!catalogContent) return;
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
                                </div>
                                <div class="card-body">
                                    <h2 class="product-title">${product.nome}</h2>
                                    <p class="product-desc" onclick="this.classList.toggle('show-full')" title="Clique para ler mais">${product.descricao || 'Sem descrição'}</p>
                                    <div class="spec-grid">
                                        ${buildSpecGrid(product)}
                                    </div>
                                    <div class="btn-group">
                                        <button class="btn-order" style="background: red;" onclick="excluirProduto('${product.id}')">
                                            Excluir Produto
                                        </button>
                                        <button class="btn-order" style="background: gray; display:flex; justify-content: center; align-items: center; font-size: 1rem;" onclick="editarProduto('${product.id}')">
                                            <i class="ri-edit-2-fill"></i>
                                        </button>
                                    </div>
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

// Altera entre o modo Swiper e Grid expandido
function toggleLayout(category, button) {
    const section = document.querySelector(`.category-section[data-category="${category}"]`);
    if (!section) return;
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

// Busca produtos do Supabase para o catálogo
async function carregarProdutos() {
    let query = client
        .from('produtos')
        .select('*, marcas(nome), categorias(nome), setores(slug)');

    if (SETORES_PERMITIDOS && SETORES_PERMITIDOS.length > 0) {
        query = query.filter('setores.slug', 'in', `(${SETORES_PERMITIDOS.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
    }

    if (data) {
        const dadosFiltrados = data.filter(product => product.setores !== null);
        renderProducts(dadosFiltrados);
    }
}

// --- FUNÇÕES DO PAINEL ADMINISTRATIVO ---

// Inicializa componentes do painel admin
async function inicializarPainelAdmin() {
    await carregarSetores();
    await renderizarTabelaProdutos();
    configurarSubmitFormulario();
}

// Busca e renderiza os setores no select do form
async function carregarSetores() {
    const { data, error } = await client.from('setores').select('id, nome, slug');
    const select = document.getElementById('setor_id');
    if (!select) return;

    if (error) {
        console.error('Erro ao buscar setores:', error);
        return;
    }

    if (data) {
        listaSetores = data;
        select.innerHTML = '<option value="">Selecione o setor...</option>';
        data.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
        });
    }
}

// Carrega as marcas filtradas por setor
async function carregarMarcasPorSetor(setorId, marcaSelecionadaId = null) {
    const select = document.getElementById('marca_id');
    if (!select) return;

    select.innerHTML = '<option value="">Carregando marcas...</option>';
    select.disabled = true;

    const { data } = await client.from('marcas').select('id, nome').eq('setor_id', setorId);
    
    select.innerHTML = '<option value="">Selecione a marca...</option>';
    if (data && data.length > 0) {
        data.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
        });
        select.disabled = false;
        if (marcaSelecionadaId) select.value = marcaSelecionadaId;
    } else {
        select.innerHTML = '<option value="">Nenhuma marca encontrada</option>';
    }
}

// Carrega as categorias filtradas por setor
async function carregarCategoriasPorSetor(setorId, categoriaSelecionadaId = null) {
    const select = document.getElementById('categoria_id');
    if (!select) return;

    select.innerHTML = '<option value="">Carregando categorias...</option>';
    select.disabled = true;

    const { data } = await client.from('categorias').select('id, nome').eq('setor_id', setorId);
    
    select.innerHTML = '<option value="">Selecione a categoria...</option>';
    if (data && data.length > 0) {
        data.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
        });
        select.disabled = false;
        if (categoriaSelecionadaId) select.value = categoriaSelecionadaId;
    } else {
        select.innerHTML = '<option value="">Nenhuma categoria encontrada</option>';
    }
}

// Controla exibição de campos dinâmicos baseado no setor escolhido
function aoMudarSetor(callbackModoEdicao = null) {
    const setorId = document.getElementById('setor_id')?.value;
    
    const camposEletronicos = document.getElementById('camposEletronicos');
    const camposRoupas = document.getElementById('camposRoupas');
    
    if (camposEletronicos) camposEletronicos.classList.add('hidden');
    if (camposRoupas) camposRoupas.classList.add('hidden');
    
    if (!setorId) {
        const marcaId = document.getElementById('marca_id');
        const catId = document.getElementById('categoria_id');
        if (marcaId) {
            marcaId.innerHTML = '<option value="">Selecione um setor primeiro...</option>';
            marcaId.disabled = true;
        }
        if (catId) {
            catId.innerHTML = '<option value="">Selecione um setor primeiro...</option>';
            catId.disabled = true;
        }
        return;
    }

    const setorSelecionado = listaSetores.find(s => s.id == setorId);
    
    if (setorSelecionado) {
        if (setorSelecionado.slug === 'eletronicos' && camposEletronicos) {
            camposEletronicos.classList.remove('hidden');
        } else if (setorSelecionado.slug === 'roupas' && camposRoupas) {
            camposRoupas.classList.remove('hidden');
        }
    }

    if (callbackModoEdicao) {
        callbackModoEdicao();
    } else {
        carregarMarcasPorSetor(setorId);
        carregarCategoriasPorSetor(setorId);
    }
}

// Renderiza a tabela gerencial de produtos
async function renderizarTabelaProdutos() {
    const tbody = document.getElementById('lista-produtos-corpo');
    if (!tbody) return;

    tbody.innerHTML = '';

    const { data: produtos, error } = await client
        .from('produtos')
        .select('*, marcas(nome), setores(nome)');

    if (error || !produtos || produtos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">Nenhum produto listado.</td></tr>`;
        return;
    }

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.url_imagem || 'https://via.placeholder.com/50'}" class="img-table"></td>
            <td><strong>${p.nome}</strong></td>
            <td>${p.marcas ? p.marcas.nome : 'Sem Marca'}</td>
            <td>${p.setores ? p.setores.nome : 'Sem Setor'}</td>
            <td>
                <button class="btn ${p.disponibilidade === 'Disponível' ? 'btn-success' : 'btn-danger'}" style="padding: 4px 8px; font-size:12px;" onclick="alternarStatus('${p.id}', '${p.disponibilidade}')">
                    ${p.disponibilidade}
                </button>
            </td>
            <td>
                <button class="btn btn-warning" style="padding: 4px 8px; font-size:12px; margin-right:5px;" onclick="editarProduto('${p.id}')">Editar</button>
                <button class="btn btn-danger" style="padding: 4px 8px; font-size:12px;" onclick="excluirProduto('${p.id}')">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Prepara e abre modal para criação
function abrirModalCadastro() {
    const form = document.getElementById('formProduto');
    if (form) form.reset();
    const prodId = document.getElementById('prod_id');
    if (prodId) prodId.value = '';
    const titulo = document.getElementById('titulo-modal');
    if (titulo) titulo.innerText = 'Cadastrar Produto';
    aoMudarSetor();
    const modalProd = document.getElementById('modalProduto');
    if (modalProd) modalProd.classList.remove('hidden');
}

// Fecha o modal de formulário
function fecharModal() {
    const modalProd = document.getElementById('modalProduto');
    if (modalProd) modalProd.classList.add('hidden');
}

// Busca dados de um produto e popula o formulário para edição
async function editarProduto(id) {
    const form = document.getElementById('formProduto');
    if (form) form.reset();
    const titulo = document.getElementById('titulo-modal');
    if (titulo) titulo.innerText = 'Editar Produto';

    const { data: p, error } = await client.from('produtos').select('*').eq('id', id).single();
    if (error || !p) return;

    document.getElementById('prod_id').value = p.id;
    document.getElementById('nome').value = p.nome;
    document.getElementById('setor_id').value = p.setor_id;
    document.getElementById('cor').value = p.cor || '';
    document.getElementById('url_imagem').value = p.url_imagem || '';
    document.getElementById('disponibilidade').value = p.disponibilidade;
    document.getElementById('descricao').value = p.descricao || '';

    aoMudarSetor(async () => {
        await carregarMarcasPorSetor(p.setor_id, p.marca_id);
        await carregarCategoriasPorSetor(p.setor_id, p.categoria_id);
        
        const setorSel = listaSetores.find(s => s.id == p.setor_id);
        if (setorSel?.slug === 'eletronicos') {
            document.getElementById('lacrado').value = p.lacrado || '';
            document.getElementById('condicao').value = p.condicao || '';
            document.getElementById('bateria_percent').value = p.bateria_percent || '';
        } else if (setorSel?.slug === 'roupas') {
            document.getElementById('tamanho').value = p.tamanho || '';
        }
    });

    const modalProd = document.getElementById('modalProduto');
    if (modalProd) modalProd.classList.remove('hidden');
}

// Configura o ouvinte de envio do formulário (Insert/Update)
function configurarSubmitFormulario() {
    const form = document.getElementById('formProduto');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('prod_id').value;
        const setorId = document.getElementById('setor_id').value;
        const setorSelecionado = listaSetores.find(s => s.id == setorId);
        
        const produto = {
            setor_id: parseInt(setorId),
            marca_id: document.getElementById('marca_id').value || null,
            categoria_id: document.getElementById('categoria_id').value || null,
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value || null,
            cor: document.getElementById('cor').value || null,
            url_imagem: document.getElementById('url_imagem').value || null,
            disponibilidade: document.getElementById('disponibilidade').value
        };

        if (setorSelecionado?.slug === 'eletronicos') {
            produto.lacrado = document.getElementById('lacrado').value || null;
            produto.condicao = document.getElementById('condicao').value || null;
            const bat = document.getElementById('bateria_percent').value;
            produto.bateria_percent = bat ? parseInt(bat) : null;
            produto.tamanho = null;
        } else if (setorSelecionado?.slug === 'roupas') {
            produto.tamanho = document.getElementById('tamanho').value || null;
            produto.lacrado = null;
            produto.condicao = null;
            produto.bateria_percent = null;
        }

        let resposta;
        if (id) {
            resposta = await client.from('produtos').update(produto).eq('id', id);
        } else {
            resposta = await client.from('produtos').insert([produto]);
        }

        if (resposta.error) {
            Swal.fire('Erro', 'Erro ao salvar: ' + resposta.error.message, 'error');
        } else {
            Swal.fire('Sucesso!', 'Produto salvo com sucesso.', 'success');
            fecharModal();
            if (document.getElementById('lista-produtos-corpo')) renderizarTabelaProdutos();
            if (catalogContent) carregarProdutos();
        }
    });
}

// Remove o produto de forma permanente
async function excluirProduto(id) {
    const resultado = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Remover este produto permanentemente?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (resultado.isConfirmed) {
        const { error } = await client.from('produtos').delete().eq('id', id);
        if (error) {
            Swal.fire('Erro', 'Erro ao excluir: ' + error.message, 'error');
        } else {
            Swal.fire('Excluído!', 'Produto removido com sucesso.', 'success');
            if (document.getElementById('lista-produtos-corpo')) renderizarTabelaProdutos();
            if (catalogContent) carregarProdutos();
        }
    }
}

// Alterna status de Disponível/Indisponível rápido
async function alternarStatus(id, statusAtual) {
    const novoStatus = statusAtual === 'Disponível' ? 'Indisponível' : 'Disponível';
    const { error } = await client.from('produtos').update({ disponibilidad: novoStatus }).eq('id', id);
    if (error) {
        Swal.fire('Erro', 'Erro ao alterar status: ' + error.message, 'error');
    } else {
        renderizarTabelaProdutos();
    }
}

// --- STORAGE / GALERIA DE IMAGENS ---

// Executa upload de arquivos para o Bucket do Supabase
async function processarUploadStorage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const nomeArquivo = `${Date.now()}_${file.name}`;
    const { data, error } = await client.storage.from('produtos-bucket').upload(nomeArquivo, file);

    if (error) {
        Swal.fire('Erro', 'Erro no upload: ' + error.message, 'error');
        return;
    }
    renderizarGaleria();
}

// Renderiza itens salvos no storage
async function renderizarGaleria() {
    const grid = document.getElementById('galeria-grid-corpo');
    if (!grid) return;

    grid.innerHTML = '';
    const { data: arquivos, error } = await client.storage.from('produtos-bucket').list();

    if (error || !arquivos || arquivos.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; color: #64748b;">Nenhuma imagem salva no storage.</p>';
        return;
    }

    arquivos.forEach(arq => {
        if (arq.name === '.emptyFolderPlaceholder') return;

        const { data: urlData } = client.storage.from('produtos-bucket').getPublicUrl(arq.name);

        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${urlData.publicUrl}" alt="${arq.name}">
            <div class="gallery-actions">
                <button class="btn btn-primary" style="padding: 4px 6px; font-size:11px;" onclick="copiarLink('${urlData.publicUrl}')">Copiar Link</button>
                <button class="btn btn-danger" style="padding: 4px 6px; font-size:11px;" onclick="deletarImagemStorage('${arq.name}')">Excluir</button>
            </div>
        `;
        grid.appendChild(item);
    });
}

// Copia URL pública para a área de transferência
function copiarLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        Swal.fire('Copiado!', 'Link copiado com sucesso!', 'success');
    });
}

// Remove arquivo de imagem do Bucket do Supabase
async function deletarImagemStorage(nomeArquivo) {
    const resultado = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Excluir esta imagem do Storage?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (resultado.isConfirmed) {
        const { error } = await client.storage.from('produtos-bucket').remove([nomeArquivo]);
        if (error) {
            Swal.fire('Erro', 'Erro ao excluir: ' + error.message, 'error');
        } else {
            Swal.fire('Excluído!', 'Imagem removida com sucesso.', 'success');
            renderizarGaleria();
        }
    }
}

// --- MODAL DE ZOOM (IMAGEM CATALOGO) ---

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

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    if (catalogContent) {
        await carregarProdutos();
    }
    
    if (document.getElementById('formProduto') || document.getElementById('lista-produtos-corpo')) {
        await inicializarPainelAdmin();
    }
    
    if (document.getElementById('galeria-grid-corpo')) {
        await renderizarGaleria();
    }
});