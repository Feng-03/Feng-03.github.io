import { achievementDescriptions, createAchievementElem, doAchievement } from "../achievements";
import { createElem, playAudio } from "../randomShit";


const trashCounter = document.getElementById("trashCounter");
if (trashCounter === null) {
    throw new Error("where my trash counter bro");
}
trashCounter.textContent = `Trash: ${localStorage.getItem("money") ?? 0}`;

let optorCounter = 0;
document.getElementById("optor")?.addEventListener("click", () => {
    localStorage.setItem("money", String(Number(localStorage.getItem("money") ?? 0) - 5));
    playAudio("../noise/oof.mp3");
    trashCounter.textContent = `Trash: ${localStorage.getItem("money") ?? 0}`;
    optorCounter++;
    if (optorCounter >= 50) {
        doAchievement("Optor");
    }
});

interface shopItem {
    name: string
    imgSrc?: string
    title: string
    description: string
    baseCost: number,
    costMultiplier: number,
    currentLevel?: number,
    lvlAchievements?: {level: number, achievementName: string}[]
}

const items: shopItem[] = [
    {
        name: "harpoon",
        imgSrc: "../img/harpoonIcon.png",
        title: "Tool Upgrade",
        description: "Enhance your garbage cleanup",
        baseCost: 10,
        costMultiplier: 1.15,
    },
    {
        name: "boat",
        imgSrc: "../img/lvl2boat.png",
        title: "Buy a Boat",
        description: "Obtain a boat!",
        baseCost: 10,
        costMultiplier: 2
    },
    {
        name: "speed",
        imgSrc: "../img/propellor.png",
        title: "Speed Upgrade",
        description: "Speed up your cleanup!",
        baseCost: 15,
        costMultiplier: 1.5,
        lvlAchievements: [{level: 10, achievementName: "Very speed"}]
    },
    {
        name: "coffee",
        title: "Tool Speed Upgrade",
        description: "Increase your tool efficency!",
        baseCost: 10,
        costMultiplier: 1.1
    },
    {
        name: "armor",
        title: "Armor Upgrade",
        description: "Defend yourself from the trash!",
        baseCost: 10,
        costMultiplier: 1.1
    },
    {
        name: "health",
        imgSrc: "../img/heart.png",
        title: "Health Upgrade",
        description: "Increase your healthpool!",
        baseCost: 20,
        costMultiplier: 1.5,
    },
    {
        name: "capacity",
        imgSrc: "../img/bag.png",
        title: "Capacity Upgrade",
        description: "Increase capacity by 1!",
        baseCost: 15,
        costMultiplier: 1.2
    },
    {
        name: "regen",
        imgSrc: "../img/heart.png",
        title: "Regeneration",
        description: "Survive slightly longer",
        baseCost: 5,
        costMultiplier: 1.1
    }
];

document.getElementById("shopPage")?.appendChild(createAchievementElem());

const shopItems = document.getElementById("shopItems");
if (shopItems === null) {
    throw new Error("where the shop items bro");
}

for (const item of items) {
    item.currentLevel = Number(localStorage.getItem(item.name) ?? 0);
    const priceElem = createElem("span", {class: "price", textContent: `Cost: ${Math.round(item.baseCost * item.costMultiplier ** item.currentLevel)}`});
    priceElem.classList.add("price")
    const shopItem = createElem("div", {id: item.name}, {},
        createElem("img", {src: item.imgSrc ?? `../img/${item.name}.png`, alt: item.description}),
        createElem("h2", {textContent: item.title}),
        createElem("p", {textContent: item.description}),
        priceElem,
    );
    shopItem.addEventListener("click", () => {
        if (item.currentLevel === undefined) {
            throw new Error("item.currentLevel is undefined. how did this happen bruh")
        }
        const cost = Math.round(item.baseCost * item.costMultiplier ** item.currentLevel);
        let money = Number(localStorage.getItem("money") ?? 0);
        if (money < cost) {
            alert("help the sea turtles bro");
            return;
        }
        const level = Number(localStorage.getItem(item.name) ?? 0) + 1;
        localStorage.setItem(item.name, String(level));
        item.currentLevel = level;

        if (item.lvlAchievements !== undefined) {
            for (const lvlAchievement of item.lvlAchievements) {
                if (level > lvlAchievement.level) {
                    doAchievement(lvlAchievement.achievementName);
                }
            }
        }

        money -= cost;
        // this is so dumb and they dont pay me enough i want to kill myself what am i doing
        const oldMoneyWasted = Number(localStorage.getItem("moneyWasted") ?? 0)
        localStorage.setItem("moneyWasted", String(oldMoneyWasted + cost));
        if (oldMoneyWasted < 1000 && oldMoneyWasted + cost > 1000) {
            doAchievement("Rockefeller");
        }
        localStorage.setItem("money", String(money));
        trashCounter.textContent = `Trash: ${money}`;
        const priceElem = document.querySelector(`#${item.name} .price`)
        if (priceElem === null) {
            throw new Error("where the price element bro")
        }
        priceElem.textContent = `Cost: ${Math.round(cost * item.costMultiplier)}`;
        playAudio("../noise/kaching.mp3");
    })
    shopItem.classList.add("shopItem");
    shopItems.appendChild(shopItem);
}