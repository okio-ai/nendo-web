<template>
    <div class="flex flex-col h-screen text-gray-800 dark:text-white bg-white dark:bg-ngreyblack">
        <div class="h-[62px] flex p-3 z-40 w-full border-b dark:border-b-4 dark:border-black bg-white dark:bg-ngreyblack">
            <div class="text-2xl font-bold cursor-pointer whitespace-nowrap mr-2 flex" v-if="!browserStore.sidebarActive">
                <font-awesome-icon icon="bars" class="ml-2.5 mr-2 mt-1 text-gray-500 hover:text-ngreenhover" @click="browserStore.sidebarActive = !browserStore.sidebarActive" />
            </div>
            <div class="text-2xl font-bold text-ngreenhover cursor-pointer whitespace-nowrap ml-1 flex">
                Actions
            </div>
        </div>
        <div class="flex-1 overflow-auto">
            <table class="min-w-full border-collapse">
                <thead>
                    <tr class="text-left border-b dark:border-black">
                        <th
                            class="py-3 px-4 text-sm"
                        >
                            Action Name
                        </th>
                        <th
                            class="py-3 px-4 text-sm"
                        >
                            Start Time
                        </th>
                        <th
                            class="py-3 px-4 text-sm"
                        >
                            Status
                        </th>
                        <th
                            class="py-3 px-4 text-sm"
                        >
                            Progress
                        </th>
                        <th
                            class="py-3 px-4 text-sm"
                        >
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(action, index) in actions" :key="index">
                        <tr class="hover:bg-gray-200 dark:hover:bg-gray-800 text-sm">
                            <td class="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                                {{ action.meta.action_name }}
                            </td>
                            <td class="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                                <span v-if="action.status == 'started'">
                                    {{ action.started_at }}
                                </span>
                            </td>
                            <td class="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                                {{ action.status }}
                            </td>
                            <td class="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                                <span v-if="action.status == 'started' && action.meta != ''">
                                    {{ action.meta.progress }}
                                </span>
                            </td>
                            <td class="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                                <a
                                    href="#"
                                    class="text-blue-500 hover:text-blue-700"
                                    @click="toggleDetails(action)"
                                >
                                    {{
                                        action.showDetails
                                            ? 'Hide Details'
                                            : ((action.meta.errors && action.meta.errors.length > 0) ? 'View Details (' + action.meta.errors.length + ' errors)' : 'View Details')
                                    }}
                                </a>
                            </td>
                            <td class="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                                <button
                                    v-if="
                                        action.status == 'scheduled' ||
                                        action.status == 'queued' ||
                                        action.status == 'started'
                                    "
                                    @click="abortAction(action.id)"
                                    class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                            </td>
                        </tr>
                        <tr v-if="action.showDetails">
                            <td :colspan="5" class="text-gray-500 p-4">
                                <p><span class="font-bold">Action ID</span>: {{ action.id }}</p>
                                <p v-if="action.meta.target"><span class="font-bold">Action Target</span>: <span class="text-blue-500 hover:text-blue-700 cursor-pointer" @click="gotoLibrary(action.meta.target.target_type, action.meta.target.target_id)">{{ action.meta.target.target_title }}</span></p>
                                <span class="font-bold">Action Parameters</span>:
                                    <div v-if="action.meta.parameters">
                                        <div v-for="(value, key) in parseDict(action.meta.parameters)" :key="key">
                                        {{ key }}: {{ value }}
                                        </div>
                                    </div>
                                    <div v-else>
                                        No parameters available.
                                    </div>
                                <span class="font-bold">Action Errors</span>:
                                    <div v-if="action.meta.errors">
                                        <div v-for="error in action.meta.errors" :key="error" v-html="wrapUUIDsWithLinks(error)"></div>
                                    </div>
                                    <div v-if="action.exc_info">
                                    {{ action.exc_info }}
                                    </div>
                                <!-- <p v-if="action.status != 'failed'">
                                    <span class="font-bold">Action Result</span>: {{ action.result }}
                                </p>-->
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { forEach } from 'lodash'
import { useActionStore } from '@/stores/actions.js'
import { useBrowserStore } from '@/stores/browser.js'

export default {
    setup() {
        const router = useRouter()
        const actionStore = useActionStore()
        const browserStore = useBrowserStore()

        const actions = ref(null)
        let intervalId

        function updateActionAnimation() {
            actionStore.actionsRunning = false
            forEach(actions.value, function (value, key) {
                if (value.status === 'started') {
                    actionStore.actionsRunning = true
                }
            })
        }

        const getData = async () => {
            const jsonData = await actionStore.fetchActionStatuses()

            let showDetailsMap = []
            forEach(actions.value, function (value, key) {
                if (actions.value[key].showDetails) {
                    showDetailsMap.push(actions.value[key].id)
                }
            })

            forEach(jsonData, function (value, key) {
                if (showDetailsMap.includes(jsonData[key].id)) {
                    jsonData[key].showDetails = true
                }
            })

            // sort actions
            jsonData.sort((a, b) => new Date(b.enqueued_at) - new Date(a.enqueued_at))

            actions.value = jsonData

            updateActionAnimation()
        }

        const abortAction = async (runId) => {
            await actionStore.abortAction(runId)
        }

        const gotoLibrary = (target_type, target_id) => {
            if (target_type == "collection"){
                router.push({ path: '/collection/' + target_id })
            } else {
                router.push({ path: '/library/' + target_id })
            }
        
        }

        const ACTION_PULL_INTERVAL = 2000

        onMounted(() => {
            actionStore.actionsRunning = false
            //PULl ON THE ACTIONS ENDPOINT
            intervalId = setInterval(getData, ACTION_PULL_INTERVAL)
        })

        onUnmounted(() => {
            clearInterval(intervalId)
        })

        return {
            actions,
            abortAction,
            gotoLibrary,
            browserStore
        }
    },
    methods: {
        toggleDetails(action) {
            action.showDetails = !action.showDetails
        },

        parseDict(dictString) {
            try {
                let formattedString = dictString.replace(/True/g, 'true').replace(/False/g, 'false');
                formattedString = formattedString.replace(/'/g, '"');

                return JSON.parse(formattedString);
            } catch(e) {
                console.error("Error parsing stringified dictionary: ", e);
                return {};
            }
        },

        wrapUUIDsWithLinks(text) {
            // UUIDv4 regular expression pattern
            const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
            
            // Replace matching UUIDv4 strings with an <a> tag link
            return text.replace(uuidPattern, (uuid) => {
                return `<a href="library/${uuid}" class="text-blue-500 hover:text-blue-700">${uuid}</a>`
            })
        }
    }
}
</script>
