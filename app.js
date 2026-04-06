// Import Firebase SDK (Module version for un-bundled static HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 🚨 INSTRUCTIONS TO MAKE SYNC WORK 🚨
// ==========================================
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project, click the web icon (</>) to register an app.
// 3. Under your project settings, find the "firebaseConfig" object.
// 4. PASTE THE VALUES inside the firebaseConfig object below.
// 5. In Firebase console, go to "Firestore Database" on the left, click "Create Database".
// 6. Choose "Start in test mode" (so you can read/write without auth for now).

const firebaseConfig = {
  apiKey: "AIzaSyDlvVWkcWau37dzuyHVqyOP7mAyU0nARo4",
  authDomain: "coupleapp-af1d4.firebaseapp.com",
  projectId: "coupleapp-af1d4",
  storageBucket: "coupleapp-af1d4.firebasestorage.app",
  messagingSenderId: "1073002856361",
  appId: "1:1073002856361:web:4836860fdbc1d2a1294eb8"
};

// Check if Firebase is configured
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
let db = null;

if (!isConfigured) {
  document.getElementById('db-warning').style.display = 'block';
  // Create mock arrays so the app still functions visually without sync
  window.mockDates = [];
  window.mockNotes = [];
} else {
  // Initialize Firebase if configured
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  loadLiveData();
}

// ==========================================
// App Logic & Tab Navigation
// ==========================================
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active classes
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    // Add active to clicked
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ==========================================
// Background Hearts Animation
// ==========================================
const heartsContainer = document.getElementById('hearts-container');
const symbols = ['❤️', '✨', '💖', '💕'];

function createHeart() {
  const heart = document.createElement('div');
  heart.className = 'heart-float';
  heart.innerText = symbols[Math.floor(Math.random() * symbols.length)];
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
  heart.style.animationDuration = (Math.random() * 5 + 5) + 's';
  heartsContainer.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 10000); // Remove after animation
}
setInterval(createHeart, 500);

// ==========================================
// Relationship Timer (Since Feb 25, 2026)
// ==========================================
const startDate = new Date('2026-02-25T00:00:00').getTime();

function updateTimer() {
  const now = new Date().getTime();
  const diff = now - startDate;

  if (diff <= 0) return; // Future date safeguard

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').innerText = days;
  document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
  document.getElementById('mins').innerText = mins.toString().padStart(2, '0');
  document.getElementById('secs').innerText = secs.toString().padStart(2, '0');
}
setInterval(updateTimer, 1000);
updateTimer();

// ==========================================
// Database / Mock Data Handlers
// ==========================================

// Add Date
document.getElementById('date-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('date-title').value;
  const dateVal = document.getElementById('date-time').value;

  if (isConfigured) {
    await addDoc(collection(db, "dates"), {
      title,
      date: dateVal,
      completed: false,
      createdAt: serverTimestamp()
    });
  } else {
    window.mockDates.push({ id: Date.now().toString(), title, date: dateVal, completed: false });
    renderDates(window.mockDates);
  }

  document.getElementById('date-title').value = '';
  document.getElementById('date-time').value = '';
});

// Add Note
document.getElementById('note-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('note-text').value;
  const author = document.getElementById('note-author').value;

  if (isConfigured) {
    await addDoc(collection(db, "notes"), {
      text,
      author,
      cuteness: 0,
      createdAt: serverTimestamp()
    });
  } else {
    window.mockNotes.push({ id: Date.now().toString(), text, author, cuteness: 0 });
    renderNotes(window.mockNotes);
  }

  document.getElementById('note-text').value = '';
});

// Live Data Listeners (Firebase only)
function loadLiveData() {
  const datesQ = query(collection(db, "dates"), orderBy("createdAt", "desc"));
  onSnapshot(datesQ, (snapshot) => {
    const datesArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderDates(datesArr);
  });

  const notesQ = query(collection(db, "notes"), orderBy("createdAt", "desc"));
  onSnapshot(notesQ, (snapshot) => {
    const notesArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderNotes(notesArr);
  });
}

function renderDates(datesArr) {
  const list = document.getElementById('dates-list');
  list.innerHTML = '';
  datesArr.forEach(item => {
    const li = document.createElement('li');
    li.className = 'item-li' + (item.completed ? ' completed' : '');
    li.innerHTML = `
      <div class="date-info" style="display:flex; flex-direction:column; align-items:flex-start;">
        <span class="item-title">${item.title}</span>
        ${item.date ? `<span class="item-date" style="margin-top:5px;">${item.date}</span>` : ''}
      </div>
      <div class="date-actions">
        <input type="checkbox" class="complete-cb" ${item.completed ? 'checked' : ''}>
      </div>
    `;

    const cb = li.querySelector('.complete-cb');
    cb.addEventListener('change', async (e) => {
      const isChecked = e.target.checked;
      if (isConfigured) {
        await updateDoc(doc(db, "dates", item.id), { completed: isChecked });
      } else {
        const d = window.mockDates.find(x => x.id === item.id);
        if (d) d.completed = isChecked;
        renderDates(window.mockDates);
      }
    });

    list.appendChild(li);
  });
}

function renderNotes(notesArr) {
  const grid = document.getElementById('notes-list');
  grid.innerHTML = '';
  notesArr.forEach(item => {
    const div = document.createElement('div');
    div.className = 'note-card';
    const rotation = Math.random() * 6 - 3; // Random tilt between -3 and 3 degrees
    div.style.transform = `rotate(${rotation}deg)`;

    const cuteness = item.cuteness || 0;

    div.innerHTML = `
      <p class="note-text">${item.text}</p>
      <p class="note-author">- ${item.author}</p>
      <div class="cuteness-container">
        <div class="cuteness-header">
          <span>Cuteness</span>
          <span class="cuteness-val">${cuteness}/10</span>
        </div>
        <input type="range" class="cuteness-slider" min="0" max="10" value="${cuteness}">
      </div>
    `;

    const slider = div.querySelector('.cuteness-slider');
    const valText = div.querySelector('.cuteness-val');

    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      valText.innerText = `${val}/10`;
      valText.style.animation = 'none';
      valText.offsetHeight; // Reflow
      valText.style.animation = 'popValue 0.2s ease-out';
    });

    slider.addEventListener('change', async (e) => {
      const val = parseInt(e.target.value);
      if (isConfigured) {
        await updateDoc(doc(db, "notes", item.id), { cuteness: val });
      } else {
        const n = window.mockNotes.find(x => x.id === item.id);
        if (n) n.cuteness = val;
      }
    });

    grid.appendChild(div);
  });
}
