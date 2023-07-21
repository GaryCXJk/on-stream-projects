console.clear();

const SUITS = {
    h: '\u2665',
    s: '\u2660',
    d: '\u2666',
    c: '\u2663',
};

const FACES = {
    1: 'Ace',
    11: 'Jack',
    12: 'Queen',
    13: 'King',
};

class Card {
    _value = null;

    constructor(value) {
        this._value = value;
    }

    get value() {
        return this._value;
    }
}

class PokerCard extends Card {
    #suit;

    constructor(value, suit) {
        super(value);
        this.#setRealValue(value);
        this.#setSuit(suit);
    }

    #setSuit(suit) {
        switch (suit.toLowerCase()) {
            case 's':
            case 'spade':
                this.#suit = 's';
                break;
            case 'd':
            case 'diamond':
                this.#suit = 'd';
                break;
            case 'c':
            case 'club':
            case 'clubs':
                this.#suit = 'c';
                break;
            case 'h':
            case 'heart':
            default:
                this.#suit = 'h';
                break;
        }
    }

    #setRealValue(value) {
        let realValue = value;
        if (!Number.isNaN(+realValue)) {
            if (realValue < 2 || realValue > 13) {
                realValue = 1;
            }
        } else {
            switch (realValue.toLowerCase()) {
                case 'j':
                case 'jack':
                    realValue = 11;
                    break;
                case 'q':
                case 'queen':
                    realValue = 12;
                    break;
                case 'k':
                case 'king':
                    realValue = 13;
                    break;
                case 'a':
                case 'ace':
                default:
                    realValue = 1;
                    break;
            }
        }
        super._value = realValue;
    }

    get value() {
        return FACES[this._value] ?? this._value;
    }

    get suit() {
        return SUITS[this.#suit] ?? SUITS.h;
    }

    toString() {
        return `${this.value} ${this.suit}`;
    }
}

class Stack {
    #cards = [];

    addCard(card, index = null) {
        if (card instanceof Card) {
            this.#cards.splice(index ?? this.#cards.length, 0, card);
        }
    }

    removeCard(index = null) {
        const card = this.#cards.splice(index ?? this.#cards.length, 1);

        if (card.length) {
            return card[0];
        }
        return null;
    }

    emptyStack() {
        return this.#cards.splice(0, this.#cards.length);
    }

    getCards() {
        return [...this.#cards];
    }

    toString() {
        return this.#cards.map((card) => card.toString()).join(', ');
    }
}

class Deck extends Stack {
    shuffle() {
        const originalStack = this.emptyStack();

        while(originalStack.length) {
            const card = originalStack.splice(Math.floor(Math.random() * originalStack.length), 1);
            if (card.length) {
                this.addCard(card[0]);
            }
        }
    }
}

const deck = new Deck();

Object.keys(SUITS).forEach((suit) => {
    for (let value = 1; value <= 13; value++) {
        deck.addCard(new PokerCard(value, suit));
    }
});

console.log(deck.toString());

deck.shuffle();

console.log(deck.toString());
