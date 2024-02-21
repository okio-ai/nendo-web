import { defineStore } from 'pinia'
import { useSessionStore } from '@/stores/session.js'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'

const BASE_API_URL = import.meta.env.VITE_API_URL
const router = useRouter()

export const useActionStore = defineStore({
    id: 'action',
    state: () => ({
        loading: false,
        error: null
    }),
    getters: {},
    actions: {
        async fetchActionStatuses() {
            const sessionStore = useSessionStore()
            const url = `${BASE_API_URL}/api/v1/actions`
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
            return jsonResponse.data
        },
        // async fetchActionsOptions() {
        //     const sessionStore = useSessionStore()
        //     this.filters = []
        //     this.loading = true
        //     try {
        //         const response = await fetch(`${BASE_API_URL}/api/v1/actions`, {
        //             method: 'OPTIONS',
        //             headers: {
        //                 'Content-Type': 'application/json',
        //                 Authorization: `Bearer ${sessionStore.getToken()}`
        //             }
        //         })

        //         if (response.status === 401) {
        //             await router.push('/login')
        //         }

        //         const data = await response.json()
        //         this.actionOptions = data.data

        //         this.error = null
        //         return data.data
        //     } catch (error) {
        //         this.error = error
        //     } finally {
        //         this.loading = false
        //     }
        //     return []
        // },
        async createAction(targetId, options) {
            const sessionStore = useSessionStore()

            this.loading = true
            const paramsDict = options.params.reduce((acc, plugin) => {
                acc[plugin.id] = plugin.settings.reduce((settingsAcc, setting) => {
                    settingsAcc[setting.id] = setting.value
                    return settingsAcc
                }, {})
            
                return acc
            }, {})
            try {
                let actionsUrl = `${BASE_API_URL}/api/v1/${options.name}?target_id=${targetId}` +
                (options.replace_plugin_data ? `&replace=${options.replace_plugin_data}` : '') +
                (options.add_to_collection_id ? `&add_to_collection_id=${options.add_to_collection_id}` : '')
                const response = await fetch(
                    actionsUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${sessionStore.getToken()}`
                        },
                        body: JSON.stringify(paramsDict)
                    }
                )

                if (response.status === 401) {
                    await router.push('/login')
                }
                if (response.status === 404) {
                    useToast().error('Target not found.')
                    return null
                }
                if (response.status === 500) {
                    useToast().error('Failed to create action. Please check the logs or inform your administrator.')
                    return null
                }
                if (response.status === 507) {
                    useToast().error('Failed to create action. Storage limit reached.')
                    return null
                }
                if (response.status === 200) {
                    useToast().success('Action created successfully.')
                }

                const data = await response.json()
                return data
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        },
        async abortAction(runId) {
            const sessionStore = useSessionStore()
            const url = `${BASE_API_URL}/api/v1/actions/${runId}`
            this.loading = true
            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStore.getToken()}`
                    }
                })
            } catch (error) {
                this.error = error
            } finally {
                this.loading = false
            }
        }
    }
})
