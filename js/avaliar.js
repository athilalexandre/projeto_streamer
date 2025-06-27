// --- LOGIN COM TWITCH (igual exemplo anterior, insira seu client_id) ---
const TWITCH_CLIENT_ID = 'SUA_CLIENT_ID_AQUI';
const TWITCH_REDIRECT_URI = window.location.origin + window.location.pathname;
const TWITCH_AUTH_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=token&scope=user:read:email`;

function getTwitchUser(token) {
    return fetch('https://api.twitch.tv/helix/users', {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Client-Id': TWITCH_CLIENT_ID
        }
    }).then(r => r.json());
}

function showUser(user) {
    const loginArea = document.getElementById('login-area');
    loginArea.innerHTML = `<img src="${user.profile_image_url}" alt="Avatar" class="avatar-twitch"> <span class="twitch-nome">${user.display_name}</span> <button id='logout-btn' class='logout-btn'><i class='bx bx-log-out'></i> Sair</button>`;
    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('twitch_token');
        window.location.reload();
    };
    document.getElementById('form-avaliar').style.display = 'block';
}

function checkLogin() {
    let token = localStorage.getItem('twitch_token');
    if (!token && window.location.hash.includes('access_token')) {
        token = window.location.hash.match(/access_token=([^&]+)/)[1];
        localStorage.setItem('twitch_token', token);
        window.location.hash = '';
    }
    if (token) {
        getTwitchUser(token).then(data => {
            if (data.data && data.data[0]) {
                showUser(data.data[0]);
            } else {
                localStorage.removeItem('twitch_token');
            }
        });
        document.getElementById('form-avaliar').style.display = 'block';
    } else {
        document.getElementById('form-avaliar').style.display = 'none';
    }
}
document.getElementById('twitch-login').onclick = function() {
    window.location.href = TWITCH_AUTH_URL;
};
checkLogin();

// --- BUSCA IGDB ---
// Insira seu client_id e access_token IGDB abaixo
const IGDB_CLIENT_ID = 'ym5rov3ibxdzw0m94uagvk7wq0g1j5';
const IGDB_ACCESS_TOKEN = 'g02zy8ziq64vfreqmbg8oxurfktx1c';

async function buscarJogosIGDB(query) {
    const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
            'Client-ID': IGDB_CLIENT_ID,
            'Authorization': 'Bearer ' + IGDB_ACCESS_TOKEN,
            'Accept': 'application/json',
            'Content-Type': 'text/plain'
        },
        body: `search "${query}"; fields name,cover.url,platforms.name,first_release_date; limit 5;`
    });
    return response.json();
}

const buscaInput = document.getElementById('busca-jogo');
const sugestoesDiv = document.getElementById('sugestoes-jogo');
const jogoSelecionadoDiv = document.getElementById('jogo-selecionado');
let jogoSelecionado = null;

buscaInput.addEventListener('input', async function() {
    const val = buscaInput.value.trim();
    if (val.length < 2) {
        sugestoesDiv.innerHTML = '';
        return;
    }
    const jogos = await buscarJogosIGDB(val);
    sugestoesDiv.innerHTML = jogos.map(jogo => `
        <div class='sugestao-jogo' data-id='${jogo.id}' data-nome='${jogo.name}' data-capa='${jogo.cover ? 'https:' + jogo.cover.url.replace('t_thumb', 't_cover_big') : ''}' data-plataformas='${jogo.platforms ? jogo.platforms.map(p=>p.name).join(', ') : ''}'>
            <img src='${jogo.cover ? 'https:' + jogo.cover.url.replace('t_thumb', 't_cover_small') : ''}' alt='Capa'>
            <span>${jogo.name}</span>
        </div>
    `).join('');
    document.querySelectorAll('.sugestao-jogo').forEach(el => {
        el.onclick = function() {
            jogoSelecionado = {
                id: el.dataset.id,
                nome: el.dataset.nome,
                capa: el.dataset.capa,
                plataformas: el.dataset.plataformas
            };
            jogoSelecionadoDiv.innerHTML = `
                <div class='jogo-preview'>
                    <img src='${jogoSelecionado.capa}' alt='Capa'>
                    <div>
                        <strong>${jogoSelecionado.nome}</strong><br>
                        <small>${jogoSelecionado.plataformas}</small>
                    </div>
                </div>
            `;
            sugestoesDiv.innerHTML = '';
            buscaInput.value = jogoSelecionado.nome;
        };
    });
});

// --- ENVIAR AVALIAÇÃO ---
document.getElementById('form-avaliar').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!jogoSelecionado) {
        alert('Selecione um jogo!');
        return;
    }
    const tempo = document.getElementById('tempo').value;
    const nota = document.querySelector('input[name="nota"]:checked').value;
    const usuario = document.querySelector('.twitch-nome')?.textContent || 'streamer';
    const body = {
        ...jogoSelecionado,
        tempo,
        nota,
        usuario
    };
    const res = await fetch('/api/jogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        document.getElementById('form-feedback').style.display = 'block';
        document.getElementById('form-feedback').textContent = 'Jogo salvo com sucesso!';
        setTimeout(()=>{ window.location.reload(); }, 1500);
    } else {
        alert('Erro ao salvar jogo.');
    }
}); 