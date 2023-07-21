const apiUrl = 'http://localhost:8125';
const movePause = 300;
const moveSpeed = .2;

const imageElement = document.querySelector('#image');
const progressElement = document.querySelector('#progress');
const timeElement = document.querySelector('#time');

const screens = {
    loading: document.querySelector('#loading'),
    nothing: document.querySelector('#nothing'),
    content: document.querySelector('#content'),
};

let songId = -1;
let progress = [0, 0, 0, false];

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
    },
    next: {
        element: document.querySelector('#next'),
        none: document.querySelector('#next-none'),
        available: document.querySelector('#next-available'),
        artist: document.querySelector('#next-artist'),
        song: document.querySelector('#next-song'),
        duration: document.querySelector('#next-duration'),
        requested: document.querySelector('#next-requested'),
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
        info.next.ticker = 0;

        if (songId) {
            switchScreen('content');

            const albumCover = data?.Albums?.[1]?.Url ?? '';
            imageElement.style.backgroundImage = `url(${albumCover})`;

            info.artist.element.textContent = data?.Artists ?? '';
            info.title.element.textContent = data?.Title ?? '';
            info.requested.element.textContent = data?.Requester ? `@${data?.Requester}` : 'None';

            let nextSong = null;
            if (data?.QueueCount) {
                let queueIndex = 0;
                while (queueIndex < data.QueueCount && data.Queue[queueIndex].trackid === songId) {
                    queueIndex++;
                }
                if (queueIndex < data.QueueCount) {
                    nextSong = data.Queue[queueIndex];
                }
            }

            if (nextSong) {
                const {
                    artist,
                    title,
                    length,
                    requester,
                } = nextSong;
                info.next.none.classList.add('hidden');
                info.next.available.classList.remove('hidden');

                info.next.artist.textContent = artist;
                info.next.song.textContent = title;
                info.next.duration.textContent = length;
                info.next.requested.textContent = requester;
            } else {
                info.next.none.classList.remove('hidden');
                info.next.available.classList.add('hidden');
            }
        } else {
            imageElement.style.backgroundImage = 'url(\'./music-note.svg\')';
            switchScreen('nothing');
        }
    }
    if (progress[0] !== data.Progress || progress[3] !== data.IsPlaying) {
        progress = [data.Progress ?? 0, data.DurationTotal ?? 0, Date.now(), data.IsPlaying];
    }
}

async function reloadData() {
    const dateStart = Date.now();
    const response = await fetch(apiUrl);
    const data = await response.json();

    setSong(data);

    setTimeout(reloadData, Math.max(0, 1000 - (Date.now() - dateStart)));
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

function parseTime(timeValue) {
    const minutes = Math.floor(timeValue / 60000);
    const seconds = Math.floor(timeValue / 1000) % 60;
    
    return `${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
}

function animateTime() {
    let currentTime = progress[0];
    let bar = 0;
    // if (progress[3]) {
    //     currentTime += (Date.now() - progress[2]);
    // }
    if (progress[1] === 0) {
        timeElement.textContent = '--:-- / --:--';
    } else {
        timeElement.textContent = `${parseTime(currentTime)} / ${parseTime(progress[1])}`;
        
        bar = (currentTime / progress[1]) * 100;
    }
    progressElement.style.width = `${bar}%`;
    
    requestAnimationFrame(animateTime);
}

function animate() {
    if (songId) {
        animateElement('artist');
        animateElement('title');
        animateElement('requested');
        animateElement('next');
    }

    requestAnimationFrame(animate);
}

reloadData();

animate();
animateTime();