// Simple mobile-first checklist app using localStorage and JSON file store
const USERS = ['JH','JM','KH'];
const LS_KEY = 'checklists_app_data_v1';
const LS_USER = 'checklists_app_user';

function uid(prefix='id'){
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}

function loadInitial(){
  const raw = localStorage.getItem(LS_KEY);
  if(raw) return JSON.parse(raw);
  // try to load bundled data.json via fetch (works when served)
  return fetch('data.json').then(r=>r.json()).catch(()=>({lists:[]}));
}

function save(data){
  // Always keep a local copy
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  // Try to persist to server (PUT /data.json). If server isn't available,
  // we silently keep the local copy.
  try{
    fetch('/data.json', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)})
      .then(res=>{
        if(!res.ok) console.warn('Server persistence failed', res.status);
      }).catch(err=>{
        // server likely not running; ignore
      });
  }catch(e){/* ignore */}
}

function currentUser(){
  return localStorage.getItem(LS_USER) || USERS[0];
}

function setCurrentUser(u){
  localStorage.setItem(LS_USER,u);
}

// Render
const listsEl = document.getElementById('lists');
const userSelect = document.getElementById('user');
const addBtn = document.getElementById('addBtn');
const newTitle = document.getElementById('newTitle');
const newDetails = document.getElementById('newDetails');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const clearBtn = document.getElementById('clearBtn');
const template = document.getElementById('listTemplate');

let state = {lists:[]};

function render(){
  listsEl.innerHTML = '';
  state.lists.forEach(list => {
    const node = template.content.cloneNode(true);
    const el = node.querySelector('.list');
    el.dataset.id = list.id;
    el.querySelector('.title').textContent = list.title;
    el.querySelector('.details').textContent = list.details || '';

    const responsesEl = el.querySelector('.responses');
    // ensure responses for all users
    list.responses = USERS.map(u=>{
      const found = list.responses.find(r=>r.user===u);
      return found ? found : {user:u,answer:null,note:''};
    });

    list.responses.forEach(r=>{
      const rEl = document.createElement('div');
      rEl.className = 'response';
      rEl.innerHTML = `
        <div class="who">${r.user}</div>
        <div class="info">
          <div class="noteText">${r.note || ''}</div>
        </div>
        <div class="actions">
          <button class="yes ${r.answer==='yes' ? 'active':''}">Yes</button>
          <button class="no ${r.answer==='no' ? 'active':''}">No</button>
        </div>
      `;
      const yesBtn = rEl.querySelector('.yes');
      const noBtn = rEl.querySelector('.no');
      const noteText = rEl.querySelector('.noteText');

      // Determine permissions: the creator of a checklist should not
      // answer their own checklist. Only the two other users can answer
      // and add notes. Backwards compatible: lists without `creator`
      // behave as before.
      const cur = currentUser();
      const isCreator = list.creator && list.creator === r.user;
      const canEdit = (cur === r.user) && !isCreator;

      if(isCreator){
        // creator row - cannot set yes/no but may add/edit their own note
        const whoEl = rEl.querySelector('.who');
        whoEl.title = 'creator';
        // only allow editing the creator's note when the creator is the active user
        if(cur === r.user){
          const input = document.createElement('input');
          input.value = r.note || '';
          input.className = 'note';
          input.placeholder = 'Creator note (optional)';
          input.addEventListener('change',()=>{
            r.note = input.value;
            save(state);
            render();
          });
          rEl.querySelector('.info').replaceChild(input,noteText);
        } else {
          // show read-only note for others
          rEl.querySelector('.info').replaceChild(document.createTextNode(r.note || ''), noteText);
        }
        // disable yes/no for creator
        yesBtn.disabled = true; noBtn.disabled = true;
        if(r.answer==='yes') yesBtn.classList.add('active');
        if(r.answer==='no') noBtn.classList.add('active');
      } else if(canEdit){
        // only allow editing the note when the current user matches the response row's user
        if(cur === r.user){
          const input = document.createElement('input');
          input.value = r.note || '';
          input.className = 'note';
          input.placeholder = 'Add note (optional)';
          input.addEventListener('change',()=>{
            r.note = input.value;
            save(state);
            render();
          });
          rEl.querySelector('.info').replaceChild(input,noteText);
        } else {
          rEl.querySelector('.info').replaceChild(document.createTextNode(r.note || ''), noteText);
        }

        yesBtn.addEventListener('click',()=>{ r.answer = 'yes'; save(state); render(); });
        noBtn.addEventListener('click',()=>{ r.answer = 'no'; save(state); render(); });
      } else {
        // read-only display for other users
        yesBtn.disabled = true; noBtn.disabled = true;
        if(r.answer==='yes') yesBtn.classList.add('active');
        if(r.answer==='no') noBtn.classList.add('active');
      }

      responsesEl.appendChild(rEl);
    });

    // delete button
    el.querySelector('.del-list').addEventListener('click',()=>{
      state.lists = state.lists.filter(x=>x.id!==list.id);
      save(state); render();
    });

    listsEl.appendChild(node);
  });
}

// wiring
userSelect.value = currentUser();
userSelect.addEventListener('change',()=>{ setCurrentUser(userSelect.value); render(); });

addBtn.addEventListener('click',()=>{
  const title = newTitle.value.trim();
  if(!title) return alert('Add a title');
  // record the creator so that the creator cannot answer their own checklist;
  // only the two other users may answer and add notes
  const item = {id:uid('l'),title,details:newDetails.value, creator: currentUser(), responses: USERS.map(u=>({user:u,answer:null,note:''}))};
  state.lists.unshift(item);
  newTitle.value=''; newDetails.value='';
  save(state); render();
});

exportBtn.addEventListener('click',()=>{
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'checklists-export.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const text = await f.text();
  try{
    const parsed = JSON.parse(text);
    if(!parsed.lists) return alert('Invalid file');
    state = parsed;
    save(state); render();
  }catch(err){
    alert('Could not parse JSON');
  }
  e.target.value = '';
});

clearBtn.addEventListener('click',()=>{
  if(!confirm('Clear all data? This cannot be undone.')) return;
  state = {lists:[]}; save(state); render();
});

// init
(async function(){
  const loaded = await loadInitial();
  state = loaded||{lists:[]};
  // ensure lists have ids
  state.lists.forEach(l=>{ if(!l.id) l.id = uid('l'); });
  // ensure responses arrays
  state.lists.forEach(l=>{
    l.responses = l.responses || USERS.map(u=>({user:u,answer:null,note:''}));
  });
  save(state);
  render();
})();
