async function carregarJogos() {
    const res = await fetch('/api/jogos');
    const jogos = await res.json();
    return jogos;
}

function renderCard(jogo) {
    return `
    <div class="flip-card">
      <div class="flip-card-inner">
        <div class="flip-card-front">
          <img src="${jogo.capa}" alt="Capa do Jogo">
          <div class="nota-grande">${'★'.repeat(jogo.nota)}</div>
        </div>
        <div class="flip-card-back">
          <h3>${jogo.nome}</h3>
          <p><b>Plataformas:</b> ${jogo.plataformas}</p>
          <p><b>Tempo Zerado:</b> ${jogo.tempo}</p>
          <p><b>Nota:</b> ${'★'.repeat(jogo.nota)}</p>
          <p><b>Streamer:</b> ${jogo.usuario}</p>
        </div>
      </div>
    </div>
    `;
}

function renderJogos(jogos) {
    const lista = document.getElementById('jogos-lista');
    if (!jogos.length) {
        lista.innerHTML = '<p>Nenhum jogo registrado ainda.</p>';
        return;
    }
    lista.innerHTML = jogos.map(renderCard).join('');
}

async function filtrarJogos() {
    const termo = document.getElementById('busca-publica').value.toLowerCase();
    const jogos = await carregarJogos();
    const filtrados = jogos.filter(j => j.nome.toLowerCase().includes(termo));
    renderJogos(filtrados);
}

document.getElementById('busca-publica').addEventListener('input', filtrarJogos);
window.onload = filtrarJogos; 