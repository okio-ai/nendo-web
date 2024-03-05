import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import router from '../router'
import { useFilterStore } from '@/stores/filters.js'
import { useSessionStore } from '@/stores/session.js'
import { useToast } from 'vue-toast-notification'

const BASE_API_URL = import.meta.env.VITE_API_URL

const filterStore = useFilterStore()

export const useCollectionStore = defineStore({
    id: 'collection',
    state: () => ({
        collections: [],
        collection: {},
        collectionTemp: {},
        loading: false,
        collectionIdToAddTrackTo: null,
        trackIdToAddToCollection: null,
        error: null
    }),
    getters: {},
    actions: {
        getSearchFilterParams: function () {
            let searchFilterParams = {
                search: filterStore.search,
                filters: [],
            }

            filterStore.selectedFilters.forEach((filter) => {
                const query = {...filter.query}

                // explicitly delete filter options because of really large option array like genre, instruments, moods, etc.
                delete query.options
                searchFilterParams.filters.push(query)
            })

            return searchFilterParams
        },
        async saveTempCollectionAsGeneric(collectionId, newName) {
            const sessionStore = useSessionStore()
            if (
                collectionId === undefined ||
                newName === undefined ||
                this.loading
            ) {
                return
            }

            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections/${collectionId}/save?name=${newName}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                if (response.status !== 200) {
                    this.loading = false
                    return false
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.loading = false
                return false
            } finally {
                this.loading = false
            }
        },
        async fetchCollections(relationship_id = null) {
            const sessionStore = useSessionStore()
            // this.collections = []
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections?limit=500`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()

                if (relationship_id) {
                    this.collections = data.data.filter((collection) =>
                        collection.related_tracks.some(
                            (track) =>
                                track.relationship_source_id === relationship_id
                        )
                    )
                } else {
                    this.collections = data.data
                }
            } catch (error) {
                console.log('fetch collection errror', error)
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async fetchCollectionsByRunId(runId) {
            const sessionStore = useSessionStore()
            this.collections = []
            if (!runId) {
                return []
            }
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections?name=${runId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                if (response.status !== 200) {
                    this.loading = false
                    return
                }

                this.loading = false
                const data = await response.json()
                this.collection = data.data
                return data.data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async fetchCollection(id) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections/${id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                this.collection = data.data.collection
                this.collection.size = data.data.size
                return this.collection
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async createCollection() {
            this.loading = true
            try {
                const uuid = uuidv4()
                this.collectionTemp = {
                    id: uuid,
                    type: 'Collection',
                    collection_type: 'collection',
                    description: '',
                    name: '',
                    user_id: ''
                }
                return this.collectionTemp
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async saveCollection(collectionSaveNew) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                if (collectionSaveNew) {
                    const response = await fetch(
                        `${BASE_API_URL}/api/v1/collections`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${sessionStore.getToken()}`
                            },
                            body: JSON.stringify({
                                name: this.collectionTemp.name,
                                collection_type:
                                    this.collectionTemp.collection_type,
                                description: this.collectionTemp.description
                            })
                        }
                    )

                    if (response.status === 401) {
                        await router.push('/login')
                    }

                    const data = await response.json()
                    await this.fetchCollections()
                    return data
                } else {
                    const response = await fetch(
                        `${BASE_API_URL}/api/v1/collections/update/${this.collectionTemp.id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${sessionStore.getToken()}`
                            },
                            body: JSON.stringify({
                                name: this.collectionTemp.name,
                                collection_type: this.collectionTemp.collection_type,
                                description: this.collectionTemp.description
                            })
                        }
                    )

                    if (response.status !== 200) {
                        const data = await response.json()
                        useToast().error(
                            'Error updating collection: ' + JSON.stringify(data?.detail)
                        )
                    }

                    await this.fetchCollections()
                }
            } catch (error) {
                console.log(error)
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async addTrackToCollection(collectionId, trackId) {
            const sessionStore = useSessionStore()
            if (collectionId === undefined || trackId === undefined) {
                return
            }

            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections/${collectionId}?track_id=${trackId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async addSelectedTracksToCollection(collectionId, trackIds) {
            const sessionStore = useSessionStore()
            if (collectionId === undefined) {
                return
            }
            console.log(trackIds)

            this.loading = true
            try {
                const collectionUrl = `${BASE_API_URL}/api/v1/collections/${collectionId}/tracks/selected`
                const response = await fetch(
                    collectionUrl,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        },
                        body: JSON.stringify(trackIds)
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async addTracksToCollection(collectionId, options = {}) {
            const {
                relatedCollectionId = null,
                trackType = null
            } = options
            const sessionStore = useSessionStore()
            if (collectionId === undefined) {
                return
            }

            this.loading = true
            try {
                const searchFilterParams = this.getSearchFilterParams()
                const collectionUrl = `${BASE_API_URL}/api/v1/collections/${collectionId}/tracks?search_filter=${encodeURIComponent(
                    JSON.stringify(searchFilterParams)
                )}&track_type=${trackType}&related_collection_id=${relatedCollectionId}`
                const response = await fetch(
                    collectionUrl,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async removeTrackFromCollection(collectionId, trackId) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections/${collectionId}/remove/${trackId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false

                //CLOSE MODAL
                // this.collectionIdToAddTrackTo = undefined
                // this.trackIdToAddToCollection = undefined
            }
        },
        async removeSelectedTracksFromCollection(collectionId, trackIds) {
            const sessionStore = useSessionStore()
            if (collectionId === undefined) {
                return
            }

            this.loading = true
            try {
                const collectionUrl = `${BASE_API_URL}/api/v1/collections/${collectionId}/tracks/selected`
                const response = await fetch(
                    collectionUrl,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        },
                        body: JSON.stringify(trackIds)
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async removeTracksFromCollection(collectionId, trackType) {
            const sessionStore = useSessionStore()
            if (collectionId === undefined) {
                return
            }

            this.loading = true
            try {
                const searchFilterParams = this.getSearchFilterParams()
                const collectionUrl = `${BASE_API_URL}/api/v1/collections/${collectionId}/remove/tracks?search_filter=${encodeURIComponent(
                    JSON.stringify(searchFilterParams)
                )}&track_type=${trackType}`
                const response = await fetch(
                    collectionUrl,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async deleteCollection(collectionId) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections/${collectionId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        }
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
                await router.push('/library')
                //refresh collections
                this.fetchCollections()
            }
        }
    }
})
