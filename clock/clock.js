const secondHand = document.getElementById('second');
const minuteHand = document.getElementById('minute');
const hourHand = document.getElementById('hour');
const timeElem = document.getElementById('time');

function showClock() {
    const now = new Date();

    const milliseconds = now.getMilliseconds();
    const seconds = now.getSeconds() + (milliseconds / 1000);
    const minutes = now.getMinutes() + (seconds / 60);
    const hours = now.getHours() + (minutes / 60);

    secondHand.style.transform = `rotateZ(${seconds * 6}deg)`;
    minuteHand.style.transform = `rotateZ(${minutes * 6}deg)`;
    hourHand.style.transform = `rotateZ(${hours * 30}deg)`;

    const momentNow = moment(now);

    timeElem.textContent = momentNow.format('HH:mm:ssZ');

    requestAnimationFrame(showClock);
}

showClock();