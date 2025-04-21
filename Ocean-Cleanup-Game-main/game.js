// will not separate files for now because no bundler + CORS prevents files from being split into modules

function scaleVector(x, y, length) {
    const distance = dist(0, 0, x, y);
    x = x / distance * length;
    y = y / distance * length;
    return [x, y];
}

/**
 * Modulus. Like remainder but also for negative numbers.
 * mod(420, 69) = 6; mod(-69, 420) = 351;
 * @param num Dividend
 * @param divisor Divisor
 * @returns Mod
 */
function mod(num, divisor) {
    return ((num % divisor) + divisor) % divisor;
}

/**
 * Create an element but stupid
 * @param type Type of element
 * @param properties Element properties set using regular object properties
 * @param children List of element's childrens, added with appendChild
 * @return Element
 */
function createElem(type, properties = {}, styles = {}, ...children) {
    const elem = document.createElement(type);
    Object.assign(elem, properties);
    Object.assign(elem.style, styles);
    for (const child of children) {
        elem.appendChild(child);
    }
    return elem;
}

/**
 * Bound a number between min and max
 * @value value to bound
 * @min minimum
 * @max maximum
 * @return bounded value
 */
function bound(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

/**
 * Polar coordinates to cartesian coordinates
 * @param r Radius
 * @param theta Angle in radians, including coterminal
 * @returns Cartesian [x, y]
 */
function polarToCartesian(radius, rotation) {
    return [Math.cos(rotation) * radius, Math.sin(rotation) * radius];
}

/**
 * Distance between two cartesian points using pythagorean theorems.
 * @param x1 X coordinate of first point
 * @param y1 Y coordinate of first point
 * @param x2 X coordinate of second point
 * @param y2 Y coordinate of second point
 * @returns Distance
 */
function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Angle between two radian points. May handle negatives. Will not handle coterminal angles.
 * @param one First radian angle
 * @param two Second radian angle
 * @returns Possibly negative difference in radians
 */
function angleDiff(one, two) {
    // dont ask me what this is
    return mod((one - two) + Math.PI, 2 * Math.PI) - Math.PI;
}

class Entity {
    /**
     * @param x Entity topleft Cartesian X coordinate in tiles
     * @param y Entity Y coordinate
     * @param speed Speed in tiles / frame
     * @param imgSrc Path to this entity's image
     */
    constructor(x, y, speed, imgSrc, parentElem, size = 1) {
        // move them comments into jsdoc
        this.oldX = NaN; // x coordinate from previous frame, used to update image only when necessary
        this.oldY = NaN; // old y coordinate
        this.oldRotation = 0; // old rotation
        this.x = x;
        this.y = y;
        this.rotation = 0; // rotation in radians
        this.speed = speed;
        this.image = createElem("img", {src: imgSrc, width: size * tileSize}, {position: "absolute", left: "0", top: "0"});
        // methinks messing with the DOM in an requestAnimationFrame is slow or smth
        this.parentElem = parentElem;
        this.parentElem.appendChild(this.image);
        this.rotationCenter = [0, 0]
        this.imgHeight = this.image.offsetHeight;
        this.imgWidth = size * tileSize;
    }

    update() {
        this.x = bound(this.x, 0, mapWidth - 1);
        this.y = bound(this.y, 0, mapHeight - 1);
        if (this.oldX !== this.x || this.oldY !== this.y || this.rotation !== this.oldRotation) {
            this.image.style.transform = `translate(${this.x * tileSize - this.imgWidth * this.rotationCenter[0] / 100}px, ${this.y * tileSize - this.imgHeight * this.rotationCenter[1] / 100}px) rotate(${this.rotation}rad)`;
        }
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldRotation = this.rotation;
    }

    oof() {
        this.image.remove();
    }
}

const keys = new Map();
// they dont pay me enough
addEventListener("keydown", event => {
    keys.set(event.key.toLowerCase(), true)
});
addEventListener("keyup", event => {
    keys.set(event.key.toLowerCase(), false);
});
function idkAlert(message) {
    for (const key of keys.keys()) {
        keys.set(key, false);
    }
    alert(message);
}
window.addEventListener("blur", () => {
    for (const key of keys.keys()) {
        keys.set(key, false);
    }
});

class Player extends Entity {
    constructor(x, y, parentElem, tool, shits) {
        const boats = [["img/noSwim.png", 1], ["img/lvl2boat.png", 3], ["img/jetski.png", 1]];
        const boatNum = bound(Number(localStorage.getItem("boat") ?? 0), 0, boats.length - 1);
        super(x, y, 0.1 * (Number(localStorage.getItem("speed") ?? 0) + 1) + 0.05 * boatNum, boats[boatNum][0], parentElem, boats[boatNum][1]);
        this.boat = boatNum > 0;
        this.maxHealth = 100 + 5 * Number(localStorage.getItem("health") ?? 0);
        this.health = this.maxHealth;
        this.healthBar = createElem("meter", {max: this.maxHealth, width: tileSize, value: this.maxHealth}, {position: "absolute", left: "0", top: "0"});
        this.defense = 1 * 0.85 ** Number(localStorage.getItem("armor") ?? 0);
        this.parentElem.appendChild(this.healthBar);
        this.shits = shits;
        this.tool = tool;
        parentElem.addEventListener("click", () => {
            this.tool.grabShit(this.shits);
        })
        // im sure throwing this shit in an event listener will have absolutely no problems with rotation change detection in update()
        this.parentElem.addEventListener("mousemove", event => {
            this.tool.rotation = Math.atan2((event.pageY - topOffset) / tileSize - this.y - 0.5, event.pageX / tileSize - this.x - 0.5);
        });
        this.money = Number(localStorage.getItem("money")) ?? 0;
        if (boatNum > 0) {
            this.rotationCenter = [50, 50];
            this.imgHeight = this.image.offsetHeight;
        }

        setInterval(() => {
            if (this.health < 0.8 * this.maxHealth) {
                this.health = bound(this.health + 3, 0, this.maxHealth);
            }
        }, 1000 * 0.9 ** Number(localStorage.getItem("regen") ?? 0))
    }

    takeDamage(amount) {
        amount *= this.defense;
        this.health = bound(this.health - amount, 0, this.maxHealth);
        const damageNoise = createElem("audio", {src: `noise/hit${Math.floor(Math.random() * 3) + 1}.mp3`});
        damageNoise.play();
        damageNoise.remove();
    }

    update() {
        if (this.imgHeight === 0) {
            this.imgHeight = this.image.offsetHeight;
        }
        if (keys.get("w")) {
            this.y -= this.speed;
        }
        if (keys.get("s")) {
            this.y += this.speed;
        }
        if (keys.get("a")) {
            this.x -= this.speed;
        }
        if (keys.get("d")) {
            this.x += this.speed;
        }
        if ((this.x !== this.oldX || this.y !== this.oldY) && !isNaN(this.oldX) && !isNaN(this.oldY)) {
            this.rotation = Math.atan2(this.y - this.oldY, this.x - this.oldX);
            if (!this.boat) {
                this.image.src = "img/swimRight.png";
            }
        } else if (!this.boat) {
            this.image.src = "img/noSwim.png";
        }
        if (dist(this.x, this.y, trashPos[0], trashPos[1]) < 2 && this.tool.shit.length > 0) {
            if (this.money % 3 === 0) {
                this.promptQuestion();
            }
            this.money += this.tool.depositShit();
            localStorage.setItem("money", this.money);
            document.getElementById("trashCounter").textContent = `Trash: ${this.money}`;

            const noise = createElem("audio", {src: "noise/emptyTrash.mp3"});
            noise.play();
            noise.remove();
        }
        this.tool.x = this.x + 0.5;
        this.tool.y = this.y + 0.5;
        this.tool.update();
        this.healthBar.value = this.health;
        this.healthBar.style.transform = `translate(${this.x * tileSize - this.imgWidth * this.rotationCenter[0] / 100}px, ${this.y * tileSize + this.imgHeight}px)`;
        super.update();
    }

    // Function to prompt the user with a question
    promptQuestion() {
        const questions = [
            ["Where does a banana peel go", "compost"],
            ["Where does a plastic water bottle go", "recycle"],
            ["Where does a Aluminum soda can go", "recycle"],
            ["Where does a Broken glass jar go?", "trash"],
            ["Where does an Apple core go?", "compost"],
            ["Where does a Empty plastic yogurt container go?", "recycle"],
            ["Where does a Plastic shopping bag go?", "trash"],
            ["Where does a Newspaper go?", "recycle"],
            ["Where does an Egg carton (styrofoam) go?", "trash"],
            ["Where does a Cheese wrapper (plastic) go?", "trash"],
            ["Where does a Pineapple top go?", "compost"],
            ["Where does a clean Pizza box go?", "recycle"],
            ["Where does a Toothpaste tube go?", "trash"],
            ["Where does a Orange peel go?", "compost"],
            ["Where does a Tissue (used) go?", "trash"],
            ["Where does a Plastic milk jug go?", "recycle"],
            ["Where does a Eggshells go?", "compost"],
        ];
        const question = questions[Math.floor(Math.random() * questions.length)]
        
        const fact = [
            "Community Gardens - People grow their own food together.",
            "Bike Share - Rent bikes to reduce car use.",
            "Upcycling Workshops - Turn old stuff into new things.",
            "Reusable Bags - Use bags that can be reused instead of plastic.",
            "Zero-Waste Markets - Shops with no packaging or waste.",
            "Solar Streetlights - Lights powered by the sun.",
            "Repair Cafes - Fix things instead of throwing them out.",
            "Car-Free Days - Days when no cars are allowed in certain areas.",
            "Rainwater Collection - Save rainwater for use later.",
            "Tree Planting - Plant trees to help the environment.",
            "Green Buildings - Buildings designed to save energy."
        ];

        const userAnswer = prompt(question[0] + " (compost, recycle, trash)");
        if (userAnswer !== null && prefixDLev(userAnswer, question[1]) < 3) {
            idkAlert("Correct! You get your trash");
            idkAlert(fact[Math.floor(Math.random() * fact.length)])
        } else {
            idkAlert(`Incorrect answer. Answer was ${question[1]}. Try again!`);
            this.promptQuestion();
        }
    }
}

class Tool extends Entity {
    constructor(imgSrc, parentElem) {
        super(-69, -420, 1, imgSrc, parentElem);
        this.shit = [];
        this.maxCapacity = 1 + Number(localStorage.getItem("capacity") ?? 0);
        this.image.style.zIndex = 1;
    }

    grabShit() {
        throw new Error("override this you idiot")
    }

    depositShit() {
        let value = 0;
        for (const shit of this.shit) {
            value += shit.value;
            shit.oof();
        }
        this.shit = [];
        trashElem.src = "img/trash.png";
        return value;
    }

    update() {
        if (this.shit.length === this.maxCapacity && trashElem.src !== "img/trashActive.png") {
            trashElem.src = "img/trashActive.png";
        }
        super.update();
    }
}

class Net extends Tool {
    constructor(parentElem, grabberLength, grabRadius) {
        super("img/net.png", parentElem);
        // this.image.src = "img/net.png";
        // this.imgHeight = this.image.offsetHeight
        this.grabberLength = grabberLength;
        this.grabRadius = grabRadius;
        this.rotationCenter = [0, 18];
        this.image.style.transformOrigin = `${this.rotationCenter[0]}% ${this.rotationCenter[1]}%`
    }

    grabShit(shits) {
        if (this.shit.length >= this.maxCapacity) {
            idkAlert("You can't hold more trash. Drop off your trash at the trash can.");
            return;
        }
        const netPos = polarToCartesian(this.grabberLength, this.rotation);
        netPos[0] += this.x;
        netPos[1] += this.y;
        for (const shit of shits) {
            if (dist(netPos[0], netPos[1], shit.x, shit.y) <= this.grabRadius && !shit.dead) {
                this.shit.push(shit)
                shit.oof();
                const pickupNoise = createElem("audio", {src: "noise/pickup.mp3"});
                pickupNoise.play();
                pickupNoise.remove();
                return;
            }
        }
    }
}

class HarpoonGun extends Tool {
    constructor(fireCooldownMs, projectiles, parentElem) {
        super("img/harpoon.png", parentElem);
        this.projectiles = projectiles;
        // this.image.src = "../img/harpoon.png";
        // this.imgHeight = this.image.offsetHeight;
        this.fireCooldownMs = fireCooldownMs;
        this.fire = true;
    }

    grabShit(shits) {
        if (!this.fire) {
            return;
        }
        if (this.shit.length >= this.maxCapacity) {
            idkAlert("You can't hold more trash. Drop off your trash at the trash can.");
            return;
        }
        this.fire = false;

        const noise = createElem("audio", {src: "noise/harpoon.mp3"});
        noise.play();
        noise.remove();

        setTimeout(() => {
            this.fire = true;
        }, this.fireCooldownMs);
        this.projectiles.push(new Harpoon(this.x, this.y, polarToCartesian(1, this.rotation), 0.1 * 1.1 ** (Number(localStorage.getItem("coffee") ?? 0)), shits, this.parentElem, shit => {
            this.shit.push(shit);
            shit.oof();
        }));
    }
}

class Shit extends Entity {
    constructor(x, y, speed, parentElem, trashImgs, value = 1) {
        super(x, y, speed, trashImgs[Math.floor(Math.random() * trashImgs.length)], parentElem);
        this.value = value;
        this.dead = false;
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class MovingShit extends Shit {
    constructor(x, y, parentElem, trashImgs, value = 1) {
        super(x, y, 0.01, parentElem, trashImgs, value);
        this.driftDirection = ["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
        this.driftCounter = 0;
        this.maxDriftFrames = Math.floor(Math.random() * 300);
    }

    update() {
        if (this.dead) {
            return;
        }
        if (this.driftDirection === "up") {
            this.y -= this.speed;
        } else if (this.driftDirection === "down") {
            this.y += this.speed;
        } else if (this.driftDirection === "left") {
            this.x -= this.speed;
        } else if (this.driftDirection === "right") {
            this.x += this.speed;
        }
        this.driftCounter++;
        if (this.driftCounter >= this.maxDriftFrames) {
            this.driftCounter = 0;
            this.driftDirection = ["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
            this.maxDriftFrames = Math.floor(Math.random() * 300);
        }
        super.update();
    }
}

class Harpoon extends Entity {
    constructor(x, y, moveVector, speed, victims, parentElem, onAttack) {
        super(x, y, speed, "img/harpoonProjectile.png", parentElem);
        this.rotation = Math.atan2(moveVector[1], moveVector[0]);
        this.moveVector = scaleVector(moveVector[0], moveVector[1], speed);
        this.rotationCenter = [0, 50];
        this.victims = victims;
        this.dead = false;
        this.onAttack = onAttack;
    }

    update() {
        if (this.dead) {
            return;
        }
        this.x += this.moveVector[0];
        this.y += this.moveVector[1];
        if (this.x < 0 || this.y < 0 || this.x >= mapWidth - 1 || this.y >= mapWidth - 1) {
            this.oof();
            return;
        }
        for (const victim of this.victims) {
            if (dist(this.x, this.y, victim.x, victim.y) < 1 && !victim.dead) {
                this.onAttack(victim);
                this.oof();
                const pickupNoise = createElem("audio", {src: "noise/pickup.mp3"});
                pickupNoise.play();
                pickupNoise.remove();
                return;
            }
        }
        super.update();
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class TrashProjectile extends Entity {
    constructor(x, y, moveVector, speed, victims, damage, parentElem, onAttack = victim => victim.takeDamage(damage)) {
        let imgSrc = "";
        if (Math.abs(moveVector[0]) > Math.abs(moveVector[1])) {
            if (moveVector[0] < 0) {
                imgSrc = "img/projectileLeft.png";
            } else if (moveVector[0] > 0) {
                imgSrc = "img/projectileRight.png";
            }
        } else {
            if (moveVector[1] < 0) {
                imgSrc = "img/projectileUp.png";
            } else {
                imgSrc = "img/projectileDown.png"
            }
        }
        super(x, y, speed, imgSrc, parentElem);
        this.victims = victims;
        this.damage = damage;
        this.moveVector = scaleVector(moveVector[0], moveVector[1], this.speed);
        this.dead = false;
        this.onAttack = onAttack;
    }

    update() {
        if (this.dead) {
            return;
        }
        this.x += this.moveVector[0];
        this.y += this.moveVector[1];
        if (this.x < 0 || this.y < 0 || this.x >= mapWidth - 1 || this.y >= mapWidth - 1) {
            this.oof();
            return;
        }
        for (const victim of this.victims) {
            if (dist(this.x, this.y, victim.x, victim.y) < 1) {
                this.onAttack(victim);
                this.oof();
                return;
            }
        }
        super.update();
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class AttackingShit extends Shit {
    constructor(projectileSpeed, speed, victim, projectiles, x, y, parentElem, trashImgs, value = 1) {
        super(x, y, speed, parentElem, trashImgs, value);
        this.victim = victim;
        this.attackCooldown = Math.floor(Math.random() * 300) + 300;
        this.projectiles = projectiles;
        this.projectileSpeed = projectileSpeed
    }

    update() {
        if (this.dead) {
            return;
        }
        if (dist(this.x, this.y, this.victim.x, this.victim.y) < 3) {
            const moveVector = scaleVector(this.x - this.victim.x, this.y - this.victim.y, this.speed);
            this.x += moveVector[0];
            this.y += moveVector[1];
        }

        this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            this.attackCooldown = Math.floor(Math.random() * 300) + 300;
            this.projectiles.push(new TrashProjectile(this.x, this.y, [this.victim.x - this.x, this.victim.y - this.y], this.projectileSpeed, [this.victim], 10, this.parentElem));
        }
        super.update();
    }
}

class Oil extends Entity {
    constructor(x, y, victims, damage, parentElem) {
        super(x, y, 0, "img/oil.png", parentElem);
        this.damage = damage;
        this.victims = victims;
        this.damaged = false;
    }

    update() {
        super.update();
        if (this.damaged) {
            return;
        }
        for (const victim of this.victims) {
            if (dist(this.x, this.y, victim.x, victim.y) < 1.5) {
                victim.takeDamage(victim.boat ? this.damage * 0.3 : this.damage);
                this.damaged = true;
                setTimeout(() => this.damaged = false, 500);
            }
        }
    }
}

class TheFinalWeapon extends Tool {
    constructor(oscar, parentElem) {
        super("img/thefinalweapon.png", parentElem);
        this.image.style.width = "auto";
        this.image.height = 2 * tileSize;
        this.image.imgHeight = this.image.offsetHeight;
        this.image.imgWidth = this.image.offsetWidth;
        this.oscar = oscar;
        this.fireCooldown = false;
        this.image.style.transformOrigin = "0 50%";
        this.rotationCenter = [0, 50];
        this.timeout = NaN;
        this.loopNoise = undefined;
        this.hitOscar = false;
    }
    
    endLaser() {
        this.image.src = "img/thefinalweapon.png";
        this.image.imgHeight = this.image.offsetHeight;
        this.image.imgWidth = this.image.offsetWidth;
        if (this.loopNoise !== undefined) {
            this.loopNoise.loop = false;
            this.loopNoise.pause();
            this.loopNoise.remove();
            this.loopNoise = undefined;
        }
        this.timeout = NaN;
        this.hitOscar = false;
    }

    update() {
        if (!isNaN(this.timeout)) {
            const thisToOscar = Math.atan2(this.oscar.y + Oscar.size / 2 - this.y, this.oscar.x + Oscar.size / 2 - this.x);
            let hitSomething = false;
            if (Math.abs(angleDiff(thisToOscar, this.rotation)) < Math.PI / 16) {
                this.hitOscar = true;
                hitSomething = true;
            }
            for (const shit of this.oscar.shits) {
                const thisToShit = Math.atan2(shit.y - this.y, shit.x - this.x);
                if (Math.abs(angleDiff(thisToShit, this.rotation)) < Math.PI / 32) {
                    shit.oof();
                    hitSomething = true;
                }
            }
            if (!hitSomething) {
                this.endLaser();
            }
        }
        super.update();
    }
    
    grabShit() {
        if (this.fireCooldown) {
            return;
        }
        this.image.src = "img/finalweaponlaser.png";
        this.image.imgHeight = this.image.offsetHeight;
        this.image.imgWidth = this.image.offsetWidth;
        this.fireCooldown = true;
        setTimeout(() => {
            this.fireCooldown = false;
        }, 5000 * 0.9 ** (Number(localStorage.getItem("coffee") ?? 0)));

        const startNoise = createElem("audio", {src: "noise/laser_start.mp3"});
        startNoise.play();
        startNoise.remove();

        this.loopNoise = createElem("audio", {src: "noise/laser_loop.mp3", loop: true});
        this.loopNoise.play();

        this.timeout = setTimeout(() => {
            if (this.hitOscar) {
                this.oscar.health -= 10;
                const hit = createElem("audio", {src: `noise/oscar/hit${Math.floor(Math.random() * 4) + 1}.mp3`});
                hit.play();
                hit.remove();
            }
            this.endLaser();
        }, 3000 * 0.9 ** Number(localStorage.getItem("coffee") ?? 0));
    }
}

class Oscar extends Shit {
    static size = 3
    
    constructor(x, y, victims, parentElem, projectiles) {
        super(x, y, 0.1, parentElem, ["img/oscar.png"], 5);
        this.image.width = Oscar.size * tileSize;
        this.imgWidth *= Oscar.size;
        this.imgHeight *= Oscar.size;
        this.projectiles = projectiles;
        this.shits = [];
        this.oilCooldown = 1;
        this.trashCooldown = 300;
        this.shootCooldown = 100;
        this.health = 200;
        this.dead = false;
        this.victims = victims;
    }

    findDestination() {
        return [bound(this.x + Oscar.size / 2 + Math.floor(Math.random() * 20) - 10, 0, mapWidth), bound(this.y + Oscar.size / 2 + Math.floor(Math.random() * 20) - 10, 0, mapHeight)];
    }
    
    update() {
        if (this.health <= 0) {
            this.oof();
        }
        this.oilCooldown--;
        if (this.oilCooldown <= 0) {
            this.oilCooldown = Math.floor(Math.random() * 200);
            this.projectiles.push(new Oil(...this.findDestination(), this.victims, 10, this.parentElem));
        }
        this.trashCooldown--;
        if (this.trashCooldown <= 0) {
            this.trashCooldown = 300;
            this.shits.push(new AttackingShit(0.05, 0, this.victims[0], this.projectiles, ...this.findDestination(), this.parentElem, [1, 2, 3, 4, 5, 6].map(number => `img/trash${number}.png`), 1));
        }
        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shootCooldown = Math.floor(Math.random() * 100) + 200;
            this.projectiles.push(new TrashProjectile(this.x, this.y, [this.victims[0].x - this.x, this.victims[0].y - this.y], 0.2, this.victims, 5, this.parentElem, victim => victim.takeDamage(20)))
        }
        this.shits = this.shits.filter(shit => {
            shit.update();
            return !this.dead;
        })
        super.update();
    }

    oof() {
        const die = createElem("audio", {src: "noise/oscar/end.mp3"});
        die.play();
        die.remove();
        super.oof();
    }
}

// global variable spam cuz they dont pay me enough
const tileSize = 50;
const topOffset = 100;
const mapWidth = 40;
const mapHeight = 40;
const trashPos = [0, 0];

const trashElem = createElem("img", {src: "img/trash.png", width: tileSize, height: tileSize}, {position: "absolute", left: `${trashPos[0] * tileSize}px`, top: `${trashPos[1] * tileSize}px`});

addEventListener("DOMContentLoaded", () => {
    document.getElementById("trashCounter").textContent = `Trash: ${localStorage.getItem("money") ?? 0}`;
    document.getElementById("resetBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.reload();
    })
    document.getElementById("playButton").addEventListener("click", () => {
        if (localStorage.getItem("startTime") === null) {
            localStorage.setItem("startTime", Date.now());
        }
        document.body.style.backgroundImage = "url('img/background.png')";
        document.getElementById("playScreen").style.display = "none";
        const gameDiv = createElem("div", {}, {position: "absolute", left: "0", top: `${topOffset}px`, overflow: "hidden", display: "block", width: `${tileSize * mapWidth}px`, height: `${tileSize * mapHeight}px`, userSelect: "none", border: "solid 5px black"});
        gameDiv.appendChild(createElem("audio", {src: "noise/ocean.mp3", loop: true, autoplay: true, }))
        gameDiv.addEventListener("dragstart", event => event.preventDefault());
        gameDiv.appendChild(trashElem);
        document.body.appendChild(gameDiv);

        let shit = [];
        const projectiles = [];
        const tool = localStorage.getItem("harpoon") ? new HarpoonGun(1000 * 0.9 ** (Number(localStorage.getItem("coffee") ?? 0)), projectiles, gameDiv) : new Net(gameDiv, 1, 1);
        const player = new Player(5, 5, gameDiv, tool, shit);
        for (let i = 0; i < Math.floor(Math.random() * 10) + 10; i++) {
            shit.push(new MovingShit(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash1.png", "img/trash3.png"]));
            projectiles.push(new Oil(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), [player], 10, gameDiv));
        }
        let level = 0;
        
        function gameLoop() {
            player.update();
            if (shit.length === 0) {
                idkAlert("You are now on level " + (level + 1));
                if (level === 0) {
                    for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
                        shit.push(new AttackingShit(0.05, 0, player, projectiles, Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash2.png", "img/trash4.png", "img/trash6.png"], 2));
                    }
                    for (let i = 0; i < Math.floor(Math.random() * 20) + 20; i++) {
                        projectiles.push(new Oil(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), [player], 10, gameDiv));
                    }
                } else if (level === 1) {
                    for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
                        shit.push(new AttackingShit(0.07, 0.02, player, projectiles, Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["img/trash2.png", "img/trash4.png", "img/trash5.png"], 2));
                    }
                } else if (level == 2) {
                    player.tool.oof();
                    const spawn = createElem("audio", {src: "noise/oscar/spawn.mp3"});
                    spawn.play();
                    spawn.remove();
                    const oscar = new Oscar(Math.floor(Math.random() * (mapWidth - 5)), Math.floor(Math.random() * (mapHeight - 5)), [player], gameDiv, projectiles);
                    player.tool = new TheFinalWeapon(oscar, gameDiv);
                    shit.push(oscar);
                }
                level++;
            }
            shit = shit.filter(thing => {
                thing.update();
                return !thing.dead;
            });
            for (const projectile of projectiles) {
                projectile.update();
            }
            player.shits = shit;
            window.scrollTo(player.x * tileSize - screen.availWidth / 2, player.y * tileSize - screen.availHeight / 2);
            if (player.health <= 0) {
                const oof = createElem("audio", {src: "noise/oof.mp3"});
                oof.play();
                oof.remove();
                idkAlert("you died score 0");
                localStorage.clear();
                cleanUp();
            } else if (level === 4) {
                cleanUp();
                idkAlert("You win!");
            } else {
                requestAnimationFrame(gameLoop);
            }
        }
        requestAnimationFrame(gameLoop);
        function cleanUp() {
            gameDiv.remove();
            document.getElementById("playScreen").style.display = "flex";
            document.getElementById("trashCounter").textContent = "Trash: 0";
            document.body.style.backgroundImage = "url('img/pixil-frame-0.png')";
            localStorage.removeItem("startTime");
            document.getElementById("timer-display").textContent = "0 : 0 : 0";
        }
    });
    
})

function dLev(one, two) {
    let alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890- \'.,';
    let da = new Array(alphabet.length).fill(0);
    let matrix = new Array(one.length + 2).fill(0).map(() => new Array(two.length + 2).fill(0));
    let maxDist = one.length + two.length;
    matrix[0][0] = maxDist;
    for (let i = 0; i <= one.length; i++) {
        if (i > 0 && alphabet.indexOf(one[i - 1]) === -1) {
            alphabet += one[i - 1];
            da.push(0);
        }
        matrix[i + 1][0] = maxDist;
        matrix[i + 1][1] = i;
    }
    for (let i = 0; i <= two.length; i++) {
        if (i > 0 && alphabet.indexOf(two[i - 1]) === -1) {
            alphabet += two[i - 1];
            da.push(0);
        }
        matrix[0][i + 1] = maxDist;
        matrix[1][i + 1] = i;
    }
    for (let i = 1; i <= one.length; i++) {
        let db = 0;
        for (let j = 1; j <= two.length; j++) {
            let k = da[alphabet.indexOf(two[j - 1])];
            let l = db;
            let cost = 1;
            if (one[i - 1] === two[j - 1]) {
                cost = 0;
                db = j;
            }
            matrix[i + 1][j + 1] = Math.min(matrix[i][j] + cost, matrix[i + 1][j] + 1, matrix[i][j + 1] + 1, matrix[k][l] + (i - k - 1) + 1 + (j - l - 1));
        }
        da[alphabet.indexOf(one[i - 1])] = i;
    }
    return matrix[one.length + 1][two.length + 1];
}

function prefixDLev(one, two) {
    return dLev(one.substring(0, two.length), two);
}

setInterval(() => {
    const startTime = localStorage.getItem("startTime");
    if (startTime === null) {
        document.getElementById("timer-display").textContent = "0 : 0 : 0";
        return;
    }
    const elapsedTime = Date.now() - Number(startTime);
    const milliseconds = elapsedTime % 1000;
    const seconds = Math.floor(elapsedTime / 1000) % 60;
    const minutes = Math.floor(elapsedTime / 60 / 1000);
    document.getElementById("timer-display").textContent = `${minutes} : ${seconds} : ${milliseconds}`;
})
