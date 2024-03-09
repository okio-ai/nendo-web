import { defineStore } from 'pinia'
import { useFilterStore } from '@/stores/filters.js'
import { useSessionStore } from '@/stores/session.js'
import router from '@/router/index.js'
import { useToast } from 'vue-toast-notification'

const BASE_API_URL = import.meta.env.VITE_API_URL

const filterStore = useFilterStore()

export const useTrackStore = defineStore({
    id: 'track',
    state: () => ({
        tracks: [],
        num_results: 0,
        cursor: 0,
        hasNext: false,
        track: {},
        trackTemp: {},
        currenttrack: null,
        currenttrackbrowse: null,
        loading: false,
        error: null
    }),
    getters: {
        getPostsPerAuthor: (state) => {
            return (authorId) =>
                state.posts.filter((post) => post.userId === authorId)
        }
    },
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
        async fetchTracksByCollectionId(collectionId) {
            if (!collectionId) {
                return
            }

            const sessionStore = useSessionStore()
            this.tracks = null
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/collections/` +
                        collectionId +
                        '/tracks',
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
                const result = data.data
                this.tracks = result
                return this.tracks
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async fetchTracks(options = {}) {
            const sessionStore = useSessionStore()
            const {
                similarTo = null,
                relationshipType = null,
                relationship_id = null,
                fetch_related = false,
                track_id = null,
                collection_id = null,
                append = false,
                reset_paging = false,
                track_type = null
            } = options

            if (reset_paging) {
                this.cursor = 0
            }

            if (!append) {
                this.tracks = []
            }

            this.loading = true
            try {
                const searchFilterParams = this.getSearchFilterParams()
                let tracksUrl = `${BASE_API_URL}/api/v1/tracks`
                if(similarTo) {
                    tracksUrl = `${tracksUrl}/${similarTo}/similar?search_filter=${encodeURIComponent(
                        JSON.stringify(searchFilterParams)
                    )}&cursor=${this.cursor}`
                    if (collection_id) {
                        tracksUrl += `&collection_id=${collection_id}`
                    }
                } else if (fetch_related) {
                    tracksUrl = `${tracksUrl}/${track_id}/related?search_filter=${encodeURIComponent(
                        JSON.stringify(searchFilterParams)
                    )}&cursor=${this.cursor}`
                } else {
                    tracksUrl = `${tracksUrl}?search_filter=${encodeURIComponent(
                        JSON.stringify(searchFilterParams)
                    )}&cursor=${this.cursor}`
                    if (collection_id) {
                        tracksUrl += `&collection_id=${collection_id}`
                    }
                }

                if (track_type) {
                    tracksUrl += `&track_type=${track_type}`
                }

                const response = await fetch(tracksUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    }
                })

                if (response.status === 401) {
                    await router.push('/login')
                }
                if (response.status === 422) {
                    useToast().error("Cannot find track embedding. Generate an embeding first.")
                }

                const result = await response.json()
                this.hasNext = result.has_next
                this.num_results = result.data.num_results

                if (!append) {
                    this.tracks = result.data.tracks
                } else {
                    this.tracks.push(...result.data.tracks)
                }
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async fetchTrack(trackid) {
            const sessionStore = useSessionStore()
            this.track = null
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/tracks/` + trackid,
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
                if (response.status === 404) {
                    useToast().error("Track not found.")
                    await router.push('/library')
                }

                const result = await response.json()
                this.track = result.data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        // async createTrack(track) {
        //     this.loading = true
        //     try {
        //         this.tracks.push(track)
        //         return track
        //     } catch (error) {
        //         this.error = error
        //     } finally {
        //         this.loading = false
        //     }
        // },
        async saveTrack(trackSaveNew) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                if (trackSaveNew) {
                    const response = await fetch(
                        `${BASE_API_URL}/api/v1/tracks`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${sessionStore.getToken()}`
                            },
                            body: JSON.stringify(this.trackTemp)
                        }
                    )

                    if (response.status === 401) {
                        await router.push('/login')
                    }

                    const data = await response.json()

                    await this.fetchTracks()
                } else {
                    const response = await fetch(
                        `${BASE_API_URL}/api/v1/tracks/${this.trackTemp.id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${sessionStore.getToken()}`
                            },
                            body: JSON.stringify(this.trackTemp)
                        }
                    )

                    if (response.status !== 200) {
                        const data = await response.json()
                        useToast().error(
                            'Error updating track: ' + JSON.stringify(data?.detail)
                        )
                    }

                    this.fetchTrack(this.trackTemp.id)
                }
            } catch (error) {
                console.log(error)
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async deleteTrack(trackid) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/v1/tracks/${trackid}`,
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
            }
        },
        async deleteSelectedTracks(trackIds) {
            const sessionStore = useSessionStore()
            this.loading = true
            try {
                const searchFilterParams = this.getSearchFilterParams()
                let tracksUrl = `${BASE_API_URL}/api/v1/tracks/selected`
                const response = await fetch(tracksUrl, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    },
                    body: JSON.stringify(trackIds)
                })

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
        async deleteTracks(options = {}) {
            const sessionStore = useSessionStore()
            const {
                collection_id = null,
                track_type = null
            } = options
            this.loading = true
            try {
                const searchFilterParams = this.getSearchFilterParams()
                let tracksUrl = `${BASE_API_URL}/api/v1/tracks?search_filter=${encodeURIComponent(
                    JSON.stringify(searchFilterParams)
                )}`

                if (collection_id) {
                    tracksUrl += `&collection_id=${collection_id}`
                }

                if (track_type) {
                    tracksUrl += `&track_type=${track_type}`
                }

                const response = await fetch(tracksUrl, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    }
                })

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
    }
})
