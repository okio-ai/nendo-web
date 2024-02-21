import { defineStore } from 'pinia'
import { useSessionStore } from '@/stores/session.js'
import router from '../router'

const BASE_API_URL = import.meta.env.VITE_API_URL

export const useFilterStore = defineStore({
    id: 'filter',
    state: () => ({
        filters: [],
        search: '',
        selectedFilters: [],
        error: null
    }),
    getters: {},
    actions: {
        formatFilterOptions: function () {
            for (let i = 0; i < this.filters.length; i++) {
                const originalOptions = this.filters[i].filter_options
                this.filters[i].filter_options = []

                originalOptions.forEach((origOption) => {
                    this.filters[i].filter_options.push({
                        filter_key: this.filters[i].filter_key,
                        filter_option: origOption
                    })
                })
            }
        },
        async fetchFilters() {
            const sessionStore = useSessionStore()
            this.filters = []
            try {
                const response = await fetch(`${BASE_API_URL}/api/v1/tracks`, {
                    method: 'OPTIONS',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    }
                })

                if (response.status === 401) {
                    await router.push('/login')
                }

                const data = await response.json()
                this.filters = data.data
                this.formatFilterOptions()

                this.error = null
            } catch (error) {
                this.error = error
            }
        }
    }
})
