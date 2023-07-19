const apiUrl = 'http://localhost:8125';
const movePause = 300;
const moveSpeed = .2;

const imageElement = document.querySelector('#image');
const progressElement = document.querySelector('#progress');

const screens = {
    loading: document.querySelector('#loading'),
    nothing: document.querySelector('#nothing'),
    content: document.querySelector('#content'),
};

let songId = -1;
let progress = 0;

const info = {
    artist: {
        element: document.querySelector('#artist'),
        ticker: 0,
    },
    title: {
        element: document.querySelector('#title'),
        ticker: 0,
    },
    requested: {
        element: document.querySelector('#requested'),
        ticker: 0,
    }
}

function switchScreen(id) {
    Object.keys(screens).forEach((screenId) => {
        const screen = screens[screenId];
        screen.classList[id === screenId ? 'remove' : 'add']('hidden');
    });
}

function setSong(data) {
    if (songId !== data.SongId) {
        songId = data.SongId;
        info.artist.ticker = 0;
        info.title.ticker = 0;
        info.requested.ticker = 0;

        if (songId) {
            switchScreen('content');

            const albumCover = data?.Albums?.[1]?.Url ?? '';
            imageElement.style.backgroundImage = `url(${albumCover})`;

            info.artist.element.textContent = data?.Artists ?? '';
            info.title.element.textContent = data?.Title ?? '';
            info.requested.element.textContent = data?.Requester ? `@${data?.Requester}` : 'None';
        } else {
            imageElement.style.backgroundImage = 'url(\'./music-note.svg\')';
            switchScreen('nothing');
        }
    }
    progress = data.DurationPercentage;
}

async function reloadData() {
    const response = await fetch(apiUrl);
    const data = await response.json();

    setSong(data);

    setTimeout(reloadData, 500);
}

function animateElement(type) {
    const element = info[type].element;
    const parentWidth = element.parentNode.offsetWidth;
    const width = element.offsetWidth;

    const moveLength = (width - parentWidth);
    if (moveLength > 0) {
        let x = 0;
        const moveDuration = moveLength / moveSpeed;
        const phaseLength = movePause + moveDuration;
        const totalLength = phaseLength * 2;

        const tick = info[type].ticker;

        const tickPhase = tick % phaseLength;
        const tickStage = Math.floor(tick / phaseLength);

        if (tickPhase < movePause) {
            x = tickStage ? -moveLength : 0;
        } else {
            const moveTick = (tickPhase - movePause);
            x = tickStage ? -moveLength + moveTick * moveSpeed : -moveTick * moveSpeed;
        }

        element.style.transform = `translateX(${x}px)`;

        info[type].ticker = (info[type].ticker + 1) % totalLength;
    }
}

function animate() {
    if (songId) {
        animateElement('artist');
        animateElement('title');
        animateElement('requested');

        progressElement.style.width = `${progress}%`;
    }

    requestAnimationFrame(animate);
}

reloadData();

animate();