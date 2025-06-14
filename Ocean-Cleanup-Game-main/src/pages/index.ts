import { createAchievementElem, doAchievement } from "../achievements"
import { angleDiff, bound, createElem, dist, playAudio, polarToCartesian, scaleVector } from "../randomShit"

// wow global variables
let oldScrollX = 0
let oldScrollY = 0
/* fakeScroll cuz
Cannot redeclare block-scoped variable 'scrollX'.ts(2451)
lib.dom.d.ts(28679, 13): 'scrollX' was also declared here.
*/
let fakeScrollX = 0
let fakeScrollY = 0
const frameMs = 1000 / 60;

class Entity {
    oldX = NaN
    oldY = NaN
    oldRotation = 0
    rotation = 0
    image: HTMLImageElement
    rotationCenter = [0, 0]
    imgHeight: number
    imgWidth: number

    /**
     * @param x Entity topleft Cartesian X coordinate in tiles
     * @param y Entity Y coordinate
     * @param speed Speed in tiles / frame
     * @param imgSrc Path to this entity's image
     */
    constructor(public x: number, public y: number, public speed: number, imgSrc: string, public parentElem: Node, size = 1) {
        // move them comments into jsdoc
        this.oldX = NaN; // x coordinate from previous frame, used to update image only when necessary
        this.oldY = NaN; // old y coordinate
        this.oldRotation = 0; // old rotation
        this.rotation = 0; // rotation in radians
        this.image = createElem("img", {src: imgSrc, width: size * tileSize}, {position: "absolute", left: "0", top: "0"}) as HTMLImageElement;
        // methinks messing with the DOM in an requestAnimationFrame is slow or smth
        this.parentElem.appendChild(this.image);
        this.rotationCenter = [0, 0]
        this.imgHeight = this.image.offsetHeight;
        this.imgWidth = size * tileSize;
    }

    update(_: number) {
        this.x = bound(this.x, 0, mapWidth - 1);
        this.y = bound(this.y, 0, mapHeight - 1);
        if (oldScrollX !== fakeScrollX || oldScrollY !== fakeScrollY || this.oldX !== this.x || this.oldY !== this.y || this.rotation !== this.oldRotation) {
            this.image.style.transform = `translate(${this.x * tileSize - this.imgWidth * this.rotationCenter[0] / 100 - fakeScrollX}px, ${this.y * tileSize - this.imgHeight * this.rotationCenter[1] / 100 - fakeScrollY}px) rotate(${this.rotation}rad)`;
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

// have to make this shitty alert function because holding down a key when an alert shows up will stop the key from holding down without firing a keyup event
function idkAlert(message: string) {
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
    static boats: [string, number][] = [["../img/noSwim.png", 1], ["../img/lvl2boat.png", 3], ["../img/jetski.png", 1]];
    boat: boolean
    maxHealth: number
    health: number
    healthBar: HTMLProgressElement
    defense: number
    money: number

    constructor(x: number, y: number, parentElem: Node, public tool: Tool, public shits: Shit[]) {
        const boatNum = bound(Number(localStorage.getItem("boat") ?? 0), 0, Player.boats.length - 1);
        super(x, y, 0.1 * (Number(localStorage.getItem("speed") ?? 0) + 1) + 0.05 * boatNum, Player.boats[boatNum][0], parentElem, Player.boats[boatNum][1]);
        this.boat = boatNum > 0;
        this.maxHealth = 100 + 5 * Number(localStorage.getItem("health") ?? 0);
        this.health = this.maxHealth;
        this.healthBar = createElem("meter", {max: this.maxHealth, width: tileSize, value: this.maxHealth}, {position: "absolute", left: "0", top: "0"}) as HTMLProgressElement;
        this.defense = 1 * 0.85 ** Number(localStorage.getItem("armor") ?? 0);
        this.parentElem.appendChild(this.healthBar);
        parentElem.addEventListener("click", () => {
            this.tool.grabShit(this.shits);
        })
        // im sure throwing this shit in an event listener will have absolutely no problems with rotation change detection in update()
        this.parentElem.addEventListener("mousemove", event => {
            this.tool.rotation = Math.atan2(((event as MouseEvent).pageY - topOffset + fakeScrollY) / tileSize - this.y - 0.5, ((event as MouseEvent).pageX + fakeScrollX) / tileSize - this.x - 0.5);
        });
        this.money = Number(localStorage.getItem("money") ?? 0);
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

    takeDamage(amount: number) {
        amount *= this.defense;
        this.health = bound(this.health - amount, 0, this.maxHealth);
        playAudio(`../noise/hit${Math.floor(Math.random() * 3) + 1}.mp3`);
    }

    update(deltaTime: number) {
        if (this.imgHeight === 0) {
            this.imgHeight = this.image.offsetHeight;
        }
        const speed = this.speed * deltaTime / frameMs;
        if (keys.get("w")) {
            this.y -= speed;
        }
        if (keys.get("s")) {
            this.y += speed;
        }
        if (keys.get("a")) {
            this.x -= speed;
        }
        if (keys.get("d")) {
            this.x += speed;
        }
        if ((this.x !== this.oldX || this.y !== this.oldY) && !isNaN(this.oldX) && !isNaN(this.oldY)) {
            this.rotation = Math.atan2(this.y - this.oldY, this.x - this.oldX);
            // gotta find some better way to track image source
            // pretty sure getting image.src is hella slow
            if (!this.boat && this.image.src !== "../img/swimRight.png") {
                this.image.src = "../img/swimRight.png";
            }
        } else if (!this.boat && this.image.src !== "../img/noSwim.png") {
            this.image.src = "../img/noSwim.png";
        }
        if (dist(this.x, this.y, trashPos[0], trashPos[1]) < 2 && this.tool.shit.length > 0) {
            if (this.money % 3 === 0) {
                this.promptQuestion();
            }
            this.money += this.tool.depositShit();
            localStorage.setItem("money", String(this.money));
            trashCounter.textContent = `Trash: ${this.money}`;

            playAudio("../noise/emptyTrash.mp3");
        }
        this.tool.x = this.x + 0.5;
        this.tool.y = this.y + 0.5;
        this.tool.update(deltaTime);
        this.healthBar.value = this.health;
        this.healthBar.style.transform = `translate(${this.x * tileSize - this.imgWidth * this.rotationCenter[0] / 100 - fakeScrollX}px, ${this.y * tileSize + this.imgHeight - fakeScrollY}px)`;
        super.update(deltaTime);
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
    shit: Shit[]
    maxCapacity: number

    constructor(imgSrc: string, parentElem: Node) {
        super(-69, -420, 1, imgSrc, parentElem);
        this.shit = [];
        this.maxCapacity = 1 + Number(localStorage.getItem("capacity") ?? 0);
        this.image.style.zIndex = "1";
    }

    grabShit(_: Shit[]) {
        throw new Error("override this you idiot")
    }

    depositShit() {
        let value = 0;
        for (const shit of this.shit) {
            value += shit.value;
            shit.oof();
        }
        this.shit = [];
        trashElem.src = "../img/trash.png";
        return value;
    }

    update(deltaTime: number) {
        if (this.shit.length === this.maxCapacity && trashElem.src !== "../img/trashActive.png") {
            trashElem.src = "../img/trashActive.png";
        }
        super.update(deltaTime);
    }
}

class Net extends Tool {
    constructor(parentElem: Node, private grabberLength: number, private grabRadius: number) {
        super("../img/net.png", parentElem);
        this.rotationCenter = [0, 18];
        this.image.style.transformOrigin = `${this.rotationCenter[0]}% ${this.rotationCenter[1]}%`
    }

    override grabShit(shits: Shit[]) {
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
                playAudio("../noise/pickup.mp3");
                return;
            }
        }
    }
}

class HarpoonGun extends Tool {
    fire = true

    constructor(private fireCooldownMs: number, private projectiles: {update: Entity["update"]}[], parentElem: Node) {
        super("../img/harpoon.png", parentElem);
    }

    grabShit(shits: Shit[]) {
        if (!this.fire) {
            return;
        }
        if (this.shit.length >= this.maxCapacity) {
            idkAlert("You can't hold more trash. Drop off your trash at the trash can.");
            return;
        }
        this.fire = false;

        playAudio("../noise/harpoon.mp3");

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
    dead = false

    constructor(x: number, y: number, speed: number, parentElem: Node, trashImgs: string[], public value = 1) {
        super(x, y, speed, trashImgs[Math.floor(Math.random() * trashImgs.length)], parentElem);
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

enum Direction {
    up,
    down,
    left,
    right,
}
const directions: Direction[] = [Direction.up, Direction.down, Direction.left, Direction.right];

class MovingShit extends Shit {
    driftDirection: Direction
    driftCounter = 0
    maxDriftFrames: number

    constructor(x: number, y: number, parentElem: Node, trashImgs: string[], value = 1) {
        super(x, y, 0.01, parentElem, trashImgs, value);
        this.driftDirection = directions[Math.floor(Math.random() * directions.length)];
        this.maxDriftFrames = Math.floor(Math.random() * 300);
    }

    update(deltaTime: number) {
        if (this.dead) {
            return;
        }
        const speed = this.speed * deltaTime / frameMs;
        if (this.driftDirection === Direction.up) {
            this.y -= speed;
        } else if (this.driftDirection === Direction.down) {
            this.y += speed;
        } else if (this.driftDirection === Direction.left) {
            this.x -= speed;
        } else if (this.driftDirection === Direction.right) {
            this.x += speed;
        }
        this.driftCounter++;
        if (this.driftCounter >= this.maxDriftFrames) {
            this.driftCounter = 0;
            this.driftDirection = directions[Math.floor(Math.random() * directions.length)];
            this.maxDriftFrames = Math.floor(Math.random() * 300);
        }
        super.update(deltaTime);
    }
}

class Harpoon extends Entity {
    moveVector: [number, number]
    dead = false

    constructor(x: number, y: number, moveVector: [number, number], speed: number, private victims: Shit[], parentElem: Node, private onAttack: (shit: Shit) => void) {
        super(x, y, speed, "../img/harpoonProjectile.png", parentElem);
        this.rotation = Math.atan2(moveVector[1], moveVector[0]);
        this.moveVector = scaleVector(moveVector[0], moveVector[1], speed);
        this.rotationCenter = [0, 50];
    }

    update(deltaTime: number) {
        if (this.dead) {
            return;
        }
        const conversionFactor = deltaTime / frameMs;
        this.x += this.moveVector[0] * conversionFactor;
        this.y += this.moveVector[1] * conversionFactor;
        if (this.x < 0 || this.y < 0 || this.x >= mapWidth - 1 || this.y >= mapWidth - 1) {
            this.oof();
            return;
        }
        for (const victim of this.victims) {
            if (dist(this.x, this.y, victim.x, victim.y) < 1 && !victim.dead) {
                this.onAttack(victim);
                this.oof();
                playAudio("../noise/pickup.mp3");
                return;
            }
        }
        super.update(deltaTime);
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class TrashProjectile extends Entity {
    moveVector: [number, number]
    dead = false
    
    constructor(x: number, y: number, moveVector: [number, number], speed: number, private victims: Player[], public damage: number, parentElem: Node, private onAttack = (victim: Player) => victim.takeDamage(damage)) {
        let imgSrc = "";
        if (Math.abs(moveVector[0]) > Math.abs(moveVector[1])) {
            if (moveVector[0] < 0) {
                imgSrc = "../img/projectileLeft.png";
            } else if (moveVector[0] > 0) {
                imgSrc = "../img/projectileRight.png";
            }
        } else {
            if (moveVector[1] < 0) {
                imgSrc = "../img/projectileUp.png";
            } else {
                imgSrc = "../img/projectileDown.png"
            }
        }
        super(x, y, speed, imgSrc, parentElem);
        this.moveVector = scaleVector(moveVector[0], moveVector[1], this.speed);
    }

    update(deltaTime: number) {
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
        super.update(deltaTime);
    }

    oof() {
        this.dead = true;
        super.oof();
    }
}

class AttackingShit extends Shit {
    attackCooldown: number

    constructor(private projectileSpeed: number, speed: number, private victim: Player, private projectiles: Entity[], x: number, y: number, parentElem: Node, trashImgs: string[], value = 1) {
        super(x, y, speed, parentElem, trashImgs, value);
        this.attackCooldown = Math.floor(Math.random() * 300) + 300;
    }

    update(deltaTime: number) {
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
        super.update(deltaTime);
    }
}

class Oil extends Entity {
    damaged = false;

    constructor(x: number, y: number, private victims: Player[], private damage: number, parentElem: Node) {
        super(x, y, 0, "../img/oil.png", parentElem);
    }

    update(deltaTime: number) {
        super.update(deltaTime);
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
    fireCooldown = false;
    timeout: Parameters<typeof clearInterval>[0] | undefined = undefined;
    loopNoise: HTMLAudioElement | undefined = undefined
    hitOscar = false;

    constructor(public oscar: Oscar, parentElem: Node) {
        super("../img/thefinalweapon.png", parentElem);
        this.image.style.width = "auto";
        this.image.height = 2 * tileSize;
        this.imgHeight = this.image.offsetHeight;
        this.imgWidth = this.image.offsetWidth;
        this.image.style.transformOrigin = "0 50%";
        this.rotationCenter = [0, 50];
    }
    
    endLaser() {
        this.image.src = "../img/thefinalweapon.png";
        this.imgHeight = this.image.offsetHeight;
        this.imgWidth = this.image.offsetWidth;
        if (this.loopNoise !== undefined) {
            this.loopNoise.loop = false;
            this.loopNoise.pause();
            this.loopNoise.remove();
            this.loopNoise = undefined;
        }
        this.timeout = undefined;
        this.hitOscar = false;
    }

    update(deltaTime: number) {
        if (this.timeout !== undefined) {
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
        super.update(deltaTime);
    }
    
    grabShit() {
        if (this.fireCooldown) {
            return;
        }
        this.image.src = "../img/finalweaponlaser.png";
        this.imgHeight = this.image.offsetHeight;
        this.imgWidth = this.image.offsetWidth;
        this.fireCooldown = true;
        setTimeout(() => {
            this.fireCooldown = false;
        }, 5000 * 0.9 ** (Number(localStorage.getItem("coffee") ?? 0)));

        playAudio("../noise/laser_start.mp3");

        this.loopNoise = createElem("audio", {src: "../noise/laser_loop.mp3", loop: true}) as HTMLAudioElement;
        this.loopNoise.play();

        this.timeout = setTimeout(() => {
            if (this.hitOscar) {
                this.oscar.health -= 10;
                playAudio(`../noise/oscar/hit${Math.floor(Math.random() * 4) + 1}.mp3`);
            }
            this.endLaser();
        }, 3000 * 0.9 ** Number(localStorage.getItem("coffee") ?? 0));
    }
}

class Oscar extends MovingShit {
    static size = 3
    oilCooldown = 1
    trashCooldown = 300
    shootCooldown = 100
    health = 200
    dead = false
    shits: Shit[] = []
    
    constructor(x: number, y: number, private victims: Player[], parentElem: Node, private projectiles: Entity[]) {
        super(x, y, parentElem, ["../img/oscar.png"], 5);
        this.image.width = Oscar.size * tileSize;
        this.imgWidth *= Oscar.size;
        this.imgHeight *= Oscar.size;
    }

    findDestination(): [number, number] {
        return [bound(this.x + Oscar.size / 2 + Math.random() * 20 - 10, 0, mapWidth), bound(this.y + Oscar.size / 2 + Math.random() * 20 - 10, 0, mapHeight)];
    }
    
    update(deltaTime: number) {
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
            this.shits.push(new AttackingShit(0.1, 0, this.victims[0], this.projectiles, ...this.findDestination(), this.parentElem, [1, 2, 3, 4, 5, 6].map(number => `../img/trash${number}.png`), 1));
        }
        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shootCooldown = Math.floor(Math.random() * 100) + 200;
            this.projectiles.push(new TrashProjectile(this.x, this.y, [this.victims[0].x - this.x, this.victims[0].y - this.y], 0.2, this.victims, 5, this.parentElem, victim => victim.takeDamage(20)))
        }
        this.shits = this.shits.filter(shit => {
            shit.update(deltaTime);
            return !this.dead;
        })
        super.update(deltaTime);
    }

    oof() {
        playAudio("../noise/oscar/end.mp3");
        super.oof();
    }
}

// global variable spam cuz they dont pay me enough
const tileSize = 50;
const topOffset = 100;
const mapWidth = 40;
const mapHeight = 40;
const trashPos = [0, 0];

const trashElem = createElem("img", {src: "../img/trash.png", width: tileSize, height: tileSize}, {position: "absolute", left: `${trashPos[0] * tileSize}px`, top: `${trashPos[1] * tileSize}px`}) as HTMLImageElement;
let trashCounter: HTMLElement

addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(createAchievementElem());
    // typescript bruh
    const tmpTrashCounter = document.getElementById("trashCounter");
    if (tmpTrashCounter === null) {
        throw new Error("where the trash counter bro")
    }
    trashCounter = tmpTrashCounter;
    trashCounter.textContent = `Trash: ${localStorage.getItem("money") ?? 0}`;

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn === null) {
        throw new Error("where the reset button bro");
    }
    resetBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.reload();
    })

    const playBtn = document.getElementById("playButton");
    if (playBtn === null) {
        throw new Error("where the play button bro");
    }
    playBtn.addEventListener("click", () => {
        if (localStorage.getItem("startTime") === null) {
            localStorage.setItem("startTime", String(Date.now()));
        }
        document.body.style.backgroundImage = "url('../img/background.png')";
    
        const playScreen = document.getElementById("playScreen");
        if (playScreen === null) {
            throw new Error("where the play screen bro");
        }
        playScreen.style.display = "none";
    
        const gameDiv = createElem("div", {}, {position: "absolute", left: "0", top: `${topOffset}px`, overflow: "hidden", display: "block", width: `${tileSize * mapWidth}px`, height: `${tileSize * mapHeight}px`, userSelect: "none"});
        gameDiv.appendChild(createElem("audio", {src: "../noise/ocean.mp3", loop: true, autoplay: true, }))
        gameDiv.addEventListener("dragstart", event => event.preventDefault());
        gameDiv.appendChild(trashElem);
        document.body.appendChild(gameDiv);

        let shit: Shit[] = [];
        const projectiles: Entity[] = [];
        const tool = localStorage.getItem("harpoon") ? new HarpoonGun(1000 * 0.9 ** (Number(localStorage.getItem("coffee") ?? 0)), projectiles, gameDiv) : new Net(gameDiv, 1, 1);
        const player = new Player(5, 5, gameDiv, tool, shit);
        let level = -1;
        
        let prevTime = performance.now();
        function gameLoop(now: DOMHighResTimeStamp) {
            if (level < 4) {
                requestAnimationFrame(gameLoop);
            }
            // apparently elapsed can be 0 which makes everything zoom across the map at infinite speed
            // one solution would be to track prevPrevTime or smth but im lazy
            const elapsed = now === prevTime ? 1000 / 60 : now - prevTime;
            prevTime = now;
            player.update(elapsed);
            trashElem.style.left = -fakeScrollX + "px";
            trashElem.style.top = -fakeScrollY + "px";
            if (shit.length === 0) {
                if (-1 < level && level < 2) {
                    idkAlert("You are now on level " + (level + 1));
                }
                if (level === -1) {
                    for (let i = 0; i < Math.floor(Math.random() * 10) + 10; i++) {
                        shit.push(new MovingShit(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["../img/trash1.png", "../img/trash3.png"]));
                        projectiles.push(new Oil(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), [player], 10, gameDiv));
                    }
                } else if (level === 0) {
                    for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
                        shit.push(new AttackingShit(0.05, 0, player, projectiles, Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["../img/trash2.png", "../img/trash4.png", "../img/trash6.png"], 2));
                    }
                    for (let i = 0; i < Math.floor(Math.random() * 20) + 20; i++) {
                        projectiles.push(new Oil(Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), [player], 10, gameDiv));
                    }
                } else if (level === 1) {
                    for (let i = 0; i < Math.floor(Math.random() * 5) + 5; i++) {
                        shit.push(new AttackingShit(0.07, 0.02, player, projectiles, Math.floor(Math.random() * mapWidth), Math.floor(Math.random() * mapHeight), gameDiv, ["../img/trash2.png", "../img/trash4.png", "../img/trash5.png"], 2));
                    }
                } else if (level == 2) {
                    player.tool.oof();
                    playAudio("../noise/oscar/spawn.mp3");
                    const oscar = new Oscar(Math.floor(Math.random() * (mapWidth - 5)), Math.floor(Math.random() * (mapHeight - 5)), [player], gameDiv, projectiles);
                    player.tool = new TheFinalWeapon(oscar, gameDiv);
                    shit.push(oscar);
                }
                level++;
            }
            shit = shit.filter(thing => {
                thing.update(elapsed);
                return !thing.dead;
            });
            for (const projectile of projectiles) {
                projectile.update(elapsed);
            }
            player.shits = shit;
            oldScrollX = fakeScrollX;
            oldScrollY = fakeScrollY;
            fakeScrollX = Math.max(0, player.x * tileSize - screen.availWidth / 2);
            fakeScrollY = Math.max(0, player.y * tileSize - screen.availHeight / 2);
            if (player.health <= 0) {
                playAudio("../noise/oof.mp3");
                idkAlert("you died score 0");
                localStorage.clear();
                cleanUp();
            } else if (level === 4) {
                if (Date.now() - Number(localStorage.getItem("startTime") ?? -Infinity) < 6 * 60 * 1000 && Number(localStorage.getItem("moneyWasted") ?? 0) === 0) {
                    doAchievement("Speedrun");
                }
                if (player.health > 80) {
                    doAchievement("Regen is too easy");
                }
                if (player.health <= 10) {
                    doAchievement("Not even close");
                }
                cleanUp();
                idkAlert("You win!");
            }
        }
        requestAnimationFrame(gameLoop);
        function cleanUp() {
            gameDiv.remove();
            if (playScreen !== null) {
                playScreen.style.display = "flex";
            }
            document.body.style.backgroundImage = "url('../img/pixil-frame-0.png')";
            localStorage.removeItem("startTime");
            if (timerDisplay !== null) {
                timerDisplay.textContent = "0 : 0 : 0";
            }
        }
    });
    
})

function dLev(one: string, two: string) {
    let alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890- \'.,';
    const da = new Array(alphabet.length).fill(0);
    const matrix = new Array(one.length + 2).fill(0).map(() => new Array(two.length + 2).fill(0));
    const maxDist = one.length + two.length;
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
            const k = da[alphabet.indexOf(two[j - 1])];
            const l = db;
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

function prefixDLev(one: string, two: string) {
    return dLev(one.substring(0, two.length), two);
}

const timerDisplay = document.getElementById("timer-display");
if (timerDisplay === null) {
    throw new Error("where the timer display")
}

setInterval(() => {
    const startTime = localStorage.getItem("startTime");
    if (startTime === null) {
        timerDisplay.textContent = "0 : 0 : 0";
        return;
    }
    const elapsedTime = Date.now() - Number(startTime);
    const milliseconds = elapsedTime % 1000;
    const seconds = Math.floor(elapsedTime / 1000) % 60;
    const minutes = Math.floor(elapsedTime / 60 / 1000);
    timerDisplay.textContent = `${minutes} : ${seconds} : ${milliseconds}`;
})
