/**
 * Aplicações multimédia - Trabalho Prático 1
 * (c) Catarina Cruz, 2025
 * Diogo Trigueiros
 * João Coelho
 * Francisco Ribeiro
 */

const game = {}; // encapsula a informação de jogo. Está vazio mas vai-se preenchendo com definições adicionais.

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let contador = 0;
let matchedPairs = 0;
let maxCount = 45;
let timeHandler = null;
let output;
game.timerStarted = false;

// sons do jogo
const sounds = {
  background: null,
  flip: null,
  success: null,
  hide: null,
};

// numero de linhas e colunas do tabuleiro;
const ROWS = 4;
const COLS = 4;

game.sounds = sounds; // Adicionar os sons sons do jogo ao objeto game.
game.board = Array(COLS)
  .fill()
  .map(() => Array(ROWS)); // criação do tabuleiro como um array de 6 linhas x 8 colunas

// Representa a imagem de uma carta de um país. Esta definição é apenas um modelo para outros objectos que sejam criados
// com esta base através de let umaFace = Object.create(face).
const face = {
  country: -1,
  x: -1,
  y: -1,
};

const CARDSIZE = 102; // tamanho da carta (altura e largura)
let faces = []; // Array que armazena objectos face que contêm posicionamentos da imagem e códigos dos paises

window.addEventListener("load", init, false);

function init() {
  game.stage = document.querySelector("#stage");
  output = document.querySelector("#output");
  setupAudio(); // configurar o audio
  getFaces(); // calcular as faces e guardar no array faces
  createCountries(); // criar países
  game.sounds.background.loop = true; // repetir o som de fundo
  game.sounds.background.play();

  //completar
  document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      event.preventDefault(); // previne o comportamento do espaço (scrolling para baixo)
      resetGame();
    }
  });
}

// Cria os paises e coloca-os no tabuleiro de jogo(array board[][])
function createCountries() {
  /* DICA:
	Seja umaCarta um elemento DIV, a imagem de carta pode ser obtida nos objetos armazenados no array faces[]; o verso da capa
	está armazenado na ultima posicao do array faces[]. Pode também ser obtido através do seletor de classe .escondida do CSS.
		umaCarta.classList.add("carta");
		umaCarta.style.backgroundPositionX=faces[0].x;
		umaCarta.style.backgroundPositionX=faces[0].y;

		Colocar uma carta escondida:
			umaCarta.classList.add("escondida");

		virar a carta:
			umaCarta.classList.remove("escondida");
    */
  let cardFaces = [];
  // Cria o pares das cartas
  for (let i = 0; i < 8; i++) {
    // Cria duas faces para cada país
    let face1 = Object.create(face);
    face1.country = faces[i].country;
    face1.x = faces[i].x;
    face1.y = faces[i].y;

    let face2 = Object.create(face);
    face2.country = faces[i].country;
    face2.x = faces[i].x;
    face2.y = faces[i].y;

    cardFaces.push(face1);
    cardFaces.push(face2);
  }
  scramble(cardFaces);

  //Faz clear na board antes de adicionar as cartas
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      game.board[row][col] = null;
    }
  }

  cardFaces.forEach((face, index) => {
    let card = document.createElement("div");
    card.classList.add("carta");

    card.dataset.faceX = face.x;
    card.dataset.faceY = face.y;
    card.dataset.country = face.country;

    // aparência inicial da carta
    card.style.backgroundPositionX = face.x;
    card.style.backgroundPositionY = face.y;

    card.addEventListener("click", flipCard);

    const row = Math.floor(index / COLS);
    const col = index % COLS;
    game.board[row][col] = card;
  });
  render();

  // Bloqueia o tabuleiro enquanto as cartas são baralhadas
  lockBoard = true;

  const cards = document.querySelectorAll(".carta");
  cards.forEach((card) => {
    card.classList.add("shuffling");
  });

  let shuffleCount = 0;
  const maxShuffles = 5;
  // Esta pequena função vai servir para baralhar as cartas varias vezes antes do scramble final
  const shuffleInterval = setInterval(() => {
    scramble();
    shuffleCount++;

    if (shuffleCount >= maxShuffles) {
      clearInterval(shuffleInterval);

      cards.forEach((card) => {
        card.classList.remove("shuffling");
      });

      setTimeout(() => {
        hideAllCards();
        lockBoard = false;
      }, 800); // 0.8 segundos para esconder as cartas
    }
  }, 800);

  // cria um delay para esconder as cartas depois de baralhadas
  setTimeout(() => {
    hideAllCards();
  }, 5000); // 5 segundos para esconder as cartas
}

// Função que esconde todas as cartas
function hideAllCards() {
  const cards = document.querySelectorAll(".carta");
  cards.forEach((card) => {
    card.classList.add("escondida");
    card.style.backgroundPositionX = "";
    card.style.backgroundPositionY = "";
  });
}

//Função que atualiza a mensagem de output
function updateOutput() {
  const timeRemaining = maxCount - contador;
  output.textContent = `Tempo restante: ${timeRemaining} segundos | Pares encontrados: ${matchedPairs}/8`;
}

// Esat função é chamada quando o utilizador clica numa carta
function flipCard() {
  if (lockBoard || this === firstCard || this.classList.contains("igual")) {
    return;
  }

  if (!game.timerStarted) {
    tempo();
    game.timerStarted = true;
  }

  game.sounds.flip.play();

  this.classList.remove("escondida");

  this.style.backgroundPositionX = this.dataset.faceX;
  this.style.backgroundPositionY = this.dataset.faceY;

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  checkForMatch();
}

// Função que verifica a lógica do jogo (se as cartas são iguais ou não)
function checkForMatch() {
  const isMatch = firstCard.dataset.country === secondCard.dataset.country;

  isMatch ? handleMatch() : handleMismatch();
}

// Função que é chamada o utilizador forma um par
function handleMatch() {
  game.sounds.success.play();
  firstCard.classList.add("igual");
  secondCard.classList.add("igual");

  // Contador de pares corretos
  matchedPairs++;
  // Da update ao output
  updateOutput();
  // Verifica se todos os pares foram encontrados e manda uma mensagem ao utilizador
  if (matchedPairs === 8) {
    clearInterval(timeHandler);
    game.sounds.win.play();
    output.textContent = "Parabéns! Encontraste todos os pares!!";
  }
  resetBoard();
}

// Função que é chamada quando o utilizador não forma um par
function handleMismatch() {
  lockBoard = true;
  setTimeout(() => {
    game.sounds.hide.play();

    firstCard.classList.add("escondida");
    secondCard.classList.add("escondida");

    firstCard.style.backgroundPositionX = "";
    firstCard.style.backgroundPositionY = "";
    secondCard.style.backgroundPositionX = "";
    secondCard.style.backgroundPositionY = "";

    resetBoard();
  }, 500);
}

// Função que reseta as cartas selecionadas e desbloqueia o tabuleiro para o utilizador tentar de novo
function resetBoard() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

// Adiciona as cartas do tabuleiro à stage
function render() {
  game.stage.innerHTML = ""; // Limpa o tabuleiro

  // Cria o grid para o tabuleiro
  const gridStyle = `
        display: grid;
        grid-template-columns: repeat(${COLS}, ${CARDSIZE}px);
        grid-template-rows: repeat(${ROWS}, ${CARDSIZE}px);
        gap: 10px;
    `;

  game.stage.style = gridStyle;
  const cards = game.board.flat().filter((card) => card);

  cards.forEach((card, index) => {
    card.style.position = "relative";
    card.style.order = index;
    game.stage.appendChild(card);
  });
}

//Função que baralha as cartas no tabuleiro
function scramble(array) {
  if (array && Array.isArray(array)) {
    // Algoritmo de Fisher-Yates para embaralhar o array
    // https://raullesteves.medium.com/algoritmo-de-fisher-yates-para-embaralhamento-de-arrays-ba13a0542e88
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  // Aqui é quando a função é chamada sem parâmetros
  else {
    let cards = Array.from(document.querySelectorAll(".carta"));
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Use more expressive transitions with random offsets for visual effect
      const tempOrderI = cards[i].style.order;
      const tempOrderJ = cards[j].style.order;

      setTimeout(() => {
        cards[i].style.order = tempOrderJ;
        cards[j].style.order = tempOrderI;
      }, 50);
    }
  }
}

// Função que baralha as cartas que não foram encontradas
function reScrambleCards() {
  // Temporariamente mostra as cartas que não encontradas
  const unmatched = document.querySelectorAll(".carta:not(.igual)");

  // Mostra as cartas que não foram encontradas
  unmatched.forEach((card) => {
    card.classList.remove("escondida");
    card.style.backgroundPositionX = card.dataset.faceX;
    card.style.backgroundPositionY = card.dataset.faceY;
  });

  // Adicionar classe para animação de embaralhar
  unmatched.forEach((card) => {
    card.classList.add("shuffling");
  });

  output.textContent = "A baralhar as cartas...";

  // Pausa temporariamente o jogo enquanto as cartas são embaralhadas
  lockBoard = true;

  // Baralhar
  let shuffleCount = 0;
  const maxShuffles = 3;
  const shuffleInterval = setInterval(() => {
    // Baralhar apenas as cartas não encontradas
    const unmatchedCards = Array.from(
      document.querySelectorAll(".carta:not(.igual)")
    );

    // Usar o algoritmo Fisher-Yates apenas nas cartas não encontradas
    for (let i = unmatchedCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempOrderI = unmatchedCards[i].style.order;
      const tempOrderJ = unmatchedCards[j].style.order;

      setTimeout(() => {
        unmatchedCards[i].style.order = tempOrderJ;
        unmatchedCards[j].style.order = tempOrderI;
      }, 50);
    }

    shuffleCount++;

    if (shuffleCount >= maxShuffles) {
      clearInterval(shuffleInterval);

      // Remove a classe que anima as cartas
      unmatched.forEach((card) => {
        card.classList.remove("shuffling");
      });

      // Esconde novamente as cartas não encontradas após baralhar
      setTimeout(() => {
        unmatched.forEach((card) => {
          card.classList.add("escondida");
          card.style.backgroundPositionX = "";
          card.style.backgroundPositionY = "";
        });

        // Reativa o jogo
        lockBoard = false;

        // Reseta as cartas selecionadas
        firstCard = null;
        secondCard = null;

        // Atualiza a mensagem
        updateOutput();
      }, 800);
    }
  }, 800);
}

// function exemplo (){
//   let o1={id:1, pos:{x:10,y:20}}
//   let o2={id:2, pos:{x:1,y:2}}
//   let aux=Object.assign({},o1);

//   o1.pos=Object.assign({},o2.pos)

//   let umaFace= Object.create(face);
//   umaFace.novaProp="asdasd"
// }

function tempo() {
  contador = 0;
  matchedPairs = 0;
  const timeElem = document.getElementById("time");
  const progressStatus = document.getElementById("progressStatus");
  if (timeElem) timeElem.value = contador;
  // mensagem inicial
  updateOutput();

  timeHandler = setInterval(() => {
    contador++;
    if (timeElem) {
      timeElem.value = contador;

      // o update output é chamado aqui para atualizar a cada segundo a mensagem
      updateOutput();

      // Baralhar as cartas a cada 45 segundos
      if (contador > 0 && contador % 45 === 0) {
        reScrambleCards();
      }

      if (contador % 45 === 40) {
        if (progressStatus) {
          progressStatus.textContent =
            "⚠️ Atenção! Cartas serão baralhadas em 5 segundos! ⚠️";
        }
      }
      // Clear the warning after shuffling happens
      if (contador >= maxCount) {
        clearInterval(timeHandler);
        progressStatus.textContent = "";
        document.getElementById("time").classList.remove("warning");
        resetGame();
      }
    }
  }, 1000);
}

/* ------------------------------------------------------------------------------------------------
 ** /!\ NÃO MODIFICAR ESTAS FUNÇÕES /!\
-------------------------------------------------------------------------------------------------- */

// configuração do audio
function setupAudio() {
  game.sounds.background = document.querySelector("#backgroundSnd");
  game.sounds.success = document.querySelector("#successSnd");
  game.sounds.flip = document.querySelector("#flipSnd");
  game.sounds.hide = document.querySelector("#hideSnd");
  game.sounds.win = document.querySelector("#goalSnd");

  // definições de volume;
  game.sounds.background.volume = 0.05; // o volume varia entre 0 e 1

  // nesta pode-se mexer se for necessário acrescentar ou configurar mais sons
}

// calcula as coordenadas das imagens da selecao de cada país e atribui um código único
function getFaces() {
  /* NÂO MOFIFICAR ESTA FUNCAO */
  let offsetX = 1;
  let offsetY = 1;
  for (let i = 0; i < 3; i++) {
    offsetX = 1;
    for (let j = 0; j < 3; j++) {
      let countryFace = Object.create(face); // criar um objeto com base no objeto face
      countryFace.x = -(j * CARDSIZE + offsetX) + "px"; // calculo da coordenada x na imagem
      countryFace.y = -(i * CARDSIZE + offsetY) + "px"; // calculo da coordenada y na imagem
      countryFace.country = "" + i + "" + j; // criação do código do país
      faces.push(countryFace); // guardar o objeto no array de faces
      offsetX += 2;
    }
    offsetY += 2;
  }
}

/* ------------------------------------------------------------------------------------------------
 ** /!\ NÃO MODIFICAR ESTAS FUNÇÕES /!\
-------------------------------------------------------------------------------------------------- */

function resetGame() {
  game.stage.innerHTML = "";
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  if (timeHandler) clearInterval(timeHandler);
  game.timerStarted = false;
  contador = 0;
  document.getElementById("time").value = 0;
  document.getElementById("time").classList.remove("warning");

  createCountries();
}
