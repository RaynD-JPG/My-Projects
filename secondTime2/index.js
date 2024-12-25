const menuScreen = document.querySelector("#menuScreen");
const gameScreen = document.querySelector("#gameScreen");
const endGameResultScreen = document.querySelector("#endGameResultScreen");
const startGameButton = document.querySelector("#startButton");
const playerNameInput = document.querySelector("#playerName");
const displayPlayerName = document.querySelector("#displayPlayerName");
const gameGrid = document.querySelector("#gameGrid");
const easyDifficultyButton = document.querySelector("#easyDifficulty");
const hardDifficultyButton = document.querySelector("#hardDifficulty");
const rulesButton = document.querySelector("#rulesButton");
const rulesModal = document.querySelector("#rulesModal");
const closeRulesButton = document.querySelector("#closeRules");
const notification = document.querySelector("#notification");
const timerElement = document.querySelector("#timer");
const endGameButton = document.querySelector("#endGameButton");
const endGameMessage = document.querySelector("#endGameMessage");
const endGameDetails = document.querySelector("#endGameDetails");
const restartButton = document.querySelector("#restartButton");

let timerInterval;
let timeElapsed = 0;
let difficulty = "hard"; 

const levelLayouts = {
    easy: [
        [
            ["empty", ["mountain", 90], "empty", "empty", "oasis"],
            ["empty", "empty", "empty", "bridge", "oasis"],
            ["bridge", "empty", ["mountain", 180], "empty", "empty"],
            ["empty", "empty", "empty", "oasis", "empty"],
            ["empty", "empty", ["mountain", 270], "empty", "empty"]
        ]
    ],
    hard: [
        [
            ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
            ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
            ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
            ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
            [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
            ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
            ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
        ]
    ]
};

const availableTrails = [
    { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
    { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
];

const specialTrails = {
    bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
    mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
};

function showScreen(screen) {
    menuScreen.classList.remove("show");
    gameScreen.classList.remove("show");
    endGameResultScreen.classList.remove("show");
    if (screen === "menu") {
        menuScreen.classList.add("show");
    } else if (screen === "game") {
        gameScreen.classList.add("show");
    } else if (screen === "end") {
        endGameResultScreen.classList.add("show");
    }
}

function showNotification(message, duration = 3000) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

startGameButton.addEventListener("click", () => {
    const playerName = playerNameInput.value.trim();
    if (playerName === "") {
        showNotification("Please enter your name.");
        return;
    }
    displayPlayerName.textContent = playerName;
    timeElapsed = 0;
    startTimer();
    generateMap();
    showScreen("game");
});

easyDifficultyButton.addEventListener("click", () => {
    difficulty = "easy";
    easyDifficultyButton.classList.add("selected");
    hardDifficultyButton.classList.remove("selected");
});

hardDifficultyButton.addEventListener("click", () => {
    difficulty = "hard";
    hardDifficultyButton.classList.add("selected");
    easyDifficultyButton.classList.remove("selected");
});

rulesButton.addEventListener("click", () => {
    rulesModal.classList.add("show");
});

closeRulesButton.addEventListener("click", () => {
    rulesModal.classList.remove("show");
});

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeElapsed += 1;
        timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function generateMap() {
    const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
    const gridSize = difficulty === "easy" ? 5 : 7;
    gameGrid.innerHTML = "";
    gameGrid.className = `grid ${difficulty}`;

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");

            const cellData = mapLayout[row][col];
            const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
            const rotation = Array.isArray(cellData) ? cellData[1] : 0;

            if (cellType !== "empty") {
                const img = document.createElement("img");
                img.src = `./pics/tiles/${cellType}.png`;
                img.alt = cellType;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.transform = `rotate(${rotation}deg)`;
                cell.appendChild(img);
            }

            cell.dataset.type = cellType;
            cell.dataset.currentTrailIndex = -1;
            cell.dataset.rotation = rotation;
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (cellType === "oasis") {
                cell.classList.add("no-click");
            } else {
                if (cellType === "mountain" || cellType === "bridge") {
                    cell.addEventListener('contextmenu', handleRightClick);
                } else {
                    cell.addEventListener('click', handleLeftClick);
                    cell.addEventListener('contextmenu', handleRightClick);
                }
            }

            gameGrid.appendChild(cell);
        }
    }
}

function handleLeftClick(event) {
    const cell = event.currentTarget;
    if (cell.classList.contains("no-click") || ["mountain", "bridge"].includes(cell.dataset.type)) {
        showNotification("You cannot rotate this element.");
        return;
    }
    const img = cell.querySelector("img");
    if (!img) return;
    const newRotation = ((parseInt(cell.dataset.rotation, 10) || 0) + 90) % 360;
    cell.dataset.rotation = newRotation;
    img.style.transform = `rotate(${newRotation}deg)`;
}

function handleRightClick(event) {
    event.preventDefault();
    const cell = event.currentTarget;

    if (cell.classList.contains("no-click")) {
        showNotification("You cannot place an element here.");
        return;
    }

    const cellType = cell.dataset.type;
    let validTrails = availableTrails;

    if (cellType === "bridge") {
        validTrails = [specialTrails.bridge];
    } else if (cellType === "mountain") {
        validTrails = [specialTrails.mountain];
    }

    let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
    currentTrailIndex = (currentTrailIndex + 1) % validTrails.length;
    cell.dataset.currentTrailIndex = currentTrailIndex;

    cell.innerHTML = "";

    const trail = validTrails[currentTrailIndex];
    const img = document.createElement("img");
    img.src = trail.src;
    img.alt = trail.type;
    img.style.width = "100%";
    img.style.height = "100%";

    // Ensure rotation matches the original bridge or mountain block rotation
    if (cellType === "bridge" || cellType === "mountain") {
        const rotation = parseInt(cell.dataset.rotation, 10) || 0;
        img.style.transform = `rotate(${rotation}deg)`;
    }

    cell.appendChild(img);
}


endGameButton.addEventListener("click", () => {
    stopTimer();
    const playerName = displayPlayerName.textContent || "Player";
    const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
    const message = checkTileConnections()
        ? `Congratulations! You have successfully connected all tiles.`
        : `Game over! The tiles are not all connected correctly.`;
    endGameMessage.textContent = message;
    endGameDetails.textContent = `Player: ${playerName}, Time Taken: ${timeTaken}`;
    showScreen("end");
});

restartButton.addEventListener("click", () => {
    showScreen("menu");
});

function checkTileConnections() {
    // Placeholder for connection validation logic

    return true; 
}


// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain",180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty"] 
//         ],
//         [
//             ["oasis", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "empty", ["mountain",180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ], 
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain",180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "empty", ["mountain",180]]
//         ],

//         [
//             ["empty", "empty", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain",90], "empty", ["mountain",90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty"]
//         ],

//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain",180],  "empty", "empty", "empty"]
//         ],
       
//     ],
//     hard: [
//         [
        
//             ["empty", ["mountain",90], "oasis", "oasis", "empty", ["bridge",90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],             
//             ["empty", "empty", "empty", ["mountain",270], "empty", "empty", "empty"],
//             [["mountain",270], "empty", ["mountain",90], "empty", ["bridge",90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge",90], "empty", "empty", "empty"]
            
            
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge",90], "empty", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain",90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain",270], "empty", ["bridge",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",90], "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "oasis", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", ["mountain",180], "empty", ["mountain",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge",90], ["bridge",90], "empty", ["mountain",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ]
        
//     ]
// };

// // List of trails to cycle through on click
// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 cell.addEventListener('click', handleCellClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleCellClick(event) {
//     const cell = event.currentTarget;
//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % trails.length; // Cycle to the next trail
//     const selectedTrail = trails[currentTrailIndex];

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const img = document.createElement("img");
//     img.src = selectedTrail.src;
//     img.alt = selectedTrail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// // Element selectors
// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard";

// // Pre-defined layouts for easy and hard modes
// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// // Available tile options
// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// // Functions for showing/hiding screens
// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.toggle('success', highlight);
//     setTimeout(() => notification.classList.remove('show'), duration);
// }

// // Event listeners for buttons and modals
// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (!playerName) {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => rulesModal.classList.add("show"));
// closeRulesButton.addEventListener("click", () => rulesModal.classList.remove("show"));

// // Timer function
// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// // Generate map with tiles
// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 img.alt = cellType;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.rotation = rotation;
//             cell.dataset.row = row;
//             cell.dataset.col = col;

//             if (cellType !== "oasis") {
//                 cell.addEventListener('click', handleLeftClick);
//                 cell.addEventListener('contextmenu', handleRightClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// // Rotate the tile on left-click
// function handleLeftClick(event) {
//     const cell = event.currentTarget;
//     const img = cell.querySelector("img");
//     if (!img || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360;
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// // Cycle through trails on right-click
// function handleRightClick(event) {
//     event.preventDefault();
//     const cell = event.currentTarget;
//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10) || -1;
//     currentTrailIndex = (currentTrailIndex + 1) % availableTrails.length;
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     const trail = availableTrails[currentTrailIndex];
//     cell.innerHTML = "";
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     cell.appendChild(img);
// }

// // Validate connections between tiles
// function checkTileConnections() {
//     const cells = gameGrid.querySelectorAll('.cell');
//     for (const cell of cells) {
//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);
//         const rotation = parseInt(cell.dataset.rotation, 10) || 0;
//         if (!validateConnections(row, col, cell.dataset.type, rotation)) return false;
//     }
//     return true;
// }

// function validateConnections(row, col, cellType, rotation) {
//     const directions = {
//         0: { row: -1, col: 0 },   
//         90: { row: 0, col: 1 },   
//         180: { row: 1, col: 0 },  
//         270: { row: 0, col: -1 }
//     };
//     const connectionPoints = {
//         "curve_rail": [0, 90, 180, 270],
//         "straight_rail": [0, 180]
//     };
//     const requiredConnections = connectionPoints[cellType];
//     if (!requiredConnections) return true;

//     for (const direction of requiredConnections) {
//         const newRow = row + directions[(rotation + direction) % 360].row;
//         const newCol = col + directions[(rotation + direction) % 360].col;
//         const neighbor = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
//         if (!neighbor) continue;
//         const oppositeDirection = (direction + 180) % 360;
//         const neighborRotation = parseInt(neighbor.dataset.rotation, 10) || 0;
//         const neighborConnections = connectionPoints[neighbor.dataset.type] || [];
//         if (!neighborConnections.some(conn => (neighborRotation + conn) % 360 === oppositeDirection)) return false;
//     }
//     return true;
// }

// // End game check
// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const result = checkTileConnections();
//     showNotification(result ? "Congratulations! All tiles connected." : "Game over! Connections are incorrect.", 5000, result);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard";

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain",180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty"] 
//         ],
//         [
//             ["oasis", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "empty", ["mountain",180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ], 
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain",180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "empty", ["mountain",180]]
//         ],

//         [
//             ["empty", "empty", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain",90], "empty", ["mountain",90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty"]
//         ],

//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain",180],  "empty", "empty", "empty"]
//         ],
       
//     ],
//     hard: [
//         [
        
//             ["empty", ["mountain",90], "oasis", "oasis", "empty", ["bridge",90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],             
//             ["empty", "empty", "empty", ["mountain",270], "empty", "empty", "empty"],
//             [["mountain",270], "empty", ["mountain",90], "empty", ["bridge",90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge",90], "empty", "empty", "empty"]
            
            
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge",90], "empty", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain",90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain",270], "empty", ["bridge",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",90], "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "oasis", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", ["mountain",180], "empty", ["mountain",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge",90], ["bridge",90], "empty", ["mountain",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ]
        
//     ]
// };

// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.toggle('success', highlight);
//     setTimeout(() => notification.classList.remove('show'), duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (!playerName) return showNotification("Please enter your name.");
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() { clearInterval(timerInterval); }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");
//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }
//             cell.dataset.type = cellType;
//             cell.dataset.rotation = rotation;
//             cell.dataset.row = row;
//             cell.dataset.col = col;
//             cell.addEventListener('click', handleLeftClick);
//             cell.addEventListener('contextmenu', handleRightClick);
//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;
//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") return;
//     const img = cell.querySelector("img");
//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360;
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault();
//     const cell = event.currentTarget;
//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % availableTrails.length;
//     cell.dataset.currentTrailIndex = currentTrailIndex;
//     const trail = availableTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     cell.innerHTML = "";
//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     const cells = gameGrid.querySelectorAll('.cell');
//     for (const cell of cells) {
//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);
//         const rotation = parseInt(cell.dataset.rotation, 10) || 0;
//         if (!validateConnections(row, col, cell.dataset.type, rotation)) return false;
//     }
//     return true;
// }

// function validateConnections(row, col, cellType, rotation) {
//     const directions = {
//         0: { row: -1, col: 0 },   
//         90: { row: 0, col: 1 },   
//         180: { row: 1, col: 0 },  
//         270: { row: 0, col: -1 }  
//     };
//     const connectionPoints = {
//         "curve_rail": [0, 90, 180, 270],
//         "straight_rail": [0, 180]
//     };
//     const requiredConnections = connectionPoints[cellType];
//     if (!requiredConnections) return true;
//     for (const direction of requiredConnections) {
//         const newRow = row + directions[(rotation + direction) % 360].row;
//         const newCol = col + directions[(rotation + direction) % 360].col;
//         const neighbor = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
//         if (!neighbor) continue;
//         const oppositeDirection = (direction + 180) % 360;
//         const neighborRotation = parseInt(neighbor.dataset.rotation, 10) || 0;
//         const neighborConnections = connectionPoints[neighbor.dataset.type] || [];
//         if (!neighborConnections.some(conn => (neighborRotation + conn) % 360 === oppositeDirection)) return false;
//     }
//     return true;
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const result = checkTileConnections();
//     showNotification(result ? "Congratulations! All tiles connected." : "Game over! Connections are incorrect.", 5000, result);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard";

// const levelLayouts = {
//     easy: [[ /* Insert layout here */ ]],
//     hard: [[ /* Insert layout here */ ]]
// };

// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.toggle('success', highlight);
//     setTimeout(() => notification.classList.remove('show'), duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (!playerName) return showNotification("Please enter your name.");
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() { clearInterval(timerInterval); }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");
//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }
//             cell.dataset.type = cellType;
//             cell.dataset.rotation = rotation;
//             cell.dataset.row = row;
//             cell.dataset.col = col;
//             cell.addEventListener('click', handleLeftClick);
//             cell.addEventListener('contextmenu', handleRightClick);
//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;
//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") return;
//     const img = cell.querySelector("img");
//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360;
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault();
//     const cell = event.currentTarget;
//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % availableTrails.length;
//     cell.dataset.currentTrailIndex = currentTrailIndex;
//     const trail = availableTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     cell.innerHTML = "";
//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     const cells = gameGrid.querySelectorAll('.cell');
//     for (const cell of cells) {
//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);
//         const rotation = parseInt(cell.dataset.rotation, 10) || 0;
//         if (!validateConnections(row, col, cell.dataset.type, rotation)) return false;
//     }
//     return true;
// }

// function validateConnections(row, col, cellType, rotation) {
//     const directions = {
//         0: { row: -1, col: 0 },   
//         90: { row: 0, col: 1 },   
//         180: { row: 1, col: 0 },  
//         270: { row: 0, col: -1 }  
//     };
//     const connectionPoints = {
//         "curve_rail": [0, 90, 180, 270],
//         "straight_rail": [0, 180]
//     };
//     const requiredConnections = connectionPoints[cellType];
//     if (!requiredConnections) return true;
//     for (const direction of requiredConnections) {
//         const newRow = row + directions[(rotation + direction) % 360].row;
//         const newCol = col + directions[(rotation + direction) % 360].col;
//         const neighbor = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
//         if (!neighbor) continue;
//         const oppositeDirection = (direction + 180) % 360;
//         const neighborRotation = parseInt(neighbor.dataset.rotation, 10) || 0;
//         const neighborConnections = connectionPoints[neighbor.dataset.type] || [];
//         if (!neighborConnections.some(conn => (neighborRotation + conn) % 360 === oppositeDirection)) return false;
//     }
//     return true;
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const result = checkTileConnections();
//     showNotification(result ? "Congratulations! All tiles connected." : "Game over! Connections are incorrect.", 5000, result);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; 

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain",180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty"] 
//         ],
//         [
//             ["oasis", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "empty", ["mountain",180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ], 
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain",180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "empty", ["mountain",180]]
//         ],

//         [
//             ["empty", "empty", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain",90], "empty", ["mountain",90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty"]
//         ],

//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain",180],  "empty", "empty", "empty"]
//         ],
       
//     ],
//     hard: [
//         [
        
//             ["empty", ["mountain",90], "oasis", "oasis", "empty", ["bridge",90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],             
//             ["empty", "empty", "empty", ["mountain",270], "empty", "empty", "empty"],
//             [["mountain",270], "empty", ["mountain",90], "empty", ["bridge",90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge",90], "empty", "empty", "empty"]
            
            
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge",90], "empty", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain",90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain",270], "empty", ["bridge",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",90], "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "oasis", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", ["mountain",180], "empty", ["mountain",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge",90], ["bridge",90], "empty", ["mountain",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ]
        
//     ]
// };
// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// const specialTrails = {
//     bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.remove('success');

//     if (highlight) {
//         notification.classList.add('success');
//     }

//     notification.style.display = 'block';

//     setTimeout(() => {
//         notification.classList.remove('show');
//         notification.style.display = 'none';
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1;
//             cell.dataset.rotation = rotation;
//             cell.dataset.row = row;
//             cell.dataset.col = col;

//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360;
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault();
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = availableTrails;

//     if (cellType === "bridge") {
//         validTrails = [specialTrails.bridge];
//     } else if (cellType === "mountain") {
//         validTrails = [specialTrails.mountain];
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length;
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     cell.innerHTML = "";

//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     const cells = gameGrid.querySelectorAll('.cell');
//     let connected = true; // Corrected to true

//     for (const cell of cells) {
//         const cellType = cell.dataset.type;
//         if (cellType === 'empty' || cellType === 'oasis') continue;

//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);
//         const rotation = parseInt(cell.dataset.rotation, 10) || 0;

//         if (!validateConnections(row, col, cellType, rotation)) {
//             connected = false;
//             break;
//         }
//     }

//     return connected;
// }

// function validateConnections(row, col, cellType, rotation) {
//     // Add detailed validation logic here for connections




//     return true;
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     if (checkTileConnections()) {
//         showNotification(`Congratulations! You have successfully connected all tiles. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, true);
//         console.log("you win");
//     } else {
//         showNotification(`Game over! The tiles are not all connected correctly. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, false);
//         console.log("you lose");
//     }
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; 

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// const specialTrails = {
//     bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.remove('success');

//     if (highlight) {
//         notification.classList.add('success');
//     }

//     notification.style.display = 'block';

   
//     setTimeout(() => {
//         notification.classList.remove('show');
//         notification.style.display = 'none';
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1;
//             cell.dataset.rotation = rotation;
//             cell.dataset.row = row;
//             cell.dataset.col = col;

//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360;
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault();
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = availableTrails;

//     if (cellType === "bridge") {
//         validTrails = [specialTrails.bridge];
//     } else if (cellType === "mountain") {
//         validTrails = [specialTrails.mountain];
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length;
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     cell.innerHTML = "";

//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     const cells = gameGrid.querySelectorAll('.cell');
//     let connected = false;

//     for (const cell of cells) {
//         const cellType = cell.dataset.type;
//         if (cellType === 'empty' || cellType === 'oasis') continue;

//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);
//         const rotation = parseInt(cell.dataset.rotation, 10) || 0;

//         if (!validateConnections(row, col, cellType, rotation)) {
//             connected = false;
//             break;
//         }
//     }

//     return connected;
// }

// function validateConnections(row, col, cellType, rotation) {
//     // Add detailed validation logic here for connections
//     return true; 
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     if (checkTileConnections()) {
//         showNotification(`Congratulations! You have successfully connected all tiles. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, true);
//         console.log("you win")
//     } else {
//         showNotification(`Game over! The tiles are not all connected correctly. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, true);
//         comsole.log("you lose")
//     }
// });


// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// const specialTrails = {
//     bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.remove('success');

//     if (highlight) {
//         notification.classList.add('success');
//     }

//     console.log("Notification shown: ", message); // Debugging log

//     // Ensure it is visible
//     notification.style.display = 'block';
//     notification.style.opacity = '1';

//     // Auto-hide after duration
//     setTimeout(() => {
//         notification.classList.remove('show');
//         notification.style.display = 'none'; // Hide explicitly
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             cell.dataset.row = row; // Track cell position
//             cell.dataset.col = col; // Track cell position
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click"); // Prevent interactions for oasis tiles
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     // Allow placement but prevent rotation
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     // Allow both placement and rotation for other tiles
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = availableTrails; // Default available trails for normal cells

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = [specialTrails.bridge]; // Only allow bridge_rail
//     } else if (cellType === "mountain") {
//         validTrails = [specialTrails.mountain]; // Only allow mountain_rail
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     // Basic function to check if all tiles are connected
//     const cells = gameGrid.querySelectorAll('.cell');
//     let connected = true;

//     cells.forEach(cell => {
//         const type = cell.dataset.type;
//         if (type === "empty" || type === "oasis") return; // Skip empty and oasis cells

//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);

//         // Placeholder logic: Add logic to check neighbors and ensure connectivity
//         // Set `connected = false` if a disconnect is detected
//     });

//     return connected;
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     if (checkTileConnections()) {
//         showNotification(`Congratulations! You have successfully connected all tiles. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, true);
//     } else {
//         showNotification(`Game over! The tiles are not all connected. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, false);
//     }
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain",180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty"] 
//         ],
//         [
//             ["oasis", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "empty", ["mountain",180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ], 
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain",180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "empty", ["mountain",180]]
//         ],

//         [
//             ["empty", "empty", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain",90], "empty", ["mountain",90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty"]
//         ],

//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain",180],  "empty", "empty", "empty"]
//         ],
       
//     ],
//     hard: [
//         [
        
//             ["empty", ["mountain",90], "oasis", "oasis", "empty", ["bridge",90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],             
//             ["empty", "empty", "empty", ["mountain",270], "empty", "empty", "empty"],
//             [["mountain",270], "empty", ["mountain",90], "empty", ["bridge",90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge",90], "empty", "empty", "empty"]
            
            
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge",90], "empty", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain",90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain",270], "empty", ["bridge",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",90], "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "oasis", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", ["mountain",180], "empty", ["mountain",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge",90], ["bridge",90], "empty", ["mountain",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ]
        
//     ]
// };

// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// const specialTrails = {
//     bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000, highlight = false) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     notification.classList.remove('success'); // Remove previous highlight if any

//     if (highlight) {
//         notification.classList.add('success'); // Apply success styles
//     }

//     // Debugging log to ensure this function is being called
//     console.log("Notification shown: ", message);

//     // Set a timeout to hide the notification after a specified duration
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }


// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             cell.dataset.row = row; // Track cell position
//             cell.dataset.col = col; // Track cell position
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click"); // Prevent interactions for oasis tiles
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     // Allow placement but prevent rotation
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     // Allow both placement and rotation for other tiles
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = availableTrails; // Default available trails for normal cells

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = [specialTrails.bridge]; // Only allow bridge_rail
//     } else if (cellType === "mountain") {
//         validTrails = [specialTrails.mountain]; // Only allow mountain_rail
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     // Basic function to check if all tiles are connected
//     const cells = gameGrid.querySelectorAll('.cell');
//     let connected = true;

//     cells.forEach(cell => {
//         const type = cell.dataset.type;
//         if (type === "empty" || type === "oasis") return; // Skip empty and oasis cells

//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);

//         // Placeholder logic: Add logic to check neighbors and ensure connectivity
//         // Set `connected = false` if a disconnect is detected
//     });

//     return connected;
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     if (checkTileConnections()) {
//         showNotification(`Congratulations! You have successfully connected all tiles. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, true);
//     } else {
//         showNotification(`Game over! The tiles are not all connected. Player: ${playerName}, Time Taken: ${timeTaken}`, 5000, false);
//     }
// });
    


// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain",180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty"] 
//         ],
//         [
//             ["oasis", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "empty", ["mountain",180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ], 
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain",180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "empty", ["mountain",180]]
//         ],

//         [
//             ["empty", "empty", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain",90], "empty", ["mountain",90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty"]
//         ],

//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain",180],  "empty", "empty", "empty"]
//         ],
       
//     ],
//     hard: [
//         [
        
//             ["empty", ["mountain",90], "oasis", "oasis", "empty", ["bridge",90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],             
//             ["empty", "empty", "empty", ["mountain",270], "empty", "empty", "empty"],
//             [["mountain",270], "empty", ["mountain",90], "empty", ["bridge",90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge",90], "empty", "empty", "empty"]
            
            
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge",90], "empty", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain",90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain",270], "empty", ["bridge",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",90], "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "oasis", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", ["mountain",180], "empty", ["mountain",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge",90], ["bridge",90], "empty", ["mountain",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ]
        
//     ]
// };


// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// const specialTrails = {
//     bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             cell.dataset.row = row; // Track cell position
//             cell.dataset.col = col; // Track cell position
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click"); // Prevent interactions for oasis tiles
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     // Allow placement but prevent rotation
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     // Allow both placement and rotation for other tiles
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = availableTrails; // Default available trails for normal cells

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = [specialTrails.bridge]; // Only allow bridge_rail
//     } else if (cellType === "mountain") {
//         validTrails = [specialTrails.mountain]; // Only allow mountain_rail
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// function checkTileConnections() {
//     // Basic function to check if all tiles are connected
//     const cells = gameGrid.querySelectorAll('.cell');
//     let connected = true;

//     cells.forEach(cell => {
//         const type = cell.dataset.type;
//         if (type === "empty" || type === "oasis") return; // Skip empty and oasis cells

//         const row = parseInt(cell.dataset.row, 10);
//         const col = parseInt(cell.dataset.col, 10);

//         // Check connections based on tile type (simplified example)
//         if (type === "curve_rail" || type === "straight_rail" || type === "bridge" || type === "mountain") {
//             // Here, you can add logic to check neighbors and ensure connectivity
//             // Example: Check if there's an adjacent tile in the expected direction
//             // This part can be expanded based on your connection rules
//             // connected = false; // Set to false if a disconnect is detected
//         }
//     });

//     return connected;
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     if (checkTileConnections()) {
//         showNotification(`Congratulations! You have successfully connected all tiles. Player: ${playerName}, Time Taken: ${timeTaken}`);
//     } else {
//         showNotification(`Game over! The tiles are not all connected. Player: ${playerName}, Time Taken: ${timeTaken}`);
//     }
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty


// // Updated list of trails for placement
// const availableTrails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" }
// ];

// const specialTrails = {
//     bridge: { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     mountain: { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click"); // Prevent interactions for oasis tiles
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     // Allow placement but prevent rotation
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     // Allow both placement and rotation for other tiles
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = availableTrails; // Default available trails for normal cells

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = [specialTrails.bridge]; // Only allow bridge_rail
//     } else if (cellType === "mountain") {
//         validTrails = [specialTrails.mountain]; // Only allow mountain_rail
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click"); // Prevent interactions for oasis tiles
//             } else {
//                 if (cellType === "mountain" || cellType === "bridge") {
//                     // Allow placement but prevent rotation
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 } else {
//                     // Allow both placement and rotation for other tiles
//                     cell.addEventListener('click', handleLeftClick);
//                     cell.addEventListener('contextmenu', handleRightClick);
//                 }
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click") || cell.dataset.type === "mountain" || cell.dataset.type === "bridge") {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = trails;

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = trails.filter(trail => trail.type === "bridge_rail" || trail.type === "straight_rail");
//     } else if (cellType === "mountain") {
//         validTrails = trails.filter(trail => trail.type === "mountain_rail");
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             if (cellType === "oasis" || cellType === "mountain" || cellType === "bridge") {
//                 cell.classList.add("no-click"); // Prevent rotation for these types
//             } else {
//                 cell.addEventListener('click', handleLeftClick);
//                 cell.addEventListener('contextmenu', handleRightClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot rotate this element.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = trails;

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = trails.filter(trail => trail.type === "bridge_rail" || trail.type === "straight_rail");
//     } else if (cellType === "mountain") {
//         validTrails = trails.filter(trail => trail.type === "mountain_rail");
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 cell.addEventListener('click', handleLeftClick);
//                 cell.addEventListener('contextmenu', handleRightClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot rotate an element here.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     const cellType = cell.dataset.type;
//     let validTrails = trails;

//     // Restrict valid trails based on the cell type
//     if (cellType === "bridge") {
//         validTrails = trails.filter(trail => trail.type === "bridge_rail" || trail.type === "straight_rail");
//     } else if (cellType === "mountain") {
//         validTrails = trails.filter(trail => trail.type === "mountain_rail");
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % validTrails.length; // Cycle through valid trails
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = validTrails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";

//     // Ensure rotation matches the original rotation for bridge and mountain tiles
//     if (cellType === "bridge" || cellType === "mountain") {
//         img.style.transform = `rotate(${cell.dataset.rotation}deg)`;
//     }

//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ]
//     ]
// };

// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 img.style.transform = `rotate(${rotation}deg)`;
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = rotation; // Set initial rotation
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 cell.addEventListener('click', handleLeftClick);
//                 cell.addEventListener('contextmenu', handleRightClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot rotate an element here.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % trails.length; // Cycle to the next trail
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = trails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     img.style.transform = `rotate(${cell.dataset.rotation}deg)`; // Retain rotation state
//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         // Example level layouts (replace or modify as needed)
//         [["empty", ["mountain", 90], "empty", "empty", "oasis"]],
//         [["empty", "empty", "empty", "bridge", "oasis"]]
//     ],
//     hard: [
//         // Example level layouts (replace or modify as needed)
//         [["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"]]
//     ]
// };

// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             cell.dataset.rotation = 0; // Initialize rotation
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 cell.addEventListener('click', handleLeftClick);
//                 cell.addEventListener('contextmenu', handleRightClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleLeftClick(event) {
//     // This function rotates the image by 90 degrees on left click
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot rotate an element here.");
//         return;
//     }

//     const img = cell.querySelector("img");
//     if (!img) return;

//     let currentRotation = parseInt(cell.dataset.rotation, 10) || 0;
//     currentRotation = (currentRotation + 90) % 360; // Increment rotation by 90 degrees
//     cell.dataset.rotation = currentRotation;
//     img.style.transform = `rotate(${currentRotation}deg)`;
// }

// function handleRightClick(event) {
//     // This function cycles through rail images on right click
//     event.preventDefault(); // Prevent default context menu
//     const cell = event.currentTarget;

//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % trails.length; // Cycle to the next trail
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = trails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     img.style.transform = `rotate(${cell.dataset.rotation}deg)`; // Retain rotation state
//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ],
//         [
//             ["oasis", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", ["mountain", 180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain", 180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "empty", ["mountain", 180]]
//         ],
//         [
//             ["empty", "empty", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain", 90], "empty", ["mountain", 90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge", 90], "empty", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain", 90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain", 270], "empty", ["bridge", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 90], "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "oasis", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", ["mountain", 180], "empty", ["mountain", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge", 90], ["bridge", 90], "empty", ["mountain", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ]
//     ]
// };

// // List of trails to cycle through on click
// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 cell.addEventListener('click', handleCellClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleCellClick(event) {
//     const cell = event.currentTarget;
//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % trails.length; // Cycle to the next trail
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = trails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// // const menuScreen = document.querySelector("#menuScreen");
// // const gameScreen = document.querySelector("#gameScreen");
// // const startGameButton = document.querySelector("#startButton");
// // const playerNameInput = document.querySelector("#playerName");
// // const displayPlayerName = document.querySelector("#displayPlayerName");
// // const gameGrid = document.querySelector("#gameGrid");
// // const easyDifficultyButton = document.querySelector("#easyDifficulty");
// // const hardDifficultyButton = document.querySelector("#hardDifficulty");
// // const rulesButton = document.querySelector("#rulesButton");
// // const rulesModal = document.querySelector("#rulesModal");
// // const closeRulesButton = document.querySelector("#closeRules");
// // const notification = document.querySelector("#notification");
// // const timerElement = document.querySelector("#timer");
// // const endGameButton = document.querySelector("#endGameButton");

// // let timerInterval;
// // let timeElapsed = 0;
// // let difficulty = "hard"; // Default difficulty

// // const levelLayouts = {
// //     easy: [
// //         [
// //             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
// //             ["empty", "empty", "empty", "bridge", "oasis"],
// //             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
// //             ["empty", "empty", "empty", "oasis", "empty"],
// //             ["empty", "empty", ["mountain", 270], "empty", "empty"]
// //         ],
// //         // Other levels omitted for brevity
// //     ],
// //     hard: [
// //         [
// //             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
// //             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
// //             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
// //             // Other levels omitted for brevity
// //         ]
// //     ]
// // };

// // // List of trails to cycle through on click
// // const trails = [
// //     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
// //     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
// //     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
// //     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// // ];

// // function showScreen(screen) {
// //     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
// //     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// // }

// // function showNotification(message, duration = 3000) {
// //     notification.textContent = message;
// //     notification.classList.add('show');
// //     setTimeout(() => {
// //         notification.classList.remove('show');
// //     }, duration);
// // }

// // startGameButton.addEventListener("click", () => {
// //     const playerName = playerNameInput.value.trim();
// //     if (playerName === "") {
// //         showNotification("Please enter your name.");
// //         return;
// //     }
// //     displayPlayerName.textContent = playerName;
// //     timeElapsed = 0;
// //     startTimer();
// //     generateMap();
// //     showScreen("game");
// // });

// // easyDifficultyButton.addEventListener("click", () => {
// //     difficulty = "easy";
// //     easyDifficultyButton.classList.add("selected");
// //     hardDifficultyButton.classList.remove("selected");
// // });

// // hardDifficultyButton.addEventListener("click", () => {
// //     difficulty = "hard";
// //     hardDifficultyButton.classList.add("selected");
// //     easyDifficultyButton.classList.remove("selected");
// // });

// // rulesButton.addEventListener("click", () => {
// //     rulesModal.classList.add("show");
// // });

// // closeRulesButton.addEventListener("click", () => {
// //     rulesModal.classList.remove("show");
// // });

// // function startTimer() {
// //     clearInterval(timerInterval);
// //     timerInterval = setInterval(() => {
// //         timeElapsed += 1;
// //         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
// //     }, 1000);
// // }

// // function stopTimer() {
// //     clearInterval(timerInterval);
// // }

// // function generateMap() {
// //     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
// //     const gridSize = difficulty === "easy" ? 5 : 7;
// //     gameGrid.innerHTML = "";
// //     gameGrid.className = `grid ${difficulty}`;

// //     for (let row = 0; row < gridSize; row++) {
// //         for (let col = 0; col < gridSize; col++) {
// //             const cell = document.createElement("div");
// //             cell.classList.add("cell");

// //             const cellData = mapLayout[row][col];
// //             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
// //             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

// //             if (cellType !== "empty") {
// //                 const img = document.createElement("img");
// //                 img.src = `./pics/tiles/${cellType}.png`;
// //                 img.alt = cellType;
// //                 img.style.width = "100%";
// //                 img.style.height = "100%";
// //                 if (rotation) {
// //                     img.style.transform = `rotate(${rotation}deg)`;
// //                 }
// //                 cell.appendChild(img);
// //             }

// //             cell.dataset.type = cellType;
// //             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
// //             if (cellType === "oasis") {
// //                 cell.classList.add("no-click");
// //             } else {
// //                 cell.addEventListener('click', handleCellClick);
// //             }

// //             gameGrid.appendChild(cell);
// //         }
// //     }
// // }

// // function handleCellClick(event) {
// //     const cell = event.currentTarget;
// //     const cellType = cell.dataset.type;

// //     if (cell.classList.contains("no-click")) {
// //         showNotification("You cannot place an element here.");
// //         return;
// //     }

// //     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
// //     currentTrailIndex = (currentTrailIndex + 1) % trails.length; // Cycle to the next trail
// //     const selectedTrail = trails[currentTrailIndex];

// //     // Validate placement rules
// //     if (cellType === "bridge" && selectedTrail.type !== "straight_rail") {
// //         showNotification("Only straight rails can be placed on bridges.");
// //         return;
// //     }

// //     if (cellType === "mountain" && (selectedTrail.type !== "mountain_rail" || cell.dataset.rotation !== "90")) {
// //         showNotification("Only mountain rails at 90° can be placed on mountains.");
// //         return;
// //     }

// //     if (cellType === "oasis") {
// //         showNotification("You cannot place any element on an oasis.");
// //         return;
// //     }

// //     // Valid placement; update trail and rotation state
// //     cell.dataset.currentTrailIndex = currentTrailIndex;

// //     // Remove existing content
// //     cell.innerHTML = "";

// //     // Add the new trail image
// //     const img = document.createElement("img");
// //     img.src = selectedTrail.src;
// //     img.alt = selectedTrail.type;
// //     img.style.width = "100%";
// //     img.style.height = "100%";
// //     img.dataset.rotation = cellType === "mountain" ? 90 : 0; // Initialize rotation for mountain
// //     img.addEventListener("click", handleRotation); // Add click event for rotation (if needed)
// //     cell.appendChild(img);
// // }

// // function handleRotation(event) {
// //     const img = event.target;
// //     let rotation = parseInt(img.dataset.rotation, 10) || 0;
// //     rotation = (rotation + 90) % 360; // Rotate by 90 degrees
// //     img.dataset.rotation = rotation;
// //     img.style.transform = `rotate(${rotation}deg)`;
// // }

// // endGameButton.addEventListener("click", () => {
// //     stopTimer();
// //     const playerName = displayPlayerName.textContent || "Player";
// //     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
// //     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// // });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ],
//         [
//             ["oasis", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", ["mountain", 180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain", 180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "empty", ["mountain", 180]]
//         ],
//         [
//             ["empty", "empty", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain", 90], "empty", ["mountain", 90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge", 90], "empty", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain", 90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain", 270], "empty", ["bridge", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 90], "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "oasis", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", ["mountain", 180], "empty", ["mountain", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge", 90], ["bridge", 90], "empty", ["mountain", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ]
//     ]
// };

// // List of trails to cycle through on click
// const trails = [
//     { type: "curve_rail", src: "./pics/tiles/curve_rail.png" },
//     { type: "bridge_rail", src: "./pics/tiles/bridge_rail.png" },
//     { type: "straight_rail", src: "./pics/tiles/straight_rail.png" },
//     { type: "mountain_rail", src: "./pics/tiles/mountain_rail.png" }
// ];

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`;
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             cell.dataset.currentTrailIndex = -1; // Initialize with no trail selected
//             if (cellType === "oasis") {
//                 cell.classList.add("no-click");
//             } else {
//                 cell.addEventListener('click', handleCellClick);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// function handleCellClick(event) {
//     const cell = event.currentTarget;
//     if (cell.classList.contains("no-click")) {
//         showNotification("You cannot place an element here.");
//         return;
//     }

//     let currentTrailIndex = parseInt(cell.dataset.currentTrailIndex, 10);
//     currentTrailIndex = (currentTrailIndex + 1) % trails.length; // Cycle to the next trail
//     cell.dataset.currentTrailIndex = currentTrailIndex;

//     // Remove existing content
//     cell.innerHTML = "";

//     // Add the new trail image
//     const trail = trails[currentTrailIndex];
//     const img = document.createElement("img");
//     img.src = trail.src;
//     img.alt = trail.type;
//     img.style.width = "100%";
//     img.style.height = "100%";
//     cell.appendChild(img);
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ],
//         [
//             ["oasis", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", ["mountain", 180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain", 180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "empty", ["mountain", 180]]
//         ],
//         [
//             ["empty", "empty", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain", 90], "empty", ["mountain", 90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge", 90], "empty", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain", 90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain", 270], "empty", ["bridge", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 90], "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "oasis", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", ["mountain", 180], "empty", ["mountain", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge", 90], ["bridge", 90], "empty", ["mountain", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ]
//     ]
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`; // Adjusted image path
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             if (cellType === "oasis") {
//                 cell.classList.add("no-drop");
//             } else {
//                 cell.addEventListener('dragover', handleDragOver);
//                 cell.addEventListener('drop', handleDrop);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// // Draggable Elements Setup (including new item)
// const draggableItems = document.querySelectorAll('.draggable-item');
// draggableItems.forEach(item => {
//     item.addEventListener('dragstart', handleDragStart);
// });

// function handleDragStart(event) {
//     event.dataTransfer.setData('text/plain', event.target.id);
// }

// function handleDragOver(event) {
//     event.preventDefault();
// }

// function handleDrop(event) {
//     event.preventDefault();
//     const draggedElementId = event.dataTransfer.getData('text/plain');
//     const cell = event.target;

//     if (cell.classList.contains('cell') && !cell.classList.contains('no-drop')) {
//         const draggedElement = document.getElementById(draggedElementId);

//         const overlayElement = document.createElement('div');
//         overlayElement.style.backgroundImage = `url('${draggedElement.src}')`;
//         overlayElement.style.backgroundSize = 'cover';
//         overlayElement.style.width = '100%';
//         overlayElement.style.height = '100%';
//         overlayElement.style.position = 'absolute';
//         overlayElement.style.top = '0';
//         overlayElement.style.left = '0';

//         if (cell.firstChild) {
//             cell.removeChild(cell.firstChild);
//         }
//         cell.appendChild(overlayElement);
//     } else {
//         showNotification("You cannot place an element here.");
//     }
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.querySelector("#menuScreen");
// const gameScreen = document.querySelector("#gameScreen");
// const startGameButton = document.querySelector("#startButton");
// const playerNameInput = document.querySelector("#playerName");
// const displayPlayerName = document.querySelector("#displayPlayerName");
// const gameGrid = document.querySelector("#gameGrid");
// const easyDifficultyButton = document.querySelector("#easyDifficulty");
// const hardDifficultyButton = document.querySelector("#hardDifficulty");
// const rulesButton = document.querySelector("#rulesButton");
// const rulesModal = document.querySelector("#rulesModal");
// const closeRulesButton = document.querySelector("#closeRules");
// const notification = document.querySelector("#notification");
// const timerElement = document.querySelector("#timer");
// const endGameButton = document.querySelector("#endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ],
//         [
//             ["oasis", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", ["mountain", 180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain", 180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "empty", ["mountain", 180]]
//         ],
//         [
//             ["empty", "empty", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain", 90], "empty", ["mountain", 90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge", 90], "empty", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain", 90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain", 270], "empty", ["bridge", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 90], "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "oasis", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", ["mountain", 180], "empty", ["mountain", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge", 90], ["bridge", 90], "empty", ["mountain", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ]
//     ]
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`; // Replace with actual path to your images
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             if (cellType === "oasis") {
//                 cell.classList.add("no-drop");
//             } else {
//                 cell.addEventListener('dragover', handleDragOver);
//                 cell.addEventListener('drop', handleDrop);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// const draggableItems = document.querySelectorAll('.draggable-item');
// draggableItems.forEach(item => {
//     item.addEventListener('dragstart', handleDragStart);
// });

// function handleDragStart(event) {
//     event.dataTransfer.setData('text/plain', event.target.id);
// }

// function handleDragOver(event) {
//     event.preventDefault();
// }

// function handleDrop(event) {
//     event.preventDefault();
//     const draggedElementId = event.dataTransfer.getData('text/plain');
//     const cell = event.target;

//     if (cell.classList.contains('cell') && !cell.classList.contains('no-drop')) {
//         const draggedElement = document.getElementById(draggedElementId);

//         const overlayElement = document.createElement('div');
//         overlayElement.style.backgroundImage = `url('${draggedElement.src}')`;
//         overlayElement.style.backgroundSize = 'cover';
//         overlayElement.style.width = '100%';
//         overlayElement.style.height = '100%';
//         overlayElement.style.position = 'absolute';
//         overlayElement.style.top = '0';
//         overlayElement.style.left = '0';

//         if (cell.firstChild) {
//             cell.removeChild(cell.firstChild);
//         }
//         cell.appendChild(overlayElement);
//     } else {
//         showNotification("You cannot place an element here.");
//     }
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// const menuScreen = document.getElementById("menuScreen");
// const gameScreen = document.getElementById("gameScreen");
// const startGameButton = document.getElementById("startButton");
// const playerNameInput = document.getElementById("playerName");
// const displayPlayerName = document.getElementById("displayPlayerName");
// const gameGrid = document.getElementById("gameGrid");
// const easyDifficultyButton = document.getElementById("easyDifficulty");
// const hardDifficultyButton = document.getElementById("hardDifficulty");
// const rulesButton = document.getElementById("rulesButton");
// const rulesModal = document.getElementById("rulesModal");
// const closeRulesButton = document.getElementById("closeRules");
// const notification = document.getElementById("notification");
// const timerElement = document.getElementById("timer");
// const endGameButton = document.getElementById("endGameButton");

// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain", 180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty"]
//         ],
//         [
//             ["oasis", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", ["mountain", 180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain", 180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "empty", ["mountain", 180]]
//         ],
//         [
//             ["empty", "empty", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain", 90], "empty", ["mountain", 90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain", 180], "empty", "empty", "empty"]
//         ]
//     ],
//     hard: [
//         [
//             ["empty", ["mountain", 90], "oasis", "oasis", "empty", ["bridge", 90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["mountain", 270], "empty", "empty", "empty"],
//             [["mountain", 270], "empty", ["mountain", 90], "empty", ["bridge", 90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge", 90], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge", 90], "empty", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain", 90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge", 90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain", 270], "empty", ["bridge", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 90], "empty"],
//             ["empty", "empty", "oasis", ["mountain", 270], "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain", 180], "empty"],
//             ["empty", "empty", ["mountain", 270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge", 90], "empty", "oasis", "empty", ["bridge", 90], "empty"],
//             ["empty", "empty", ["mountain", 180], "empty", ["mountain", 90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain", 270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge", 90], ["bridge", 90], "empty", ["mountain", 90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain", 180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
//         ]
//     ]
// };

// function showScreen(screen) {
//     menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//     gameScreen.style.display = screen === 'game' ? 'block' : 'none';
// }

// function showNotification(message, duration = 3000) {
//     notification.textContent = message;
//     notification.classList.add('show');
//     setTimeout(() => {
//         notification.classList.remove('show');
//     }, duration);
// }

// startGameButton.addEventListener("click", () => {
//     const playerName = playerNameInput.value.trim();
//     if (playerName === "") {
//         showNotification("Please enter your name.");
//         return;
//     }
//     displayPlayerName.textContent = playerName;
//     timeElapsed = 0;
//     startTimer();
//     generateMap();
//     showScreen("game");
// });

// easyDifficultyButton.addEventListener("click", () => {
//     difficulty = "easy";
//     easyDifficultyButton.classList.add("selected");
//     hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//     difficulty = "hard";
//     hardDifficultyButton.classList.add("selected");
//     easyDifficultyButton.classList.remove("selected");
// });

// rulesButton.addEventListener("click", () => {
//     rulesModal.classList.add("show");
// });

// closeRulesButton.addEventListener("click", () => {
//     rulesModal.classList.remove("show");
// });

// function startTimer() {
//     clearInterval(timerInterval);
//     timerInterval = setInterval(() => {
//         timeElapsed += 1;
//         timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     }, 1000);
// }

// function stopTimer() {
//     clearInterval(timerInterval);
// }

// function generateMap() {
//     const mapLayout = levelLayouts[difficulty][Math.floor(Math.random() * levelLayouts[difficulty].length)];
//     const gridSize = difficulty === "easy" ? 5 : 7;
//     gameGrid.innerHTML = "";
//     gameGrid.className = `grid ${difficulty}`;

//     for (let row = 0; row < gridSize; row++) {
//         for (let col = 0; col < gridSize; col++) {
//             const cell = document.createElement("div");
//             cell.classList.add("cell");

//             const cellData = mapLayout[row][col];
//             const cellType = Array.isArray(cellData) ? cellData[0] : cellData;
//             const rotation = Array.isArray(cellData) ? cellData[1] : 0;

//             if (cellType !== "empty") {
//                 const img = document.createElement("img");
//                 img.src = `./pics/tiles/${cellType}.png`; // Replace with actual path to your images
//                 img.alt = cellType;
//                 img.style.width = "100%";
//                 img.style.height = "100%";
//                 if (rotation) {
//                     img.style.transform = `rotate(${rotation}deg)`;
//                 }
//                 cell.appendChild(img);
//             }

//             cell.dataset.type = cellType;
//             if (cellType === "oasis") {
//                 cell.classList.add("no-drop");
//             } else {
//                 cell.addEventListener('dragover', handleDragOver);
//                 cell.addEventListener('drop', handleDrop);
//             }

//             gameGrid.appendChild(cell);
//         }
//     }
// }

// const draggableItems = document.querySelectorAll('.draggable-item');
// draggableItems.forEach(item => {
//     item.addEventListener('dragstart', handleDragStart);
// });

// function handleDragStart(event) {
//     event.dataTransfer.setData('text/plain', event.target.id);
// }

// function handleDragOver(event) {
//     event.preventDefault();
// }

// function handleDrop(event) {
//     event.preventDefault();
//     const draggedElementId = event.dataTransfer.getData('text/plain');
//     const cell = event.target;

//     if (cell.classList.contains('cell') && !cell.classList.contains('no-drop')) {
//         const draggedElement = document.getElementById(draggedElementId);

//         const overlayElement = document.createElement('div');
//         overlayElement.style.backgroundImage = `url('${draggedElement.src}')`;
//         overlayElement.style.backgroundSize = 'cover';
//         overlayElement.style.width = '100%';
//         overlayElement.style.height = '100%';
//         overlayElement.style.position = 'absolute';
//         overlayElement.style.top = '0';
//         overlayElement.style.left = '0';

//         if (cell.firstChild) {
//             cell.removeChild(cell.firstChild);
//         }
//         cell.appendChild(overlayElement);
//     } else {
//         showNotification("You cannot place an element here.");
//     }
// }

// endGameButton.addEventListener("click", () => {
//     stopTimer();
//     const playerName = displayPlayerName.textContent || "Player";
//     const timeTaken = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//     showNotification(`Game ended! Player: ${playerName}, Time Taken: ${timeTaken}`);
// });

// // References to important elements
// const menuScreen = document.getElementById("menuScreen");
// const gameScreen = document.getElementById("gameScreen");
// const rulesModal = document.getElementById("rulesModal");
// const startGameButton = document.getElementById("startButton");
// const showRulesButton = document.getElementById("rulesButton");
// const closeRulesButton = document.getElementById("closeRules");
// const playerNameInput = document.getElementById("playerName");
// const easyDifficultyButton = document.getElementById("easyDifficulty");
// const hardDifficultyButton = document.getElementById("hardDifficulty");
// const displayPlayerName = document.getElementById("displayPlayerName");
// const gameGrid = document.getElementById("gameGrid");
// const timerElement = document.getElementById("timer");

// const levelLayouts = {
//     easy: [
//         [
//             ["empty", ["mountain", 90], "empty", "empty", "oasis"],
//             ["empty", "empty", "empty", "bridge", "oasis"],
//             ["bridge", "empty", ["mountain",180], "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty"] 
//         ],
//         [
//             ["oasis", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "empty", ["mountain",180]],
//             ["bridge", "oasis", "mountain", "empty", "empty"],
//             ["empty", "empty", "empty", "oasis", "empty"],
//             ["empty", "empty", "empty", "empty", "empty"]
//         ], 
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "bridge"],
//             ["empty", ["mountain",180], "bridge", "empty", "empty"],
//             ["empty", "oasis", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "empty", ["mountain",180]]
//         ],

//         [
//             ["empty", "empty", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["mountain",90], "empty", ["mountain",90]],
//             ["empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty"]
//         ],

//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty"],
//             ["bridge", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "bridge", "oasis", "empty"],
//             ["empty", ["mountain",180],  "empty", "empty", "empty"]
//         ],
       
//     ],
//     hard: [
//         [
        
//             ["empty", ["mountain",90], "oasis", "oasis", "empty", ["bridge",90], "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "bridge", "empty", "empty", "empty", "empty"],             
//             ["empty", "empty", "empty", ["mountain",270], "empty", "empty", "empty"],
//             [["mountain",270], "empty", ["mountain",90], "empty", ["bridge",90], "empty", "oasis"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", ["bridge",90], "empty", "empty", "empty"]
            
            
//         ],
//         [
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"],
//             ["bridge", "empty", ["bridge",90], "empty", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "bridge"],
//             ["mountain", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", "empty", ["mountain",90], "empty", "empty", "empty"],
//             ["empty", "mountain", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "oasis", "empty", "empty", "empty", "empty"]
//         ],
//         [
//             ["empty", "empty", ["bridge",90], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "bridge"],
//             ["oasis", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "oasis", ["mountain",270], "empty", ["bridge",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",90], "empty"],
//             ["empty", "empty", "oasis", ["mountain",270], "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "bridge", "empty", ["mountain",180], "empty"],
//             ["empty", "empty", ["mountain",270], "empty", "empty", "empty", "empty"],
//             ["empty", ["bridge",90], "empty", "oasis", "empty", ["bridge",90], "empty"],
//             ["empty", "empty", ["mountain",180], "empty", ["mountain",90], "empty", "empty"],
//             ["bridge", "empty", "empty", "empty", "empty", ["mountain",270], "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ],
//         [
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "mountain", "empty"],
//             ["empty", ["bridge",90], ["bridge",90], "empty", ["mountain",90], "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"],
//             ["empty", "empty", "mountain", "empty", "oasis", "empty", "empty"],
//             ["empty", ["mountain",180], "empty", "bridge", "empty", "empty", "empty"],
//             ["empty", "empty", "empty", "empty", "empty", "empty", "empty"]
        
//         ]
        
//     ]
// };
// // Timer variables
// let timerInterval;
// let timeElapsed = 0;
// let difficulty = "hard"; // Default difficulty

// // Show or hide different screens
// function showScreen(screen) {
//   menuScreen.style.display = screen === 'menu' ? 'block' : 'none';
//   gameScreen.style.display = screen === 'game' ? 'block' : 'none';
//   rulesModal.style.display = screen === 'rules' ? 'block' : 'none';
// }

// // Start the game
// startGameButton.addEventListener("click", () => {
//   const playerName = playerNameInput.value.trim();

//   if (playerName === "") {
//     alert("Please enter your name.");
//     return;
//   }

//   // Set player name display and initialize game
//   displayPlayerName.textContent = playerName;
//   timeElapsed = 0;
//   startTimer();
//   generateMap();
//   showScreen("game");
// });

// // Show game rules modal
// showRulesButton.addEventListener("click", () => {
//   showScreen("rules");
// });

// // Close rules modal and return to menu screen
// closeRulesButton.addEventListener("click", () => {
//   showScreen("menu");
// });

// // Difficulty selection event listeners
// easyDifficultyButton.addEventListener("click", () => {
//   difficulty = "easy";
//   easyDifficultyButton.classList.add("selected");
//   hardDifficultyButton.classList.remove("selected");
// });

// hardDifficultyButton.addEventListener("click", () => {
//   difficulty = "hard";
//   hardDifficultyButton.classList.add("selected");
//   easyDifficultyButton.classList.remove("selected");
// });

// // Timer function
// function startTimer() {
//   clearInterval(timerInterval);
//   timerInterval = setInterval(() => {
//     timeElapsed += 1;
//     timerElement.textContent = `${Math.floor(timeElapsed / 60)}:${String(timeElapsed % 60).padStart(2, "0")}`;
//   }, 1000);
// }

// // Stop timer function (for end game, etc.)
// function stopTimer() {
//   clearInterval(timerInterval);
// }

// // Generate a grid based on selected difficulty
// function generateMap() {
//   const gridSize = difficulty === "easy" ? 5 : 7;
//   gameGrid.innerHTML = ""; // Clear previous grid

//   for (let row = 0; row < gridSize; row++) {
//     const rowElement = document.createElement("div");
//     rowElement.classList.add("row");

//     for (let col = 0; col < gridSize; col++) {
//       const cell = document.createElement("div");
//       cell.classList.add("cell");
//       cell.dataset.row = row;
//       cell.dataset.col = col;
//       rowElement.appendChild(cell);

//       // Cell interaction (example: toggling track)
//       cell.addEventListener("click", () => {
//         cell.classList.toggle("track");
//       });
//     }

//     gameGrid.appendChild(rowElement);
//   }
// }

// // Start by showing the menu screen
// showScreen("menu");
