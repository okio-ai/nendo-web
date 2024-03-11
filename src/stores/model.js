import { defineStore } from 'pinia'
import { useSessionStore } from '@/stores/session.js'
import { useRouter } from 'vue-router'

const BASE_API_URL = import.meta.env.VITE_API_URL
const router = useRouter()

export const useModelStore = defineStore({
    id: 'model',
    state: () => ({
        availableModels: []
    }),
    getters: {},
    actions: {
        async fetchModelInfo() {
            const sessionStore = useSessionStore()
            const url = `${BASE_API_URL}/api/v1/models`
            const response = await fetch(url, {
                method: 'OPTIONS',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStore.getToken()}`
                }
            })

            if (response.status === 401) {
                await router.push('/login')
            }

            const jsonResponse = await response.json()
            this.availableModels = jsonResponse.data
            return this.availableModels
        },
    }
})
