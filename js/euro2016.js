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
let maxCount = 60;
let timeHandler = null;
game.timerStarted = false;


// sons do jogo
const sounds = {
	background: null,
	flip: null,
	success: null,
	hide: null
};

// numero de linhas e colunas do tabuleiro;
const ROWS = 4;
const COLS = 4;

game.sounds = sounds; // Adicionar os sons sons do jogo ao objeto game.
game.board  = Array(COLS).fill().map(() => Array(ROWS)); // criação do tabuleiro como um array de 6 linhas x 8 colunas

// Representa a imagem de uma carta de um país. Esta definição é apenas um modelo para outros objectos que sejam criados
// com esta base através de let umaFace = Object.create(face).
const face = {
	country: -1,
	x: -1,
	y: -1
};

const CARDSIZE = 102; 	// tamanho da carta (altura e largura)
let faces = []; 		// Array que armazena objectos face que contêm posicionamentos da imagem e códigos dos paises


window.addEventListener("load", init, false);

function init() {
	game.stage = document.querySelector("#stage");
	setupAudio(); 		// configurar o audio
	getFaces(); 		// calcular as faces e guardar no array faces
	createCountries();	// criar países
	game.sounds.background.loop = true; // repetir o som de fundo
	game.sounds.background.play();

	//completar

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
	let cardFaces =[];
	// Cria o pares das cartas
	for(let i = 0; i < 8 ; i++){
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
	for(let row = 0; row < ROWS; row++) {
        for(let col = 0; col < COLS; col++) {
            game.board[row][col] = null;
        }
    }

	cardFaces.forEach((face, index) => {
        let card = document.createElement("div");
        card.classList.add("carta", "escondida");

        card.dataset.faceX = face.x;
        card.dataset.faceY = face.y;
        card.dataset.country = face.country;

		card.addEventListener("click", flipCard);

        const row = Math.floor(index / COLS);
        const col = index % COLS;
        game.board[row][col] = card;
    });
	render();
}

function flipCard() {
	if (lockBoard || this === firstCard || this.classList.contains('igual')) {
        return;
    }

    if (!game.timerStarted) {
        tempo();
        game.timerStarted = true;
    }

    game.sounds.flip.play();


    this.classList.remove('escondida');


    this.style.backgroundPositionX = this.dataset.faceX;
    this.style.backgroundPositionY = this.dataset.faceY;

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.country === secondCard.dataset.country;

    isMatch ? handleMatch() : handleMismatch();
}

function handleMatch() {
    game.sounds.success.play();
    firstCard.classList.add('igual');
    secondCard.classList.add('igual');

    const timeElem = document.getElementById("time");
    contador = Math.max(0, contador - 5);
    if (timeElem) timeElem.value = contador;


    resetBoard();
}

function handleMismatch() {
    lockBoard = true;
    setTimeout(() => {
        game.sounds.hide.play();

        firstCard.classList.add('escondida');
        secondCard.classList.add('escondida');

        firstCard.style.backgroundPositionX = '';
        firstCard.style.backgroundPositionY = '';
        secondCard.style.backgroundPositionX = '';
        secondCard.style.backgroundPositionY = '';

        resetBoard();
    }, 500);
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

// Adicionar as cartas do tabuleiro à stage
function render() {
	game.stage.innerHTML = ""; // Limpar o tabuleiro

	const gridStyle = `
        display: grid;
        grid-template-columns: repeat(${COLS}, ${CARDSIZE}px);
        grid-template-rows: repeat(${ROWS}, ${CARDSIZE}px);
        gap: 10px;
    `;

	game.stage.style = gridStyle;
	const cards = game.board.flat().filter(card => card);

    cards.forEach((card, index) => {
		card.style.position = "relative";
        card.style.order = index;
        game.stage.appendChild(card);
    });

}


// baralha as cartas no tabuleiro
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
    // Aqui é quando é chamados sem parametros
    else {
        let cards = Array.from(document.querySelectorAll(".carta"));
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            cards[i].style.order = j;
            cards[j].style.order = i;
        }
    }


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
  contador=0;
    const timeElem = document.getElementById("time");
    if (timeElem) timeElem.value = contador;

  timeHandler= setInterval(()=>{
	contador++;
	if (timeElem) {
        timeElem.value = contador;
	if(contador>=maxCount-5)document.getElementById("time").classList.add("warning");
	if(contador>=maxCount){
		clearInterval(timeHandler);
		document.getElementById("time").classList.remove("warning");
        resetGame();
	}
    }
  },1000)

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
	game.sounds.background.volume=0.05;  // o volume varia entre 0 e 1

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
			let countryFace = Object.create(face); 				// criar um objeto com base no objeto face
			countryFace.x = -(j * CARDSIZE + offsetX) + "px";   // calculo da coordenada x na imagem
			countryFace.y = -(i * CARDSIZE + offsetY) + "px";   // calculo da coordenada y na imagem
			countryFace.country = "" + i + "" + j; 			    // criação do código do país
			faces.push(countryFace); 					        // guardar o objeto no array de faces
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
