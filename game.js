document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById("gameContainer");

  const assetsToPreload = [
    "assets/player-run-right.gif",
    "assets/player-run-left.gif",
    "assets/player-shoot-left.gif",
    "assets/player-shoot-right.gif",
    "assets/splash.gif",
    "assets/bullet-left.png",
    "assets/zombie-run-right.gif",
    "assets/zombie-run-left.gif",
    "assets/zombie-dead.png",
    "assets/guitar-character.gif",
    "assets/armored-bus.png",
    "assets/sound/gunshot.mp3",
    "assets/sound/background-music-01.mp3",
    "assets/sound/zombie-attack.mp3",
    "assets/sound/eating-flesh.mp3"
  ];

  function preloadAssets(assets) {
    let loadedCount = 0;
    return new Promise((resolve) => {
      assets.forEach(asset => {
        if (asset.endsWith('.mp3')) {
          const audio = new Audio();
          audio.src = asset;
          audio.onloadeddata = () => {
            loadedCount++;
            if (loadedCount === assets.length) resolve();
          };
        } else {
          const img = new Image();
          img.src = asset;
          img.onload = () => {
            loadedCount++;
            if (loadedCount === assets.length) resolve();
          };
        }
      });
    });
  }

  function restartGame() {
    gameContainer.innerHTML = "";
    document.getElementById("restartScreen").style.display = "none";
    initGame();
  }

  document.getElementById("restartBtn").addEventListener("click", () => {
    restartGame();
  });

  const loaderScreen = document.getElementById("loaderScreen");
  const startScreen = document.getElementById("startScreen");

  preloadAssets(assetsToPreload).then(() => {
    loaderScreen.style.display = "none";
    startScreen.style.display = "flex";

  const startBtn = document.getElementById("startBtn");
  startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    initGame();
  });
  });

  function initGame() {
    const character1 = document.createElement("img");
    character1.src = "assets/player-run-right.gif";
    character1.alt = "Character 1";
    character1.classList.add("character");
    gameContainer.appendChild(character1);

    let character1Pos = { x: -100, y: 0 };
    character1.style.left = `${character1Pos.x}px`;
    character1.style.bottom = `${character1Pos.y}px`;

    let isShooting = false;
    let shootInterval = null;
    let isGameOver = false;

    let movingLeft = false;
    let movingRight = true;
    let pastMovement = 'right';

    let bullets = [];
    let zombies = [];
    let zombieCount = 0;
    let maxZombies = 15;
    const spawnInterval = 2000;
    let hasTriggeredRightSideZombies = false;

    let bulletIntervals = [];
    let zombieWaveTimeouts = [];

    const killCountText = document.getElementById('killCountText');
    let killCount = 0;
    killCountText.textContent = `Kills: ${killCount}`;

    const gunshotAudio = new Audio('assets/sound/gunshot.mp3');
    gunshotAudio.volume = 0.2;

    const zombieAtackAudio = new Audio('assets/sound/zombie-attack.mp3');
    zombieAtackAudio.volume = 0.4;

    const zombieEatingFleshAudio = new Audio('assets/sound/eating-flesh.mp3');
    zombieEatingFleshAudio.volume = 0.4;

    const bgMusic = new Audio('assets/sound/background-music-01.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.play().catch(() => {
      document.addEventListener('keydown', () => {
        bgMusic.play();
      }, { once: true });
    });

    function runAway() {
      const speed = 1.2;
      if (movingRight) character1Pos.x += speed;
      if (movingLeft) character1Pos.x -= speed;
      character1.style.left = `${character1Pos.x}px`;
    }

    document.addEventListener('keydown', (event) => {
      if (isGameOver) return;
      if (event.key === "ArrowLeft") {
        stopShooting();
        movingRight = false;
        movingLeft = true;
        character1.style.height = '60px';
        character1.style.width = '60px';
        pastMovement = 'left';
        character1.src = "assets/player-run-left.gif";
      } else if (event.key === "ArrowRight") {
        stopShooting();
        movingLeft = false;
        movingRight = true;
        character1.style.height = '60px';
        character1.style.width = '60px';
        pastMovement = 'right';
        character1.src = "assets/player-run-right.gif";
      } else if (event.code === "Space" && !isShooting) {
        startShooting();
      }
    });

    function shoot() {
      const bullet = document.createElement('img');
      bullet.src = "assets/bullet-left.png";
      bullet.style.position = 'absolute';
      bullet.style.height = '1px';
      bullet.style.width = '5px';

      playGunshotSound();

      const direction = pastMovement === 'left' ? -1 : 1;
      const bulletPos = {
        x: character1Pos.x + (direction === 1 ? 60 : -20),
        y: character1Pos.y + 40
      };

      bullet.style.left = `${bulletPos.x}px`;
      bullet.style.bottom = `${bulletPos.y}px`;
      gameContainer.appendChild(bullet);
      bullets.push({ bullet, bulletPos });

      const bulletSpeed = 5;
      const moveBullet = setInterval(() => {
        bulletPos.x += direction * bulletSpeed;
        bullet.style.left = `${bulletPos.x}px`;

        zombies.forEach(z => {
          if (!z.dead && Math.abs(bulletPos.x - z.pos.x) < 50 && Math.abs(bulletPos.y - z.pos.y) < 50) {
            gameContainer.removeChild(bullet);
            clearInterval(moveBullet);
            z.hits++;
            if (z.hits >= z.hitThreshold) killZombie(z);
          }
        });

        if (bulletPos.x < 0 || bulletPos.x > window.innerWidth) {
          if (gameContainer.contains(bullet)) gameContainer.removeChild(bullet);
          clearInterval(moveBullet);
        }
      }, 10);

      bulletIntervals.push(moveBullet);
    }

    function startShooting() {
      isShooting = true;
      character1.src = pastMovement === 'left' ? "assets/player-shoot-left.gif" : "assets/player-shoot-right.gif";
      movingLeft = false;
      movingRight = false;
      character1.style.height = '80px';
      character1.style.width = '120px';
      shootInterval = setInterval(shoot, 400);
    }

    function stopShooting() {
      if (isShooting) {
        clearInterval(shootInterval);
        isShooting = false;
      }
    }

    function playGunshotSound() {
      gunshotAudio.currentTime = 0;
      gunshotAudio.play();
    }

    function spawnZombie() {
      if (zombieCount >= maxZombies) return;

      const zombie = document.createElement("img");
      zombie.style.position = 'absolute';
      zombie.style.height = '60px';
      zombie.style.width = '60px';
      zombie.classList.add("character");

      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -100 : window.innerWidth + 100;
      const startY = 0;
      zombie.src = fromLeft ? "assets/zombie-run-right.gif" : "assets/zombie-run-left.gif";
      zombie.style.left = `${startX}px`;
      zombie.style.bottom = `${startY}px`;

      gameContainer.appendChild(zombie);

      const newZombie = {
        el: zombie,
        fromLeft,
        pos: { x: startX, y: startY },
        speed: 0.8,
        hits: 0,
        hitThreshold: Math.floor(Math.random() * 3) + 2,
        dead: false
      };

      zombies.push(newZombie);
      zombieCount++;
    }

    function moveZombies() {
      zombies.forEach(z => {
        if (z.dead) return;
        z.pos.x += z.fromLeft ? z.speed : -z.speed;
        z.el.style.left = `${z.pos.x}px`;

        if (Math.abs(z.pos.x - character1Pos.x) < 50 && Math.abs(z.pos.y - character1Pos.y) < 50) {
          gameOver();
        }

        if (z.pos.x < -200 || z.pos.x > window.innerWidth + 200) {
          if (gameContainer.contains(z.el)) gameContainer.removeChild(z.el);
          z.dead = true;
          zombieCount--;
        }
      });
    }

    function killZombie(z) {
      z.dead = true;
      z.el.src = "assets/zombie-dead.png";
      z.el.style.height = '45px';
      z.el.style.width = '45px';
      let opacity = 1;

      killCount++;
      killCountText.textContent = `Kills: ${killCount}`;

      const fade = setInterval(() => {
        opacity -= 0.05;
        z.el.style.opacity = opacity;
        if (opacity <= 0) {
          clearInterval(fade);
          if (gameContainer.contains(z.el)) gameContainer.removeChild(z.el);
          zombieCount--;
        }
      }, 50);
    }

    function cleanupGame() {
      clearInterval(gameLoop);
      clearInterval(spawnLoop);

      bulletIntervals.forEach(i => clearInterval(i));
      bulletIntervals = [];

      zombieWaveTimeouts.forEach(t => clearTimeout(t));
      zombieWaveTimeouts = [];

      bullets.forEach(({ bullet }) => {
        if (gameContainer.contains(bullet)) gameContainer.removeChild(bullet);
      });
      bullets = [];

      zombies.forEach(z => {
        if (gameContainer.contains(z.el)) gameContainer.removeChild(z.el);
      });
      zombies = [];
    }

    function gameOver() {
      if (isGameOver) return;
      isGameOver = true;
    
      cleanupGame();
      stopShooting();
      bgMusic.pause();
      zombieAtackAudio.currentTime = 0;
      zombieAtackAudio.play();
    
      // Splash animation (player death)
      character1.src = "assets/splash.gif";
      character1.style.height = '120px';
      character1.style.width = '120px';
    
      // Create the censored.gif overlay image
      const censoredImg = document.createElement('img');
      censoredImg.src = 'assets/censored.gif';
      censoredImg.style.position = 'absolute';
      censoredImg.style.left = `${character1Pos.x - 20}px`;
      censoredImg.style.bottom = `${character1Pos.y}px`;
      censoredImg.style.width = '100px'; // Adjust as needed
      censoredImg.style.height = '60px'; // Adjust as needed
      censoredImg.style.zIndex = '15'; // Ensure it's above splash
      gameContainer.appendChild(censoredImg);
    
      // Optional: Keep the original red "CENSORED" text, or remove this block if not needed
      const censoredText = document.createElement('div');
      censoredText.textContent = 'CENSORED';
      censoredText.style.position = 'absolute';
      censoredText.style.left = `${character1Pos.x - 25}px`;
      censoredText.style.bottom = `${character1Pos.y + 10}px`;
      censoredText.style.fontSize = '20px';
      censoredText.style.fontWeight = 'bold';
      censoredText.style.color = 'red';
      censoredText.style.zIndex = '16';
      gameContainer.appendChild(censoredText);
    
      document.getElementById("restartScreen").style.display = "flex";

      zombieEatingFleshAudio.currentTime = 0;
      zombieEatingFleshAudio.play();
    }
    

    function gameWin() {
      if (isGameOver) return;
      isGameOver = true;

      cleanupGame();
      stopShooting();
      bgMusic.pause();

      character1.src = "assets/player-run-right.gif";
      character1.style.height = '60px';
      character1.style.width = '60px';

      const winText = document.createElement('div');
      winText.textContent = 'YOU ESCAPED!';
      winText.style.position = 'absolute';
      winText.style.left = `${character1Pos.x}px`;
      winText.style.bottom = `${character1Pos.y + 80}px`;
      winText.style.fontSize = '24px';
      winText.style.fontWeight = 'bold';
      winText.style.color = 'lime';
      winText.style.textShadow = '2px 2px black';
      winText.style.zIndex = '15';
      gameContainer.appendChild(winText);

      document.getElementById("restartScreen").style.display = "flex";
    }

    function checkWinCondition() {
      const busX = window.innerWidth - 120 - 20;
      if (!hasTriggeredRightSideZombies && character1Pos.x >= busX - 300) {
        hasTriggeredRightSideZombies = true;
        spawnZombieWaveFromRight();
      }

      if (character1Pos.x >= busX - 60) {
        gameWin();
      }
    }

    function spawnZombieWaveFromRight(count = 3) {
      for (let i = 0; i < count; i++) {
        const delay = i * 500;
        const timeout = setTimeout(() => {
          const zombie = document.createElement("img");
          zombie.src = "assets/zombie-run-left.gif";
          zombie.style.position = 'absolute';
          zombie.style.height = '60px';
          zombie.style.width = '60px';
          zombie.classList.add("character");

          const startX = window.innerWidth + Math.floor(Math.random() * 100);
          const startY = 0;
          zombie.style.left = `${startX}px`;
          zombie.style.bottom = `${startY}px`;
          gameContainer.appendChild(zombie);

          const newZombie = {
            el: zombie,
            fromLeft: false,
            pos: { x: startX, y: startY },
            speed: 1,
            hits: 0,
            hitThreshold: Math.floor(Math.random() * 2) + 3,
            dead: false
          };

          zombies.push(newZombie);
          zombieCount++;
        }, delay);
        zombieWaveTimeouts.push(timeout);
      }
    }

    const gameLoop = setInterval(() => {
      runAway();
      moveZombies();
      checkWinCondition();
    }, 10);

    const spawnLoop = setInterval(spawnZombie, spawnInterval);

    function addArmoredBus() {
      const bus = document.createElement("img");
      bus.src = "assets/armored-bus.png";
      bus.style.position = "absolute";
      bus.style.width = "300px";
      bus.style.height = "120px";
      bus.style.right = "20px";
      bus.style.bottom = "0";
      bus.style.zIndex = "10";
      gameContainer.appendChild(bus);
    }

    function addGuitarCharacter() {
      const guitarCharacter = document.createElement("img");
      guitarCharacter.src = "assets/guitar-character.gif";
      guitarCharacter.style.position = "absolute";
      guitarCharacter.style.width = "65px";
      guitarCharacter.style.height = "65px";
      guitarCharacter.style.right = "160px";
      guitarCharacter.style.bottom = "100px";
      guitarCharacter.style.zIndex = "10";
      gameContainer.appendChild(guitarCharacter);
    }

    addArmoredBus();
    addGuitarCharacter();
  }
});
