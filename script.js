// Símbolos disponíveis no jogo
const allSymbols = [
    "🍎", "🍌", "🍇", "🍉",
    "🍓", "🍒", "🍍", "🥝",
    "🍊", "🥥", "🍑", "🍐"
];

// Quantidade de pares por dificuldade
const levels = {
    easy: 4,
    medium: 8,
    hard: 12
};

// Elementos HTML
const gameBoard = document.getElementById("game-board");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");

const restartButton = document.getElementById("restart");
const difficultySelect = document.getElementById("difficulty");
const playerNameInput = document.getElementById("player-name");

const victoryModal = document.getElementById("victory-modal");
const finalMoves = document.getElementById("final-moves");
const finalTime = document.getElementById("final-time");
const recordMessage = document.getElementById("record-message");
const playAgainButton = document.getElementById("play-again");

const rankingList = document.getElementById("ranking-list");
const rankingTabs = document.querySelectorAll(".ranking-tab");

// Variáveis do jogo
let cards = [];
let firstCard = null;
let secondCard = null;

let lockBoard = false;
let moves = 0;
let matchedPairs = 0;

let seconds = 0;
let timerInterval = null;
let timeoutId = null;

let gameStarted = false;
let currentLevel = "medium";


// Embaralhar cartas
function shuffleCards(array) {

    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const randomIndex = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[randomIndex]] =
            [shuffled[randomIndex], shuffled[i]];
    }

    return shuffled;
}


// Formatar tempo
function formatTime(totalSeconds) {

    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


// Iniciar cronômetro
function startTimer() {

    if (gameStarted) return;

    gameStarted = true;

    timerInterval = setInterval(() => {

        seconds++;

        timerDisplay.textContent = formatTime(seconds);

    }, 1000);
}


// Parar cronômetro
function stopTimer() {

    clearInterval(timerInterval);
    timerInterval = null;
}


// Atualizar jogadas
function updateMoves() {

    moves++;

    movesDisplay.textContent = moves;
}


// Liberar cartas para uma nova jogada
function resetTurn() {

    firstCard = null;
    secondCard = null;
    lockBoard = false;
}


// Criar cartas
function createCards() {

    gameBoard.innerHTML = "";

    const pairCount = levels[currentLevel];

    const selectedSymbols = allSymbols.slice(0, pairCount);

    const duplicatedSymbols = [
        ...selectedSymbols,
        ...selectedSymbols
    ];

    cards = shuffleCards(duplicatedSymbols);

    gameBoard.className = "game-board " + currentLevel;

    cards.forEach((symbol) => {

        const card = document.createElement("button");

        card.classList.add("card");
        card.textContent = "?";
        card.dataset.symbol = symbol;
        card.setAttribute("aria-label", "Carta fechada");

        card.addEventListener("click", () => {

            if (
                lockBoard ||
                card.classList.contains("flipped") ||
                card.classList.contains("matched")
            ) {
                return;
            }

            startTimer();

            card.classList.add("flipped");
            card.textContent = card.dataset.symbol;
            card.setAttribute("aria-label", "Carta " + symbol);

            if (!firstCard) {

                firstCard = card;

            } else {

                secondCard = card;

                updateMoves();

                checkMatch();
            }
        });

        gameBoard.appendChild(card);
    });
}


// Verificar pares
function checkMatch() {

    const isMatch =
        firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        matchedPairs++;

        resetTurn();

        if (matchedPairs === levels[currentLevel]) {

            stopTimer();

            setTimeout(() => {
                showVictory();
            }, 400);
        }

    } else {

        lockBoard = true;

        timeoutId = setTimeout(() => {

            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");

            firstCard.textContent = "?";
            secondCard.textContent = "?";

            firstCard.setAttribute("aria-label", "Carta fechada");
            secondCard.setAttribute("aria-label", "Carta fechada");

            timeoutId = null;

            resetTurn();

        }, 1000);
    }
}


// Buscar ranking salvo
function getRanking() {

    try {
        return JSON.parse(localStorage.getItem("memoryRanking")) || {
            easy: [],
            medium: [],
            hard: []
        };

    } catch (error) {

        return {
            easy: [],
            medium: [],
            hard: []
        };
    }
}


// Salvar resultado
function saveScore() {

    const ranking = getRanking();

    const playerName =
        playerNameInput.value.trim() || "Jogador";

    const result = {
        name: playerName,
        moves: moves,
        time: seconds,
        date: new Date().toLocaleDateString("pt-BR")
    };

    ranking[currentLevel].push(result);

    // Menor número de jogadas é melhor.
    // Em caso de empate, vence o menor tempo.
    ranking[currentLevel].sort((a, b) => {

        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }

        return a.time - b.time;
    });

    // Guardar apenas os cinco melhores
    ranking[currentLevel] =
        ranking[currentLevel].slice(0, 5);

    localStorage.setItem(
        "memoryRanking",
        JSON.stringify(ranking)
    );

    return ranking[currentLevel].some(
        (item) => item === result
    );
}


// Mostrar ranking
function showRanking(level = currentLevel) {

    const ranking = getRanking();

    const results = ranking[level] || [];

    rankingList.innerHTML = "";

    if (results.length === 0) {

        rankingList.innerHTML = `
            <p class="empty-ranking">
                Ainda não existem resultados nesta dificuldade.
            </p>
        `;

        return;
    }

    results.forEach((result, index) => {

        const item = document.createElement("div");

        item.classList.add("ranking-item");

        const position = document.createElement("span");
        position.classList.add("ranking-position");
        position.textContent = `${index + 1}º`;

        const name = document.createElement("strong");
        name.classList.add("ranking-name");
        name.textContent = result.name;

        const movesText = document.createElement("span");
        movesText.classList.add("ranking-detail");
        movesText.textContent = `${result.moves} jogadas`;

        const timeText = document.createElement("span");
        timeText.classList.add("ranking-detail");
        timeText.textContent = formatTime(result.time);

        item.append(
            position,
            name,
            movesText,
            timeText
        );

        rankingList.appendChild(item);
    });
}


// Mostrar vitória
function showVictory() {

    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(seconds);

    const enteredRanking = saveScore();

    recordMessage.textContent = enteredRanking
        ? "Você está entre os cinco melhores!"
        : "Resultado registrado! Continue tentando melhorar.";

    showRanking(currentLevel);

    victoryModal.hidden = false;
}


// Reiniciar jogo
function restartGame() {

    victoryModal.hidden = true;

    stopTimer();
    clearTimeout(timeoutId);

    timeoutId = null;

    firstCard = null;
    secondCard = null;

    lockBoard = false;
    moves = 0;
    matchedPairs = 0;

    seconds = 0;
    gameStarted = false;

    movesDisplay.textContent = "0";
    timerDisplay.textContent = "00:00";

    createCards();
}


// Alterar dificuldade
difficultySelect.addEventListener("change", () => {

    currentLevel = difficultySelect.value;

    restartGame();

    rankingTabs.forEach((tab) => {

        tab.classList.toggle(
            "active",
            tab.dataset.level === currentLevel
        );
    });

    showRanking(currentLevel);
});


// Botão reiniciar
restartButton.addEventListener("click", restartGame);


// Botão jogar novamente
playAgainButton.addEventListener("click", restartGame);


// Abas do ranking
rankingTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        const selectedLevel = tab.dataset.level;

        rankingTabs.forEach((item) => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        showRanking(selectedLevel);
    });
});


// Iniciar jogo
restartGame();

showRanking("medium");