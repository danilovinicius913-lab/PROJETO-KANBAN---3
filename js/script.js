// quadro kanban
const colunas = ["afazer", "fazendo", "feito"];
const cards = [
  { id: 1, titulo: "Levantar requisitos", coluna: "feito",
    checklist: [{ texto: "Conversar com o cliente", feito: true }, { texto: "Listar as funcionalidades", feito: true }], dependeDe: [] },
  { id: 2, titulo: "Modelar o banco de dados", coluna: "fazendo",
    checklist: [{ texto: "Criar o diagrama", feito: true }, { texto: "Definir as tabelas", feito: false }], dependeDe: [1] },
  { id: 3, titulo: "Prototipar as telas", coluna: "fazendo",
    checklist: [{ texto: "Tela de login", feito: true }, { texto: "Tela de cadastro", feito: true }, { texto: "Tela de listagem", feito: true }], dependeDe: [1] },
  { id: 4, titulo: "Programar o cadastro de produtos", coluna: "afazer",
    checklist: [{ texto: "Criar o formulário", feito: false }, { texto: "Validar os campos", feito: false }], dependeDe: [2, 3] },
  { id: 5, titulo: "Testar o sistema", coluna: "afazer",
    checklist: [{ texto: "Testar o cadastro", feito: false }, { texto: "Corrigir os erros encontrados", feito: false }], dependeDe: [4] },
  { id: 6, titulo: "Escrever o manual do usuário", coluna: "afazer",
    checklist: [{ texto: "Escrever a introdução", feito: false }], dependeDe: [3] }
];

let cardArrastado = null;

function buscarCard(id) {
  return cards.find(card => card.id === Number(id));
}

function pegarPendencias(card) {
  const pendencias = [];
  card.checklist.forEach(item => {
    if (!item.feito) pendencias.push("Checklist: " + item.texto);
  });
  card.dependeDe.forEach(id => {
    const dependencia = buscarCard(id);
    if (dependencia && dependencia.coluna !== "feito") {
      pendencias.push("Depende de: " + dependencia.titulo);
    }
  });
  return pendencias;
}

const nomesColunas = { afazer: "A Fazer", fazendo: "Fazendo", feito: "Feito" };

function pegarDica(card) {
  const faltaChecklist = card.checklist.some(item => !item.feito);
  const faltaDependencias = card.dependeDe
    .map(id => buscarCard(id))
    .filter(dependencia => dependencia.coluna !== "feito")
    .map(dependencia => dependencia.titulo);

  if (!faltaChecklist && faltaDependencias.length === 0) {
    if (card.coluna === "feito") return "Etapa concluída.";
    const proxima = colunas[colunas.indexOf(card.coluna) + 1];
    return "Pode ir para " + nomesColunas[proxima] + ".";
  }

  let texto = "";
  if (faltaChecklist) texto += "Marque os itens do checklist. ";
  if (faltaDependencias.length) texto += "Antes, conclua: " + faltaDependencias.join(", ") + ".";
  return texto.trim();
}

function atualizarResumo() {
  const total = cards.length;
  const concluidos = cards.filter(card => card.coluna === "feito").length;
  const percentual = total ? Math.round((concluidos / total) * 100) : 0;
  document.getElementById("progressValue").textContent = percentual + "%";
  document.getElementById("progressBar").style.width = percentual + "%";
  colunas.forEach(coluna => {
    document.getElementById("count-" + coluna).textContent =
      cards.filter(card => card.coluna === coluna).length;
  });
}

function mostrarCards() {
  colunas.forEach(coluna => { document.getElementById(coluna).innerHTML = ""; });

  cards.forEach(card => {
    const pendencias = pegarPendencias(card);
    const feitos = card.checklist.filter(item => item.feito).length;
    const totalChecklist = card.checklist.length;
    const percentual = totalChecklist ? Math.round((feitos / totalChecklist) * 100) : 100;

    const div = document.createElement("article");
    div.className = "card " + (pendencias.length ? "bloqueado" : "liberado");
    div.draggable = true;
    div.id = "card" + card.id;
    div.dataset.cardId = card.id;
    div.setAttribute("aria-label", card.titulo);

    const titulo = document.createElement("h3");
    titulo.textContent = card.titulo;
    div.appendChild(titulo);

    card.checklist.forEach((item, indice) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = item.feito;
      input.addEventListener("change", () => marcarItem(card.id, indice));
      label.append(input, document.createTextNode(item.texto));
      div.appendChild(label);
    });

    if (card.dependeDe.length) {
      const dependencias = document.createElement("p");
      dependencias.className = "dependencias";
      dependencias.textContent = "Depende de: " + card.dependeDe.map(id => buscarCard(id).titulo).join(", ");
      div.appendChild(dependencias);
    }

    const status = document.createElement("p");
    status.className = "status " + (pendencias.length ? "aviso" : "ok");
    status.textContent = pendencias.length ? "Bloqueado" : "Liberado";
    div.appendChild(status);

    const dica = document.createElement("p");
    dica.className = "dica";
    dica.textContent = pegarDica(card);
    div.appendChild(dica);

    const progresso = document.createElement("p");
    progresso.className = "task-progress";
    progresso.textContent = "Checklist · " + feitos + "/" + totalChecklist + " concluídos";
    const trilha = document.createElement("div");
    trilha.className = "mini-track";
    const preenchimento = document.createElement("span");
    preenchimento.style.width = percentual + "%";
    trilha.appendChild(preenchimento);
    div.append(progresso, trilha);

    div.addEventListener("dragstart", evento => {
      cardArrastado = card.id;
      evento.dataTransfer.effectAllowed = "move";
      evento.dataTransfer.setData("text/plain", String(card.id));
      div.classList.add("arrastando");
    });
    div.addEventListener("dragend", () => div.classList.remove("arrastando"));
    document.getElementById(card.coluna).appendChild(div);
  });

  colunas.forEach(coluna => {
    const lista = document.getElementById(coluna);
    if (!lista.children.length) {
      const vazio = document.createElement("p");
      vazio.className = "vazio";
      vazio.textContent = "Arraste um card para cá.";
      lista.appendChild(vazio);
    }
  });

  atualizarResumo();
}

function marcarItem(idCard, posicao) {
  const card = buscarCard(idCard);
  if (!card) return;
  card.checklist[posicao].feito = !card.checklist[posicao].feito;
  mostrarCards();
}

colunas.forEach(coluna => {
  const lista = document.getElementById(coluna);
  lista.addEventListener("dragover", evento => {
    evento.preventDefault();
    lista.classList.add("sobre");
    evento.dataTransfer.dropEffect = "move";
  });
  lista.addEventListener("dragleave", evento => {
    if (!lista.contains(evento.relatedTarget)) lista.classList.remove("sobre");
  });
  lista.addEventListener("drop", evento => {
    evento.preventDefault();
    lista.classList.remove("sobre");
    const id = evento.dataTransfer.getData("text/plain") || cardArrastado;
    const card = buscarCard(id);
    if (!card) return;

    const posicaoAtual = colunas.indexOf(card.coluna);
    const posicaoDestino = colunas.indexOf(coluna);
    if (posicaoAtual === posicaoDestino) return;

    if (posicaoDestino > posicaoAtual) {
      const pendencias = pegarPendencias(card);
      if (pendencias.length) {
        alert("Esta tarefa ainda não pode avançar.\n\nFalta:\n" + pendencias.join("\n"));
        return;
      }
    }
    card.coluna = coluna;
    mostrarCards();
  });
});

mostrarCards();