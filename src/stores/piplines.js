import { defineStore } from 'pinia'
import { useSessionStore } from '@/stores/session.js'
import router from '@/router/index.js'

const BASE_API_URL = import.meta.env.VITE_API_URL

export const usePipelineStore = defineStore({
    id: 'pipeline',
    state: () => ({
        workflowStatuses: {},
        loading: false,
        error: null
    }),
    getters: {},
    actions: {
        async fetchPipelineNodeStatuses(current_run_id) {
            const sessionStore = useSessionStore()
            const response = await fetch(
                `${BASE_API_URL}/api/v1/actions?run_id=${current_run_id}`,
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    }
                }
            )

            if (response.status === 401) {
                await router.push('/login')
            }

            return await response.json()
        },
        async fetchPipelineWorkflowStatuses() {
            const sessionStore = useSessionStore()
            const response = await fetch(
                `${BASE_API_URL}/api/v1/actions/workflows`,
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    }
                }
            )

            if (response.status === 401) {
                await router.push('/login')
            }

            this.workflowStatuses = await response.json()
        }
    }
})
