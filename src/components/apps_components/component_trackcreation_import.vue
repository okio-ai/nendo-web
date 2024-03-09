<script setup>
import { reactive } from 'vue'
import { Dashboard } from '@uppy/vue'
import Uppy from '@uppy/core'
import XHR from '@uppy/xhr-upload'
import { useSessionStore } from '@/stores/session.js'
import CollectionPicker from '@/components/apps_components/component_collection_picker.vue'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'

const sessionStore = useSessionStore()

const BASE_API_URL = import.meta.env.VITE_API_URL

const emit = defineEmits(['file-upload-success', 'file-upload-error', 'file-upload-start', 'file-upload-cancel'])

// Define reactive data properties
const state = reactive({
    headers: {
        'X-Csrf-Token': 'xxxx',
        Authorization: `Bearer ${sessionStore.getToken()}`
    },
    hasFilesAdded: false,
    isUploading: false,
    collectionId: '',
    selectedGeneratorId: '',
    generator: [
        {
            id: '',
            name: ''
        },
        {
            id: 'musicanalysis',
            name: 'Music Analysis'
        },
        {
            id: 'voiceanalysis',
            name: 'Voice Analysis'
        }
    ]
})

const props = defineProps({
    accept: {
        type: String,
        default: 'audio/wav,audio/aiff,audio/mpeg,audio/flac,audio/ogg,application/zip,application/tar,application/gzip'
    },
    extensions: {
        type: String,
        default: '.mp3,.wav,.aiff,.aif,.flac,.ogg,.zip,.tar,.gz'
    }
})

const isDarkMode = document.documentElement.classList.contains('dark')

const closeModal = () => {
    if (!state.isUploading) {
        emit('file-upload-cancel')
    }
}

const handleCollectionSelect = (collectionId, collectionName) => {
    state.collectionId = collectionId
}

const getUploadUrl = () => {
    return `${BASE_API_URL}/api/v1/assets/audio?collection_id=${state.collectionId}&run_action=${state.selectedGeneratorId}`
}


const uppy = new Uppy({
    id: 'uppy',
    autoProceed: false,
    debug: false,
    restrictions: {
        maxFileSize: 1024 * 1024 * 200, // 200MB
        minNumberOfFiles: 1,
        allowedFileTypes: props.extensions.split(',')
    }
}).use(XHR, {
    endpoint: getUploadUrl(),
    headers: state.headers
})

// define event emitters
uppy.on('upload', (_) => {
    const xhrPlugin = uppy.getPlugin('XHRUpload')
    xhrPlugin.setOptions({
        endpoint: getUploadUrl()
    })

    state.isUploading = true
    emit('file-upload-start')
})

const cancelUpload = () => {
    uppy.cancelAll()
    state.isUploading = false
}

uppy.on('complete', (_) => {
    emit('file-upload-success')
})

uppy.on('error', (error) => {
    emit('file-upload-error', error)
})

uppy.on('file-added', (file) => {
    state.filesAdded = true
})


</script>

<template>
    <div class="flex flex-col justify-center px-1">
        <Dashboard
            :uppy="uppy"
            :plugins="['XHR']"
            :props="{
                proudlyDisplayPoweredByUppy: false,
                hideUploadButton: true,
                hideCancelButton: true,
                theme: isDarkMode ? 'dark' : 'light',
                inline: true,
                width: 600,
                height: 300
            }"
        />
        <div v-if="state.filesAdded">
            <div class="mt-6 text-gray-300 pb-3 font-bold text-npurple text-md">
                After upload
            </div>
            <div class="text-sm rounded mb-4">
                <div class="mb-4">
                    <div class="mb-2 text-md">
                        Add files to collection
                    </div>
                    <CollectionPicker @collection-select="handleCollectionSelect"></CollectionPicker>
                </div>
                <div>
                    <div class="mb-2 text-md">
                        Run tool on files
                    </div>
                    <select 
                            v-model="state.selectedGeneratorId"
                            :class="{ 'text-gray-400': !state.selectedGeneratorId, 'text-gray-800 dark:text-gray-300': state.selectedGeneratorId }"
                            class="block w-full p-2 border border-gray-600 dark:border-gray-700 rounded-md bg-transparent">
                        <option value="" disabled hidden>Select tool</option>
                        <option v-for="option in state.generator" :key="option.id" :value="option.id">
                            {{ option.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="mt-6">
            <button
                type="button"
                class="btn btn-success align-top rounded-md"
                v-if="!state.isUploading"
                @click="uppy.upload()"
            >
                <font-awesome-icon icon="upload" class="mr-1" />
                Start Upload
            </button>
            <button
                type="button"
                class="btn btn-danger align-top rounded-md"
                v-else
                @click="cancelUpload"
            >
                <font-awesome-icon icon="pause" class="mr-1" />
                Stop Upload
            </button>
            <button
                class="float-right px-4 py-2 text-md bg-gray-300 dark:bg-gray-800 hover:bg-npurple text-white font-medium rounded-lg focus:outline-none"
                @click="closeModal"
            >
                Cancel
            </button>
        </div>
    </div>
</template>

<style scoped>
.btn {
    padding: 0.5rem 1rem;
}

.btn-success {
    background-color: #5C59F6;
    color: white;
    font-weight: 500;
}

.btn-danger {
    border: 1px solid #ff5d5d;
    color: #ff5d5d;
    font-weight: 500;
}

table th {
    padding-top: 10px;
    padding-bottom: 10px;
}

th,
td {
    padding: 0px;
}

.example-full .edit-image img {
    max-width: 100%;
}

.example-full .drop-active h3 {
    margin: -0.5em 0 0;
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    -webkit-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);
    font-size: 40px;
    color: #fff;
    padding: 0;
}
</style>
