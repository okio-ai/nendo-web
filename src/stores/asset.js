import { defineStore } from 'pinia'
import { useSessionStore } from '@/stores/session.js'
import { useRouter } from 'vue-router'

const BASE_API_URL = import.meta.env.VITE_API_URL
const router = useRouter()

export const useAssetStore = defineStore({
    id: 'asset',
    state: () => ({
        userInfo: {},
        downloadedTrack: null,
        downloadedTracks: null,
        downloadedCollection: null,
    }),
    getters: {},
    actions: {
        async fetchAssetInfo() {
            const sessionStore = useSessionStore()
            const url = `${BASE_API_URL}/api/v1/assets/info`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStore.getToken()}`
                }
            })

            if (response.status === 401) {
                await router.push('/login')
            }

            const jsonResponse = await response.json()
            this.userInfo = jsonResponse.data
            return this.userInfo
        },
        async downloadTrack(trackid) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/assets/audio/download/track/` +
                        trackid,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                    return
                }

                if (!response.ok) {
                    throw new Error('Failed to download track')
                }

                const blob = await response.blob()
                this.downloadedTrack = blob
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async downloadTracks(trackids) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/assets/audio/download/tracks`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        },
                        body: JSON.stringify(trackids)
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                    return
                }

                if (!response.ok) {
                    throw new Error('Failed to download tracks')
                }

                const blob = await response.blob()
                this.downloadedTracks = blob
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async downloadCollection(collectionId) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/assets/audio/download/collection/` +
                        collectionId,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                    return
                }

                if (!response.ok) {
                    throw new Error('Failed to download Collection')
                }

                const blob = await response.blob()
                this.downloadedCollection = blob
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
    }
})
