import { createElem, playAudio } from "./randomShit";

export const achievementDescriptions: Record<string, {description: string, img: string}> = {
    rockefeller: {
        description: "Waste over a thousand trash",
        img: "../img/rockefeller.jpg"
    },
    speedrun: {
        description: "Beat the hackathon no shop speedrun record",
        img: "../img/placeholder.png"
    },
    optor: {
        description: "Throw away a shit ton of trash for no reason",
        img: "../img/optor.png"
    },
    "regen is too easy": {
        description: "Don't abuse regeneration",
        img: "../img/hardcoreheart.png"
    },
    "not even close": {
        description: "Win with less than 10 health",
        img: "../img/notevenclose.png"
    },
    "very speed": {
        description: "Go very fast",
        img: "../img/veryspeed.png"
    }
}

export function createAchievementElem(): HTMLElement {
    const achievementNotif = createElem("div", {id: "achievementNotif"}, {}, 
        createElem("img", {id: "achievementImg"}),
        createElem("div", {}, {},
            createElem("p", {id: "bruh", textContent: "Challenge Complete!"}),
            createElem("p", {id: "achievementName"})
        )
    );
    achievementNotif.classList.add("achievement");
    return achievementNotif
}

export function doAchievement(name: keyof typeof achievementDescriptions) {
    if (!Object.prototype.hasOwnProperty.apply(achievementDescriptions, [name.toLowerCase()])) {
        throw new Error(`Achievement ${name} don't exist you monkey`)
    }
    if (localStorage.getItem(`achievement${name}`) !== null) {
        return;
    }
    localStorage.setItem(`achievement${name}`, "tgr43gt45hngt54yhn6thnutjegtrdefuefr");
    const achievementName = document.getElementById("achievementName")
    const achievementImg = document.getElementById("achievementImg") as HTMLImageElement;
    const achievementNotif = document.getElementById("achievementNotif");
    if (achievementName === null || achievementImg === null || achievementNotif === null) {
        throw new Error("where the achievement stuff bro");
    }
    achievementName.textContent = name;
    achievementImg.src = achievementDescriptions[name.toLowerCase()].img;
    achievementNotif.style.right = "0";
    setTimeout(() => achievementNotif.style.right = "-405px", 4000);
    playAudio("../noise/challenge.mp3");
}