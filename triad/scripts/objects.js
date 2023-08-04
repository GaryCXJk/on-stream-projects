class SetNotFoundException extends Error {
    constructor(message) {
      super(message);
      this.name = 'SetNotFoundException';
      this.message = `The set could not be found: ${message}`;
      // Use V8's native method if available, otherwise fallback
      if ('captureStackTrace' in Error) {
        Error.captureStackTrace(this, SetNotFoundException);
      } else {
        this.stack = (new Error()).stack;
      }
    }
}

class CardNotFoundException extends Error {
    constructor(message) {
      super(message);
      this.name = 'CardNotFoundException';
      this.message = `The card could not be found: ${message}`;
      // Use V8's native method if available, otherwise fallback
      if ('captureStackTrace' in Error) {
        Error.captureStackTrace(this, CardNotFoundException);
      } else {
        this.stack = (new Error()).stack;
      }
    }
}

class Card {
    #image;
    #level;
    #name;
    #ranks;

    constructor(name, level, ranks, image = null) {
        this.#image = image;
        this.#level = level;
        this.#name = name;
        this.#ranks = ranks;
    }

    get image() {
        return this.#image;
    }

    get level() {
        return this.#level;
    }

    get name() {
        return this.#name;
    }

    get ranks() {
        return [...this.#ranks];
    }

    get rarity() {
        if (this.#level > 10) {
            return 0;
        }
        switch (this.#level) {
            case 10:
                return 4;
            case 9:
            case 8:
                return 3;
            case 7:
            case 6:
                return 2;
            default:
                return 1;
        }
    }

    get weight() {
        const weights = [0, 250, 50, 10, 1];
        return weights[this.rarity];
    }

    compare(otherCard, direction) {
        const ourRank = this.ranks[direction];
        const otherRank = otherCard.ranks[(direction + 2) % 4];

        return ourRank > otherRank;
    }

    toString() {
        return `${this.name} (${this.level}) [${this.ranks.join(', ')}]`;
    }
}

addStaticConstants(Card, {
    DIRECTION_TOP: 0,
    DIRECTION_RIGHT: 1,
    DIRECTION_BOTTOM: 2,
    DIRECTION_LEFT: 3,
});

class Set {
    static #sets = {};

    #name;
    #cards = {};

    constructor(id, name) {
        this.#name = name;

        Set.#addSet(id, this);
    }

    static #addSet(id, set) {
        this.#sets[id] = set;
    }

    static get cards() {
        const setIds = Object.keys(this.#sets).sort();

        const cards = [];

        setIds.forEach((setId) => {
            const set = this.#sets[setId];

            Object.keys(set.#cards).sort((idA, idB) => {
                const cardA = set.getCard(idA);
                const cardB = set.getCard(idB);

                if (cardA.level !== cardB.level) {
                    return cardA.level - cardB.level;
                }

                return idA.localeCompare(idB);
            }).forEach((cardId) => {
                cards.push(`${setId}:${cardId}`);
            });
        });

        return cards;
    }

    static getCard(id, cardId = null) {
        let realId = id;
        let realCardId = cardId;

        if (cardId === null) {
            ([realId, realCardId] = id.split(':'));
        }

        return this.#sets[realId]?.getCard(realCardId) ?? null;
    }

    static getCards(id) {
        if (!this.#sets[id]) {
            throw new SetNotFoundException(id);
        }

        const set = this.#sets[id];

        const cards = {};

        Object.keys(set.#cards).forEach((cardId) => {
            cards[cardId] = set.getCard(cardId).weight;
        });

        return cards;
    }

    static getRates(id) {
        if (!this.#sets[id]) {
            throw new SetNotFoundException(id);
        }

        return this.#sets[id].rates;
    }

    get name() {
        return this.#name;
    }

    get rates() {
        const cardWeights = Object.keys(this.#cards).reduce((info, cardId) => {
            const newInfo = info;

            const weight = this.getCard(cardId).weight;

            newInfo.totalWeight += weight;
            newInfo.cards[cardId] = weight;

            return newInfo;
        }, {
            totalWeight: 0,
            cards: {},
        });

        return Object.keys(cardWeights.cards).reduce((rates, cardId) => {
            const newRates = rates;
            newRates[cardId] = cardWeights.cards[cardId] / cardWeights.totalWeight;
            return newRates;
        }, {});
    }

    addCard(id, card) {
        let setCard = card;
        if (!(card instanceof Card)) {
            setCard = new Card(
                card.name,
                card.level,
                card.ranks,
                card.image,
            );
        }

        this.#cards[id] = setCard;
    }

    getCard(id) {
        return this.#cards[id] ?? null;
    }
}

class Booster {
    #opened = false;
    #cards = [];

    constructor(setId, totalCards = 11) {
        const cards = Set.getCards(setId);
        const totalWeight = Object.keys(cards).reduce((previousWeight, cardId) => previousWeight + cards[cardId], 0);

        while (this.#cards.length < totalCards) {
            let weight = Math.floor(Math.random() * totalWeight);
            
            Object.keys(cards).every((cardId) => {
                const currentWeight = cards[cardId];
                if (weight < currentWeight) {
                    this.#cards.push(`${setId}:${cardId}`);
                    return false;
                }
                weight-= currentWeight;
                return true;
            });
        }
    }

    openBooster() {
        if (this.#opened) {
            return null;
        }
        this.#opened = true;
        return this.#cards.splice(0, this.#cards.length);
    }

    toString() {
        if (this.#opened) {
            return 'Booster already opened';
        }
        console.log(this.#cards);
        return this.#cards.map((cardId) => Set.getCard(cardId).toString()).join(', ');
    }
}

class Deck {
    #cards = {};

    get cards() {
        return {
            ...this.#cards,
        };
    }

    addCard(id, quantity = 1) {
        if (!Set.getCard(id)) {
            throw new CardNotFoundException(id);
        }

        this.#cards[id] = (this.#cards[id] ?? 0) + quantity;
    }

    clone() {
        const deck = new Deck();

        Object.keys(this.#cards).forEach((cardId) => {
            deck.addCard(cardId, this.#cards[cardId]);
        });

        return deck;
    }
    
    removeCard(id, quantity = 1) {
        if (this.#cards[id] ?? 0 >= quantity) {
            this.#cards[id] -= quantity;
            return true;
        }
        return false;
    }
}

class Hand {
    #cards = [];
    #deck;

    constructor(deck) {
        this.#deck = deck.clone();
    }

    get cards() {
        return [...this.#cards];
    }

    get deck() {
        return this.#deck;
    }

    addCard(id, quantity = 1) {
        const card = Set.getCard(id);

        if (!card) {
            throw new CardNotFoundException(id);
        }
        if (!this.#deck.removeCard(id, quantity)) {
            return false;
        }

        for (let i = 0; i < quantity; i += 1) {
            this.#cards.push(card);
        }

        return true;
    }

    addCards(cards) {
        const deck = this.#deck.clone();
        let isSuccess = true;
        Object.keys(cards).every((cardId) => {
            const card = Set.getCard(cardId);
    
            if (!card) {
                throw new CardNotFoundException(cardId);
            }

            if (!deck.removeCard(cardId, cards[cardId])) {
                isSuccess = false;
                return false;
            }
            return true;
        });

        if (!isSuccess) {
            return false;
        }

        Object.keys(cards).forEach((cardId) => {
            this.addCard(cardId, cards[cardId]);
        });

        return true;
    }

    removeCard(index) {
        if (index >= this.#cards.length) {
            return false;
        }
        return this.#cards.splice(index, 1)[0];
    }

    getCard(index) {
        if (index >= this.#cards.length) {
            return false;
        }
        return this.#cards[index];
    }
}

class FieldPosition {
    #card = null;
    #player = 0;

    get card() {
        return this.#card;
    }

    get player() {
        return this.#player;
    }

    placeCard(card, player) {
        if (this.#card) {
            return false;
        }
        this.#card = card;
        this.#player = player;
        return true;
    }

    changePlayer() {
        if (!this.#player) {
            return;
        }
        this.#player = 3 - this.#player;
    }

    toString() {
        return `${this.#card?.toString() ?? 'None'}${this.#player ? ` (Player ${this.#player})` : ''}`;
    }
}

class Field {
    #grid;
    #height;
    #width;

    constructor() {
        const height = 3;
        const width = 3;

        this.#height = height;
        this.#width = width;

        this.#initializeGrid();
    }

    getCard(x, y) {
        if (!this.#getIsValid(x, y)) {
            return false;
        }
        return this.#grid[x][y].card;
    }

    getCells() {
        return this.#height * this.#width;
    }

    getPlayer(x, y) {
        if (!this.#getIsValid(x, y)) {
            return false;
        }
        return this.#grid[x][y].player;
    }

    getFieldScore() {
        return this.#grid.reduce((previousScore, column) => (
            column.reduce((previousScoreSub, row) => {
                const newPreviousScore = previousScoreSub;
                newPreviousScore[row.player] += 1;
                return newPreviousScore;
            }, previousScore)
        ), [0, 0, 0]);
    }

    placeCard(x, y, card, player) {
        if (!this.#getIsValid(x, y)) {
            return false;
        }
        return this.#grid[x][y].placeCard(card, player);
    }

    toString() {
        let outputArray = [];

        for (let y = 0; y < this.#height; y += 1) {
            let rowOutput = [];
            for (let x = 0; x < this.#width; x += 1) {
                rowOutput.push(this.#grid[x][y].toString());
            }
            outputArray.push(`[${rowOutput.join(', ')}]`);
        }

        return `[${outputArray.join(', ')}]`;
    }

    #getIsValid(x, y) {
        return !(
            x < 0
            || x >= this.#width
            || y < 0
            || y >= this.#height
        );
    }

    #initializeGrid() {
        this.#grid = [];
        for (let x = 0; x < this.#width; x += 1) {
            const column = [];
            for (let y = 0; y < this.#height; y += 1) {
                column.push(new FieldPosition());
            }
            this.#grid.push(column);
        }
    }
}

class Player {
    #deck;
    #hand;

    constructor() {
        this.#deck = new Deck();
        this.#hand = null;
    }

    get deck() {
        return this.#deck.cards;
    }

    get hand() {
        return this.#hand ? this.#hand.cards : [];
    }

    openBooster(setId, totalCards = 11) {
        const booster = new Booster(setId, totalCards);
        const cards = booster.openBooster();
        cards.forEach((cardId) => {
            this.#deck.addCard(cardId);
        });
    }

    initializeHand() {
        this.#hand = new Hand(this.#deck);
    }

    addCards(cards) {
        if (!this.#hand) {
            return false;
        }

        return this.#hand.addCards(cards);
    }
}

class Game {
    #field;
    #players;

    constructor() {
        this.#field = new Field();
        this.#players = [null, null];
    }

    setHand(playerNumber, player) {
        let realPlayer = null;
        if (playerNumber === 1 || playerNumber === 2) {
            if (player instanceof Player) {
                realPlayer = player;
            }
        }
        this.#players[playerNumber - 1] = realPlayer;

        return !!realPlayer;
    }

    getHand(player) {
        if (player === 1 || player === 2) {
            return this.#players[player - 1].cards;
        }
    }

    placeCard(player, index, x, y) {
        if (player !== 1 && player !== 2) {
            return false;
        }
        const hand = this.#players[player - 1] ?? null;
        if (!hand) {
            return false;
        }
        const card = hand.getCard(index);
        if (!card) {
            return false;
        }
        this.#field.placeCard(x, y, card, player);
    }
}
