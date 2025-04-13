document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById("gameContainer");

  // Player character
  const character1 = document.createElement("img");
  character1.src = "assets/player-run-right.gif";
  character1.alt = "Character 1";
  character1.classList.add("character");
  gameContainer.appendChild(character1);

  // Initial positions
  let character1Pos = { x: -100, y: 0 };
  character1.style.left = `${character1Pos.x}px`;
  character1.style.bottom = `${character1Pos.y}px`;

  let isShooting = false;
  let shootInterval = null;
  let isGameOver = false;
  let isJumping = false;
  let jumpHeight = 0;
  let jumpSpeed = 4;
  const gravity = 0.5;

  let movingLeft = false;
  let movingRight = true;
  let pastMovement = 'right';

  // Bullets
  let bullets = [];

  // Zombies
  let zombieCount = 0;
  let maxZombies = 15;
  const spawnInterval = 2000; // 10 seconds

  // sound
  const gunshotAudio = new Audio('assets/sound/gunshot.mp3');
  gunshotAudio.volume = 0.2; // optional volume control


  // Background Music
  const bgMusic = new Audio('assets/sound/background-music_01.mp3');
  bgMusic.loop = true;       
  bgMusic.volume = 0.5;      // Set volume (0 to 1)
  bgMusic.play().catch(() => {
    // Autoplay might be blocked — can be triggered on user interaction
    document.addEventListener('keydown', () => {
      bgMusic.play();
    }, { once: true });
  });

  // --- PLAYER ACTIONS ---

  function runAway() {
    const speed = 1.2;
    if (movingRight) character1Pos.x += speed;
    if (movingLeft) character1Pos.x -= speed;
    character1.style.left = `${character1Pos.x}px`;
  }

  function jump() {
    if (isJumping) {
      character1Pos.y += jumpSpeed;
      jumpHeight += jumpSpeed;
      if (jumpHeight > 100) jumpSpeed = -4;
      if (character1Pos.y <= 0) {
        character1Pos.y = 0;
        isJumping = false;
        jumpSpeed = 4;
        jumpHeight = 0;
      }
      character1.style.bottom = `${character1Pos.y}px`;
    }
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
    } else if (event.key === "ArrowUp" && !isJumping) {
      stopShooting();
      isJumping = true;
    } else if (event.code === "Space" && !isShooting) {
      startShooting();
    }
  });

  function shoot() {
    const bullet = document.createElement('img');
    bullet.src = "assets/bullet-left.png";
    bullet.style.position = 'absolute';
    bullet.style.height = '5px';
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
    // Rewind to start if already playing
    gunshotAudio.currentTime = 0;
    gunshotAudio.play();
  }

  // --- ZOMBIE SYSTEM ---

  let zombies = [];

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
  
    // 👇 Set zombie image based on direction
    zombie.src = fromLeft ? "assets/zombie-run-right.gif" : "assets/zombie-run-left.gif";
  
    zombie.style.left = `${startX}px`;
    zombie.style.bottom = `${startY}px`;
  
    gameContainer.appendChild(zombie);
  
    const newZombie = {
      el: zombie,
      fromLeft,
      pos: { x: startX, y: startY },
      speed: 0.9,
      hits: 0,
      hitThreshold: Math.floor(Math.random() * 3) + 2, // 2-4 hits
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

  // --- GAME OVER ---

  function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    movingLeft = false;
    movingRight = false;
    stopShooting();

    character1.src = "assets/splash.gif";
    character1.style.height = '120px';
    character1.style.width = '120px';

    const censoredText = document.createElement('div');
    censoredText.textContent = 'CENSORED';
    censoredText.style.position = 'absolute';
    censoredText.style.left = `${character1Pos.x - 18}px`;
    censoredText.style.bottom = `${character1Pos.y + 10}px`;
    censoredText.style.fontSize = '20px';
    censoredText.style.fontWeight = 'bold';
    censoredText.style.color = 'red';
    censoredText.style.textAlign = 'center';
    censoredText.style.zIndex = '15';
    gameContainer.appendChild(censoredText);

    clearInterval(gameLoop);
    clearInterval(spawnLoop);
  }

  // --- GAME LOOP ---

  const gameLoop = setInterval(() => {
    runAway();
    jump();
    moveZombies();
  }, 10);

  const spawnLoop = setInterval(spawnZombie, spawnInterval);
});
