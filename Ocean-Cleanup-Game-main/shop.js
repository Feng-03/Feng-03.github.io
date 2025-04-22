document.getElementById("trashCounter").textContent = `Trash: ${localStorage.getItem("money") ?? 0}`;

// copy pasted cuz no bundler :(
function createElem(type, properties = {}, styles = {}, ...children) {
    const elem = document.createElement(type);
    Object.assign(elem, properties);
    Object.assign(elem.style, styles);
    for (const child of children) {
        elem.appendChild(child);
    }
    return elem;
}

const items = [
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
        costMultiplier: 1.5
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

const shopItems = document.getElementById("shopItems");
for (const item of items) {
    item.currentLevel = localStorage.getItem(item.name) ?? 0;
    const priceElem = createElem("span", {class: "price", textContent: `Cost: ${Math.round(item.baseCost * item.costMultiplier ** item.currentLevel)}`});
    priceElem.classList.add("price")
    const shopItem = createElem("div", {id: item.name}, {},
        createElem("img", {src: item.imgSrc ?? `../img/${item.name}.png`, alt: item.description}),
        createElem("h2", {textContent: item.title}),
        createElem("p", {textContent: item.description}),
        priceElem,
    );
    shopItem.addEventListener("click", () => {
        const cost = Math.round(item.baseCost * item.costMultiplier ** item.currentLevel);
        let money = Number(localStorage.getItem("money") ?? 0);
        if (money < cost) {
            alert("help the sea turtles bro");
            return;
        }
        const level = Number(localStorage.getItem(item.name) ?? 0) + 1;
        localStorage.setItem(item.name, level);
        item.currentLevel = level;
        money -= cost;
        localStorage.setItem("money", money);
        document.getElementById("trashCounter").textContent = `Trash: ${money}`;
        document.querySelector(`#${item.name} .price`).textContent = `Cost: ${Math.round(cost * item.costMultiplier ** level)}`;
        const kaching = createElem("audio", {src: "../noise/kaching.mp3"});
        kaching.play();
        kaching.remove();
    })
    shopItem.classList.add("shopItem");
    shopItems.appendChild(shopItem);
}