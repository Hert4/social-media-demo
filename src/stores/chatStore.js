import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getItem, setItem } from '../utils/localStorage.js'

const STORAGE_KEY = 'socialvue_chats'

// Predefined fake contacts
const FAKE_USERS = [
  {
    id: 'user-emma',
    name: 'Emma Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    status: 'online',
    replies: [
      "That's awesome! Tell me more.",
      "Haha, nice one!",
      "I totally agree with you.",
      "Sounds like a plan!",
      "Interesting, I hadn't thought of that.",
      "Let's catch up soon!",
      "Cool, keep me posted.",
    ],
  },
  {
    id: 'user-marcus',
    name: 'Marcus Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    status: 'online',
    replies: [
      "Hey, great to hear from you!",
      "I've been working on something similar.",
      "That's a solid approach.",
      "Let me think about that...",
      "Yeah, Vue 3 is really great for this.",
      "Have you tried using Pinia for state?",
      "Nice! Ship it!",
    ],
  },
  {
    id: 'user-sofia',
    name: 'Sofia Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    status: 'away',
    replies: [
      "Oh wow, that's really cool!",
      "I love that idea!",
      "We should collaborate on this.",
      "Sending good vibes your way!",
      "Let's set up a call next week.",
      "Thanks for sharing!",
      "I'm so here for this.",
    ],
  },
]

// Default messages so chats aren't empty
const DEFAULT_CHATS = {
  'user-emma': [
    { id: 'm1', sender: 'user-emma', text: "Hey! How's the project going?", timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'm2', sender: 'me', text: "Going great! Just finished the feed feature.", timestamp: new Date(Date.now() - 7000000).toISOString() },
    { id: 'm3', sender: 'user-emma', text: "That's awesome! Tell me more.", timestamp: new Date(Date.now() - 6800000).toISOString() },
  ],
  'user-marcus': [
    { id: 'm4', sender: 'user-marcus', text: "Have you seen the new Vite 5 release?", timestamp: new Date(Date.now() - 86400000).toISOString() },
  ],
  'user-sofia': [],
}

export const useChatStore = defineStore('chats', () => {
  const contacts = ref(FAKE_USERS)
  const chats = ref(getItem(STORAGE_KEY, DEFAULT_CHATS))
  const activeContactId = ref(FAKE_USERS[0].id)

  const activeContact = computed(() =>
    contacts.value.find((c) => c.id === activeContactId.value)
  )

  const activeMessages = computed(() =>
    chats.value[activeContactId.value] || []
  )

  function persist() {
    setItem(STORAGE_KEY, chats.value)
  }

  function selectContact(contactId) {
    activeContactId.value = contactId
  }

  function sendMessage(text) {
    if (!text.trim()) return

    const contactId = activeContactId.value
    if (!chats.value[contactId]) chats.value[contactId] = []

    // Add user message
    chats.value[contactId].push({
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    })
    persist()

    // Simulate auto-reply after 1–2 seconds
    const contact = contacts.value.find((c) => c.id === contactId)
    if (contact) {
      const delay = 1000 + Math.random() * 1000
      setTimeout(() => {
        const reply = contact.replies[Math.floor(Math.random() * contact.replies.length)]
        if (!chats.value[contactId]) chats.value[contactId] = []
        chats.value[contactId].push({
          id: `msg-${Date.now()}`,
          sender: contactId,
          text: reply,
          timestamp: new Date().toISOString(),
        })
        persist()
      }, delay)
    }
  }

  return {
    contacts,
    chats,
    activeContactId,
    activeContact,
    activeMessages,
    selectContact,
    sendMessage,
  }
})
