const cardWidth = 150;
const cardHeight = 210;

const dummyCanvas = document.createElement('canvas');
const dummyContext = dummyCanvas.getContext('2d');

let game;

dummyCanvas.width = cardWidth;
dummyCanvas.height = cardHeight;

async function loadData() {
    let response = await fetch('./data/decks.json');
    const decks = await response.json();

    await decks.reduce(async (previousPromise, deckId) => {
        await previousPromise;

        response = await fetch(`./data/decks/${deckId}.json`);
        const setInfo = await response.json();

        const set = new Set(deckId, setInfo.name);

        Object.keys(setInfo.cards).forEach((cardId) => {
            set.addCard(cardId, setInfo.cards[cardId]);
        });
    }, Promise.resolve());
}

async function createCardBase(cardId) {
    dummyContext.clearRect(0, 0, dummyCanvas.width, dummyCanvas.height);

    const card = Set.getCard(cardId);

    const [setId] = cardId.split(':');

    if (card.image) {
        const url = `./images/${setId}/${card.image}`;

        const image = new Image();
        image.src = url;

        await new Promise((resolve) => {
            image.onload = () => {
                resolve();
            }
        });

        dummyContext.shadowColor = 'transparent';
        dummyContext.drawImage(image, 0, 0, dummyCanvas.width, dummyCanvas.height);
    }

    dummyContext.strokeStyle = '#000';
    dummyContext.fillStyle = '#fff';
    dummyContext.shadowColor = '#000';
    dummyContext.lineWidth = 2;
    dummyContext.miterLimit = 2;
    dummyContext.shadowOffsetX = 2;
    dummyContext.shadowOffsetY = 2;

    card.ranks.forEach((rank, index) => {
        const x = 15 + 7 * (index % 2) * (1 - 2 * Math.floor(index / 2));
        const y = 25 + 10 * ((index + 1) % 2) * (2 * Math.floor(index / 2) - 1);

        dummyContext.strokeText(rank, x, y);
        dummyContext.fillText(rank, x, y);
    });

    const textSize = dummyContext.measureText(card.name);

    const left = (dummyCanvas.width - textSize.width) / 2;
    const top = dummyCanvas.height - 10;

    dummyContext.strokeText(card.name, left, top);
    dummyContext.fillText(card.name, left, top);

    const url = dummyCanvas.toDataURL();

    return url;
}

async function init() {
    if (document.readyState !== 'complete') {
        await new Promise((resolve) => {
            const onReady = () => {
                document.removeEventListener('DOMContentLoaded', onReady);
                window.removeEventListener('load', onReady);
                resolve();
            };

            document.addEventListener('DOMContentLoaded', onReady);
            window.addEventListener('load', onReady);
            resolve();
        });
    }

    await loadData();

    const cards = Set.cards;

    const cardImages = {};

    await cards.reduce(async (promise, cardId) => {
        await promise;

        cardImages[cardId] = await createCardBase(cardId);

        const image = new Image();
        image.src = cardImages[cardId];

        document.body.appendChild(image);
    }, Promise.resolve());

    game = new Game();

    const player1 = new Player();

    player1.openBooster('zeepkist');
}

init();