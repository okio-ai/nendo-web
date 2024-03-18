<script setup>
import {   computed, ref, watch, onMounted } from 'vue'
import Modal from '@/components/apps_components/component_modal.vue'
import ToolMashuper from '@/components/apps/nendo_mashuper/nendo_mashuper_main.vue'
import CollectionPicker from '@/components/apps_components/component_collection_picker.vue'

import { useTrackStore } from '@/stores/track.js'
import { useBrowserStore } from '@/stores/browser.js'
import { useActionStore } from '@/stores/actions.js'
import { useModelStore } from '@/stores/model.js'
import { useCollectionStore } from '@/stores/collection.js'
import { useSessionStore } from '@/stores/session.js'

import { useRouter, useRoute } from 'vue-router'

const BASE_API_URL = import.meta.env.VITE_API_URL

const router = useRouter()
const route = useRoute()

const trackStore = useTrackStore()
const browserStore = useBrowserStore()
const actionStore = useActionStore()
const collectionStore = useCollectionStore()
const modelStore = useModelStore()

const props = defineProps({
    modalopen: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['modalClosed'])
const isOpen = ref(props.modalopen)
const showConfig = ref(false)
const toolActive = ref(true)
const actionStatus = ref('')
const actionResult = ref('')

function generateRandomName() {
    const adjectives = ["Funky", "Silly", "Mighty", "Quiet", "Loud", "Shiny"];
    const nouns = ["Zebras", "Pandas", "Rockets", "Stars", "Wizards", "Knights"];
    const verbs = ["Ponder", "Whisper", "Shout", "Sing", "Dance", "Think"];

    // Helper function to select a random item from an array
    function getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    return `${getRandomItem(adjectives)}${getRandomItem(nouns)}${getRandomItem(verbs)}${getRandomItem(adjectives)}`;
}

const generatorData = ref({
    generator_selected: null,
    replace_plugin_data: true,
    add_to_collection_id: '',
    generator : [
        { 
            id: 'musicanalysis',
            name: 'Music Analysis',
            description: '',
            image: '',
            showInput: true,
            showReplaceSelector: true,
            showAddToCollectionPicker: false,
            plugins: []
        },
        { 
            id: 'voiceanalysis',
            name: 'Voice Analysis',
            description: '',
            image: '',
            showInput: true,
            showReplaceSelector: true,
            showAddToCollectionPicker: false,
            plugins: []
        },
        { 
            id: 'polymath',
            name: 'Polymath',
            description: '',
            image: '',
            showInput: true,
            showReplaceSelector: true,
            showAddToCollectionPicker: true,
            plugins: [
                {
                    id: 'classify',
                    name: 'Classify',
                    showSettings: false,
                    settings: [
                        { id: 'isActive', name: 'Active', description: '', type: 'check', value: true }
                    ]
                },
                {
                    id: 'stemify',
                    name: 'Stemify',
                    showSettings: false,
                    settings: [
                        { id: 'isActive', name: 'Active', description: '', type: 'check', value: true },
                        { id: 'stemtype', name: 'Stem-Type', description: '', type: 'multiselect', value: ['vocals', 'drums', 'bass', 'other'], value_options: ['vocals', 'drums', 'bass', 'other'] },
                    ]
                },
                {
                    id: 'quantize',
                    name: 'Quantize',
                    showSettings: false,
                    settings: [
                        { id: 'isActive',name: 'Active', description: '', type: 'check', value: false },
                        { id: 'tempo',name: 'BPM', description: 'BPM', type: 'numbers', value: '120', value_min: '1', value_max: '500', value_step: '0.1' }
                    ]
                },
                {
                    id: 'loopify',
                    name: 'Loopify',
                    showSettings: false,
                    settings: [
                        { id: 'isActive', name: 'Active', description: '', type: 'check', value: true },
                        // { id: 'loop_length', name: 'Loop Length', description: '', type: 'numbers', value: '4', value_min: '1', value_max: '500', value_step: '1' },
                        { id: 'n_loops', name: 'Number of loops', description: '', type: 'numbers', value: '4', value_min: '1', value_max: '500', value_step: '1' },
                        { id: 'beats_per_loop', name: 'Beats per loop', description: '', type: 'numbers', value: '4', value_min: '1', value_max: '500', value_step: '1' }
                    ]
                },
                {
                    id: 'embeddings',
                    name: 'Embeddings',
                    showSettings: false,
                    settings: [
                        { id: 'isActive', name: 'Active', description: '', type: 'check', value: true }
                    ]
                }
            ]
        },
        { 
            id: 'musicgen',
            name: 'Music Generator',
            description: '',
            image: '',
            showInput: false,
            showReplaceSelector: false,
            showAddToCollectionPicker: true,
            plugins: [
                {
                    id: 'musicgen',
                    name: 'MusicGen',
                    showSettings: true,
                    settings: [
                        { id: 'prompt', name: 'Prompt', description: '', type: 'string', value: '' },
                        { id: 'cfg',name: 'CFG', description: '', type: 'numbers', value: '4.5', value_min: '0', value_max: '30', value_step: '0.1' },
                        { id: 'temperature',name: 'Temperature', description: '', type: 'numbers', value: '1', value_min: '0', value_max: '30', value_step: '0.1' },
                        {
                            id: 'model', name: 'Base model', description: '', type: 'select', value: 'facebook/musicgen-small',
                            value_options: []
                        },
                    ]
                },
            ]
        },
        {
            id: 'musicgentrain',
            name: 'MusicGen Training',
            description: '',
            image: '',
            showInput: true,
            showReplaceSelector: true,
            showAddToCollectionPicker: false,
            plugins: [
                {
                    id: 'musicgentrain',
                    name: 'MusicGen Training',
                    showSettings: true,
                    settings: [
                        { id: 'output_model_name', name: 'Output Model Name', description: 'Name of the output model checkpoint', type: 'string', value: generateRandomName() },
                        { id: 'prompt', name: 'Style Prompt', description: 'Default prompt to append to each track', type: 'string', value: '' },
                        { id: 'batch_size', name: 'Batch size', description: '', type: 'numbers', value: '1', value_min: '1', value_max: '500', value_step: '1' },
                        { id: 'epochs', name: 'Epochs', description: '', type: 'numbers', value: '5', value_min: '1', value_max: '256', value_step: '1' },
                        { id: 'lr', name: 'Learning Rate', description: '', type: 'numbers', value: '0.0001', value_min: '0', value_max: '1.0', value_step: '0.0001' },
                        {
                            id: 'model', name: 'Base model', description: '', type: 'select', value: 'facebook/musicgen-small',
                            value_options: [
                                'facebook/musicgen-small',
                                'facebook/musicgen-stereo-small',
                                'facebook/musicgen-medium',
                                'facebook/musicgen-stereo-medium'
                            ]
                        },
                        { id: 'remove_vocals', name: 'Remove Vocals', description: '', type: 'check', value: true },
                        { id: 'run_analysis', name: 'Run analysis', description: '', type: 'check', value: true },
                    ]
                },
            ]
        },
        {
            id: 'voicegen',
            name: 'Voice Generator',
            description: '',
            image: '',
            showInput: false,
            showReplaceSelector: false,
            showAddToCollectionPicker: true,
            plugins: [
                {
                    id: 'voicegen',
                    name: 'VoiceGen',
                    showSettings: true,
                    settings: [
                        { id: 'prompt', name: 'Prompt', description: '', type: 'string', value: '' },
                        { id: 'voice', name: 'Voice-Type', description: '', type: 'select', value: 'f-us-1', value_options: ["f-us-1", "f-us-2", "f-us-3", "f-us-4", "m-us-1", "m-us-2", "m-us-3", "m-us-4"] },
                    ]
                },
            ]
        },
        {
            id: 'webimport',
            name: 'Web Importer',
            description: '',
            image: '',
            showInput: false,
            showReplaceSelector: false,
            showAddToCollectionPicker: true,
            plugins: [
                {
                    id: 'webimport',
                    name: 'WebImport',
                    showSettings: true,
                    settings: [
                        { id: 'links', name: 'Links', description: '', type: 'list', value: [''] },
                        { id: 'limit', name: 'Playlist Limit', description: '', type: 'numbers', value: '-1', value_min: '-1', value_max: '500', value_step: '1'}
                    ]
                },
            ]
        },
        { 
            id: 'getpage',
            name: 'Get Page',
            description: '',
            image: '',
            showInput: true,
            showReplaceSelector: true,
            showAddToCollectionPicker: false,
            plugins: []
        }
    ]
})

onMounted(async () => {
    toolActive.value = false
    showConfig.value = false
    await modelStore.fetchModelInfo()
    generatorData.value.generator
        .find(g => g.id === "musicgen")
        .plugins[0]
        .settings.find(s => s.id === "model")
        .value_options = modelStore.availableModels
})

watch(() => props.modalopen, (newValue) => {
    isOpen.value = newValue
    toolActive.value = false
    showConfig.value = false
})

const generatorStart = async () => {
    if( router.currentRoute.value.name === 'library' && generatorData.value.generator_selected.showInput) {
        let text = "Process entire library?"
        if (confirm(text) == true) {
            generatorRun()
        } 
    } else {
        generatorRun()
    }
}


const generatorRun = async () => {
    toolActive.value = true

    const generator_data = {
        id: generatorData.value.generator_selected.id,
        replace_plugin_data: generatorData.value.replace_plugin_data,
        plugins: []
    }
    for (let i=0; i < generatorData.value.generator_selected.plugins.length; i++){
        const plugindata = {id:generatorData.value.generator_selected.plugins[i].id, settings: []}
        for (let x=0; x < generatorData.value.generator_selected.plugins[i].settings.length; x++){
            plugindata.settings.push({id: generatorData.value.generator_selected.plugins[i].settings[x].id, value: generatorData.value.generator_selected.plugins[i].settings[x].value})
        }
        generator_data.plugins.push(plugindata)
    }

    let dataToProcess = ''
    if(router.currentRoute.value.name === 'track') {
        dataToProcess = {type: 'track', id: trackStore.track.id}
    }
    else if(router.currentRoute.value.name === 'collection') {
        dataToProcess = {type: 'collection', id: route.params.id}
    }
    else {
        dataToProcess = {type: 'library', id: ''}
    }

    const result = await actionStore.createAction(
        dataToProcess.id,
        {
            name: generator_data.id,
            params: generator_data.plugins,
            targetType: dataToProcess.type,
            replace_plugin_data: (
                generatorData.value.generator_selected.showReplaceSelector ?
                generator_data.replace_plugin_data :
                undefined
            ),
            add_to_collection_id: (
                generatorData.value.generator_selected.showAddToCollectionPicker ?
                generatorData.value.add_to_collection_id :
                undefined
            )
        } 
    )
    if (!result){
        // error, close modal
        actionStatus.value = 'rejected'
        return
    }
    const actionId = result.action_id
    const sessionStore = useSessionStore()
    // poll action status
    actionResult.value = ''
    actionStatus.value = 'started'
    let statusData = null
    while (toolActive.value === true && actionStatus.value !== 'finished' && actionStatus.value !== 'failed') {
        const statusResponse = await fetch(
        BASE_API_URL + '/api/actions/' + actionId,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStore.getToken()}`
            }
        }
        )
        statusData = await statusResponse.json()
        if (statusData.data) {
            actionStatus.value = statusData.data.status
        }
        // Optional: Add a delay to prevent hammering the server with requests
        if (actionStatus.value !== 'finished' && isOpen.value === true) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
    if (actionStatus.value !== 'failed') {
        actionResult.value = statusData.data.result
    }
}

const routeToResult = async () => {
    if (actionResult.value !== ''){
        if (actionResult.value.startsWith('collection')){
            await router.push({ path: '/' + actionResult.value })    
        } else {
            await router.push({ path: '/library/' + actionResult.value })
        }
        closeModal() 
    } else {
        await router.push({ path: '/action' })
    }
}

const closeModal = async () => {
    isOpen.value = false
    showConfig.value = false
    toolActive.value = false
    emit('modalClosed')
}

const handleCollectionSelect = (collectionId, collectionName) => {
    generatorData.value.add_to_collection_id = collectionId
}

const validateNumberInput = (settings) => {
  const value = parseFloat(settings.value);
  if (isNaN(value)) {
    settings.value = settings.value_min;
  } else {
    settings.value = Math.min(Math.max(value, settings.value_min), settings.value_max);
  }
}

const beforeEnter = (el) => {
    el.style.height = '0';
}

const enter = (el) => {
    el.style.height = el.scrollHeight + 'px';
}

const afterEnter = (el) => {
    el.style.height = null;
}

const beforeLeave = (el) => {
    el.style.height = el.scrollHeight + 'px';
}

const leave = (el) => {
    el.style.height = '0';
}

const afterLeave = (el) => {
    el.style.height = null;
}

watch(() => browserStore.toolViewActiveTool, (toolId) => {
    generatorData.value.generator_selected = generatorData.value.generator.find(gen => gen.id === toolId) || null
})

watch(() => browserStore.toolViewActive, () => {
    generatorData.value.generator_selected = generatorData.value.generator.find(gen => gen.id === browserStore.toolViewActiveTool) || null
})

const showTrackTitleWithFallback = (track, index) => {
    if (track.meta && track.meta.title){ 
        return track.meta.title
    }
    if (track.resource && track.resource.meta && track.resource.meta.title){
        return track.resource.meta.title
    }
    if (track.resource && track.resource.meta && track.resource.meta.original_filename){
        return track.resource.meta.original_filename
    }
    return `Track ${index}`
}

const getCollectionId = computed(() => {
    if(router.currentRoute.value.name === 'collection') {
        return route.params.id
    }
    return null
})

const autoResize = (event) => {
    const element = event.target;
    element.style.height = 'auto'; // Temporarily shrink to auto to get the correct scrollHeight
    element.style.height = `${element.scrollHeight}px`; // Set the height to the scroll height
}

const getIsActiveSetting = (plugin) => {
    return plugin.settings.find(setting => setting.id === 'isActive');
};


</script>

<template>
    <modal :open="isOpen" @update:open="closeModal"  title="">
        <template v-if="toolActive">
            <div class="text-xl font-bold text-ngreenhover border-b dark:border-gray-800 pb-3" >
                {{ generatorData.generator_selected.name }}
            </div>
            <h1 class="text-xl font-medium my-10">
                <span v-if="actionStatus === 'queued'">
                    <img src="/assets/spinner1.gif" class="max-w-[34px] float-left mr-4" />
                    Action has been queued
                </span>
                <span v-if="actionStatus === 'started'">
                    <img src="/assets/spinner1.gif" class="max-w-[34px] float-left mr-4" />
                    Results are being computed
                </span>
                <span v-if="actionStatus === 'failed' || actionStatus === 'rejected'">
                    <font-awesome-icon icon="triangle-exclamation" class="h-[28px] float-left mr-4" />
                    Action failed
                </span>
                <span v-if="actionStatus === 'finished'">
                    <img src="/assets/done.gif" class="max-w-[34px] float-left mr-4" />
                    Action completed
                </span>
            </h1> 
            <button v-if="actionStatus !== 'rejected'" class="px-8 py-2 mt-4 mr-4 text-md bg-npurple text-white font-bold rounded-md focus:outline-none" @click="routeToResult">
                <span v-if="actionStatus === 'queued'">
                    <font-awesome-icon icon="wand-magic-sparkles" class="mr-1" />
                    See Queue
                </span>
                <span v-if="actionStatus === 'started'">
                    <font-awesome-icon icon="wand-magic-sparkles" class="mr-1" />
                    See Progress
                </span>
                <span v-if="actionStatus === 'failed'">
                    <font-awesome-icon icon="wand-magic-sparkles" class="mr-1" />
                    See Error
                </span>
                <span v-if="actionStatus === 'finished'">
                    <font-awesome-icon icon="list" class="mr-1" />
                    Go to Result
                </span>
            </button>
            <button class="px-4 py-2 mt-4 text-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-medium rounded-md focus:outline-none" @click="closeModal">
                Continue
            </button>
        </template>
        <div v-else class="max-h-[90vh] overflow-auto">
            <template v-if="browserStore.toolViewActiveTool === 'mashuper'">
                <ToolMashuper :collection-id="getCollectionId" @modalClosed="closeModal"></ToolMashuper>
            </template>
            <template v-else>
                <div @click.stop v-if="generatorData.generator_selected">
                    <font-awesome-icon icon="x" class="float-right mt-1 cursor-pointer hover:text-ngreenhover" @click="closeModal" />
                    <div class="text-xl font-bold text-ngreenhover border-b dark:border-gray-800 pb-3">
                        {{ generatorData.generator_selected.name }}
                    </div>

                    <template v-if="generatorData.generator_selected.description">
                        <div class="py-4 max-w-[600px] text-gray-400 border-b dark:border-gray-800 text-sm">
                            {{ generatorData.generator_selected.description }}
                        </div>
                    </template>

                    <template v-if="generatorData.generator_selected.showInput">
                        <div class="pt-3 pb-3 flex border-b dark:border-gray-800">
                            <div class="font-medium mr-4 mt-0.5">
                                <font-awesome-icon icon="download" class="mr-2" />
                                Input
                            </div>
                            <div class="text-sm border dark:border-gray-800 px-2 py-1 rounded">
                                <template v-if="router.currentRoute.value.name === 'library'">
                                    <font-awesome-icon icon="list" class="mr-1" />
                                    Library
                                </template>
                                <template v-if="router.currentRoute.value.name === 'collection'">
                                    <font-awesome-icon icon="list" class="mr-1" />
                                    Collection: {{ collectionStore.collection.name }}
                                </template>
                                <template v-if="router.currentRoute.value.name === 'track'">
                                    <font-awesome-icon icon="music" class="mr-1" />
                                    Track: {{ showTrackTitleWithFallback(trackStore.track,0) }}
                                </template>
                            </div>
                        </div>
                    </template>

                    <div v-if="generatorData.generator_selected.plugins.length > 0">
                        <!-- <div class="font-bold pt-3 pb-3 border-b dark:border-gray-800">Tools</div> -->
                        <div v-for="(plugin, pluginindex) in generatorData.generator_selected.plugins" :key="pluginindex" class="border-b dark:border-gray-800 text-md">
                            <div class="cursor-pointer py-2.5" @click="plugin.showSettings = !plugin.showSettings" v-if="generatorData.generator_selected.plugins.length > 1">
                                <svg class="h-4 w-4 float-right mt-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{'transform rotate-180': plugin.showSettings}">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                                <div class="" :class="{'text-gray-400': !getIsActiveSetting(plugin).value}">
                                    <!-- <template v-if="generatorData.generator_selected.plugins.length > 1">{{ pluginindex + 1 }}.</template>   -->
                                    <input type="checkbox" v-model="getIsActiveSetting(plugin).value" @click.stop class="form-checkbox h-4 w-4 mr-2 text-blue-600" />
                                    {{ plugin.name }}
                                </div>
                            </div>
                            <div v-else class="mb-2"></div>
                            <transition
                                name="expand"
                                @before-enter="beforeEnter"
                                @enter="enter"
                                @after-enter="afterEnter"
                                @before-leave="beforeLeave"
                                @leave="leave"
                                @after-leave="afterLeave"
                            >
                                <div v-if="plugin.showSettings" class="py-2">
                                    <div v-for="(settings, settingsindex) in plugin.settings" :key="settingsindex" class="flex mb-2 items-center text-sm">
                                        <template v-if="settings.id !== 'isActive'">
                                            <div class="min-w-[150px]">{{ settings.name }}</div>
                                            <template v-if="settings.type === 'check'">
                                                <input type="checkbox" v-model="settings.value" class="form-checkbox h-5 w-5 text-blue-600" />
                                            </template>
                                            <template v-if="settings.type === 'string'">
                                                <textarea v-model="settings.value" @input="autoResize" class="border border-gray-700 p-2 bg-transparent rounded w-full resize-none overflow-hidden custom-textarea" rows="1" placeholder="Your text..."></textarea>
                                            </template>
                                            <template v-if="settings.type === 'list'">
                                                <div class="flex flex-col">
                                                    <div
                                                        v-for="(value, valueIndex) in settings.value"
                                                        :key="valueIndex"
                                                        class="flex"
                                                    >
                                                        <textarea
                                                            v-model="settings.value[valueIndex]"
                                                            @input="autoResize"
                                                            class="mb-1 border border-gray-700 p-2 bg-transparent rounded resize-none overflow-hidden custom-textarea"
                                                            rows="1"
                                                            placeholder="Your text..."
                                                        >
                                                        </textarea>
                                                        <template v-if="valueIndex===settings.value.length - 1">
                                                            <button class="ml-1 mb-1 px-4 py-0 text-s border hover:border-ngreenhover hover:text-ngreenhover border-gray-300 dark:border-gray-700 dark:hover:border-ngreenhover font-medium rounded-lg focus:outline-none whitespace-nowrap" @click="() => settings.value.push('')">
                                                                <font-awesome-icon icon="plus" />
                                                            </button>
                                                        </template>
                                                    </div>
                                                </div>
                                            </template>
                                            <template v-if="settings.type === 'numbers'">
                                                <input type="number" v-model="settings.value" :min="settings.value.value_min" :max="settings.value.value_max" :step="settings.value.value_step" @input="validateNumberInput(settings)" class="p-1 bg-transparent border-gray-600 dark:text-white border border-gray-300 focus:border-blue-500 rounded focus:outline-none focus:ring focus:ring-blue-200 text-gray-700 w-full" />
                                            </template>
                                            <template v-if="settings.type === 'select'">
                                                <select v-model="settings.value" class="block w-full p-2 border border-gray-700 bg-transparent rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white">
                                                    <option value="none" selected disabled hidden>Select an Option</option>
                                                    <option v-for="(option, optionsindex) in settings.value_options" :key="optionsindex" :value="option">{{ option }}</option>
                                                </select>
                                            </template>
                                            <template v-if="settings.type === 'multiselect'">
                                                <select v-model="settings.value" multiple class="block w-full p-1 bg-transparent border border-gray-500 rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700" style="background-color: transparent;">
                                                    <option v-for="(option, optionsindex) in settings.value_options" :key="optionsindex" :value="option">
                                                        {{ option }}
                                                    </option>
                                                </select>
                                            </template>
                                        </template>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                    <div>
                        <div class="font-medium pt-3 pb-3 border-b dark:border-gray-800 cursor-pointer" @click="showConfig = !showConfig">
                            <font-awesome-icon icon="gear" class="mr-2" />
                            Settings
                            <svg class="h-4 w-4 float-right mt-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{'transform rotate-180': showConfig}">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <transition
                            name="expand"
                            @before-enter="beforeEnter"
                            @enter="enter"
                            @after-enter="afterEnter"
                            @before-leave="beforeLeave"
                            @leave="leave"
                            @after-leave="afterLeave"
                        >
                            <div v-if="showConfig">
                                <template v-if="generatorData.generator_selected.showAddToCollectionPicker">
                                    <div class="text-sm my-2">
                                        Add results to collection
                                    </div>
                                    <CollectionPicker @collection-select="handleCollectionSelect"></CollectionPicker>
                                </template>
                                <template v-if="generatorData.generator_selected.showReplaceSelector">
                                    <div class="text-sm mt-2 border-b dark:border-gray-800 pb-4 pt-2" >
                                        <input type="checkbox" v-model="generatorData.replace_plugin_data" id="replacePluginData" />
                                        <label class="ml-2" for="replacePluginData">Overwrite previous results of same type</label>
                                    </div>
                                </template>
                            </div>
                        </transition>
                    </div>
                    <button class="px-8 py-2 mt-4 text-md bg-npurple text-white font-medium rounded-md focus:outline-none" @click="generatorStart">
                        <font-awesome-icon icon="wand-magic-sparkles" class="mr-1" />
                        Compute
                    </button>
                    <button class="float-right px-4 py-2 mt-4 text-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-medium rounded-md focus:outline-none" @click="closeModal">
                        Cancel
                    </button>
                </div>
            </template>
        </div>
    </modal>
</template>
<style scoped>
.expand-enter-active, .expand-leave-active {
    transition: height 0.1s ease-in-out;
    overflow: hidden;
}
</style>