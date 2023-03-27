import Store from 'electron-store'

const sessionStore = new Store({ name: 'session'})

/* store.has("settings") ||  */// store.set("settings", {})

class Session {
  declare id: string
  declare name: string
  declare type: string
}

function saveSession(session: Session) {
  const sessions = <any[]>sessionStore.get(`sessions`)
  if (sessions) {
    const idx = sessions.findIndex((e: Session)=>e.id==session.id)
    if (idx != -1) {
      sessions[idx] = session
    } else {
      sessions.push(session)
    }
    sessionStore.set(`sessions`, sessions)
  } else {
    sessionStore.set(`sessions`, [session])
  }
}

function loadSessions(type: string) {
  const sessions = <any[]>sessionStore.get(`sessions`)
  return sessions ? (type ? sessions.filter((e: Session)=>e.type==type) : sessions) : []
}

function deleteSession(sessionId: string) {
  const sessions = <any[]>sessionStore.get(`sessions`)
  const idx = sessions.findIndex((e: Session)=>e.id==sessionId)
  if (idx != -1) {
    sessions.splice(idx, 1)
  }
  sessionStore.set(`sessions`, sessions)
}

function clearSessions() {
  sessionStore.set(`sessions`, [])
}

// export function isAdminMode() {
//   return store.getSetting("settings.adminMode.value") == 1
// }

export default {
  saveSession,
  loadSessions,
  deleteSession,
  clearSessions,
}